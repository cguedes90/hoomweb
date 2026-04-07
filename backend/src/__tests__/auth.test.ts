/**
 * @file auth.test.ts
 * @description Testes de integração para os endpoints de autenticação.
 *
 * Utiliza supertest para fazer requisições HTTP reais à aplicação Express sem
 * iniciar um servidor na porta — o supertest monta o app diretamente. O banco
 * de dados utilizado é o real (Neon), e os dados de teste são removidos no
 * teardown para manter o banco limpo entre execuções.
 *
 * Estratégia de isolamento: cada suíte usa um e-mail único com sufixo aleatório
 * para evitar conflitos entre execuções paralelas ou consecutivas.
 */
import request from 'supertest'
import app from '../index'
import pool from '../config/database'

// E-mail único por execução para evitar conflito de constraint UNIQUE
const testEmail = `test-auth-${Date.now()}@hoomweb-test.com`
const testPassword = 'Test@12345'
const testName = 'Usuário de Teste'

afterAll(async () => {
  // Remove o usuário criado pelos testes (pool é fechado pelo globalTeardown)
  await pool.query('DELETE FROM users WHERE email = $1', [testEmail])
})

describe('POST /api/auth/register', () => {
  it('deve registrar um novo usuário e retornar token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: testName, email: testEmail, password: testPassword })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user).toMatchObject({
      email: testEmail,
      name: testName,
      role: 'user',
    })
    // Senha nunca deve sair da API
    expect(res.body.user).not.toHaveProperty('password')
  })

  it('deve retornar 409 ao tentar registrar e-mail duplicado', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: testName, email: testEmail, password: testPassword })

    expect(res.status).toBe(409)
    expect(res.body.error).toBe('E-mail já cadastrado')
  })

  it('deve retornar 422 quando campos obrigatórios estão ausentes', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'sem-nome@test.com' })

    expect(res.status).toBe(422)
  })
})

describe('POST /api/auth/login', () => {
  it('deve autenticar com credenciais válidas e retornar token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user.email).toBe(testEmail)
    expect(res.body.user).not.toHaveProperty('password')
  })

  it('deve retornar 401 para senha incorreta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'senha-errada' })

    expect(res.status).toBe(401)
    // Mensagem genérica — não deve revelar se o e-mail existe
    expect(res.body.error).toBe('Credenciais inválidas')
  })

  it('deve retornar 401 para e-mail inexistente', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'naoexiste@test.com', password: '123456' })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Credenciais inválidas')
  })
})

describe('GET /api/auth/me', () => {
  let token: string

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword })
    token = res.body.token
  })

  it('deve retornar os dados do usuário autenticado', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.email).toBe(testEmail)
    expect(res.body).not.toHaveProperty('password')
  })

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('deve retornar 401 com token inválido', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token.invalido.aqui')

    expect(res.status).toBe(401)
  })
})
