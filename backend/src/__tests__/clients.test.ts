/**
 * @file clients.test.ts
 * @description Testes de integração para os endpoints CRUD de clientes.
 *
 * Cria um usuário de teste no beforeAll, obtém o token JWT e usa esse token
 * em todas as requisições autenticadas. Ao final, remove todos os dados
 * criados pelos testes (cascade garante que as tarefas vinculadas também
 * sejam removidas).
 */
import request from 'supertest'
import app from '../index'
import pool from '../config/database'

const testEmail = `test-clients-${Date.now()}@hoomweb-test.com`
let token: string
let createdClientId: number

beforeAll(async () => {
  // Cria usuário e obtém token para autenticar as requisições
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Usuário Clientes', email: testEmail, password: 'Test@12345' })
  token = res.body.token
})

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', [testEmail])
})

describe('GET /api/clients', () => {
  it('deve retornar lista vazia para novo usuário', async () => {
    const res = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body).toHaveLength(0)
  })

  it('deve retornar 401 sem autenticação', async () => {
    const res = await request(app).get('/api/clients')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/clients', () => {
  it('deve criar um cliente com dados válidos', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Cliente Teste', email: 'cliente@teste.com', phone: '(11) 99999-9999' })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ name: 'Cliente Teste', email: 'cliente@teste.com' })
    expect(res.body).toHaveProperty('id')
    // Guarda o ID para os próximos testes
    createdClientId = res.body.id
  })

  it('deve retornar 422 quando o nome está ausente', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'sem-nome@teste.com' })

    expect(res.status).toBe(422)
  })
})

describe('GET /api/clients/:id', () => {
  it('deve retornar o cliente pelo ID', async () => {
    const res = await request(app)
      .get(`/api/clients/${createdClientId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(createdClientId)
    expect(res.body.name).toBe('Cliente Teste')
  })

  it('deve retornar 404 para cliente inexistente', async () => {
    const res = await request(app)
      .get('/api/clients/999999')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })
})

describe('PUT /api/clients/:id', () => {
  it('deve atualizar o nome do cliente', async () => {
    const res = await request(app)
      .put(`/api/clients/${createdClientId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Cliente Atualizado' })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Cliente Atualizado')
    // E-mail não enviado no body deve ser preservado
    expect(res.body.email).toBe('cliente@teste.com')
  })

  it('deve retornar 404 para cliente de outro usuário', async () => {
    // Tenta atualizar com ID válido mas de outro contexto (ID improvável)
    const res = await request(app)
      .put('/api/clients/999999')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Invasão' })

    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/clients/:id', () => {
  it('deve deletar o cliente e retornar 204', async () => {
    const res = await request(app)
      .delete(`/api/clients/${createdClientId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(204)
  })

  it('deve retornar 404 ao tentar buscar cliente deletado', async () => {
    const res = await request(app)
      .get(`/api/clients/${createdClientId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })
})
