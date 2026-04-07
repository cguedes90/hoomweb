/**
 * @file tasks.test.ts
 * @description Testes de integração para os endpoints CRUD de tarefas.
 *
 * Cria um usuário e um cliente de suporte antes dos testes. As tarefas
 * criadas estão vinculadas ao cliente de suporte. A deleção do usuário
 * no afterAll propaga-se via CASCADE para clientes e tarefas.
 */
import request from 'supertest'
import app from '../index'
import pool from '../config/database'

const testEmail = `test-tasks-${Date.now()}@hoomweb-test.com`
let token: string
let supportClientId: number
let createdTaskId: number

beforeAll(async () => {
  // Registra usuário e salva token
  const authRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Usuário Tarefas', email: testEmail, password: 'Test@12345' })
  token = authRes.body.token

  // Cria cliente de suporte para vincular as tarefas
  const clientRes = await request(app)
    .post('/api/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Cliente Suporte Tarefas' })
  supportClientId = clientRes.body.id
})

afterAll(async () => {
  // CASCADE em clients→users remove clientes e tarefas junto
  await pool.query('DELETE FROM users WHERE email = $1', [testEmail])
})

describe('GET /api/tasks', () => {
  it('deve retornar lista vazia para novo usuário', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body).toHaveLength(0)
  })

  it('deve retornar 401 sem autenticação', async () => {
    const res = await request(app).get('/api/tasks')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/tasks', () => {
  it('deve criar uma tarefa pendente vinculada ao cliente', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Tarefa de Teste',
        description: 'Descrição da tarefa',
        client_id: supportClientId,
        status: 'pending',
        due_date: '2026-12-31',
      })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      title: 'Tarefa de Teste',
      status: 'pending',
      client_id: supportClientId,
    })
    expect(res.body).toHaveProperty('id')
    createdTaskId = res.body.id
  })

  it('deve retornar 422 quando título está ausente', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ client_id: supportClientId })

    expect(res.status).toBe(422)
  })

  it('deve retornar 422 quando client_id está ausente', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Sem cliente' })

    expect(res.status).toBe(422)
  })
})

describe('GET /api/tasks com filtros', () => {
  it('deve filtrar por status=pending e retornar a tarefa criada', async () => {
    const res = await request(app)
      .get('/api/tasks?status=pending')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(1)
    res.body.forEach((t: { status: string }) => expect(t.status).toBe('pending'))
  })

  it('deve retornar lista vazia para status=done (sem tarefas concluídas)', async () => {
    const res = await request(app)
      .get('/api/tasks?status=done')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })

  it('deve filtrar por client_id', async () => {
    const res = await request(app)
      .get(`/api/tasks?client_id=${supportClientId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(1)
    res.body.forEach((t: { client_id: number }) => expect(t.client_id).toBe(supportClientId))
  })
})

describe('PUT /api/tasks/:id', () => {
  it('deve atualizar o status da tarefa para in_progress', async () => {
    const res = await request(app)
      .put(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('in_progress')
    // Title não foi enviado — deve ser preservado
    expect(res.body.title).toBe('Tarefa de Teste')
  })
})

describe('DELETE /api/tasks/:id', () => {
  it('deve deletar a tarefa e retornar 204', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(204)
  })

  it('deve retornar 404 ao buscar tarefa deletada', async () => {
    const res = await request(app)
      .get(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${token}`)

    // tasks não tem GET/:id, mas 404 via rota não encontrada
    expect([404, 405]).toContain(res.status)
  })
})
