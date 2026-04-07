/**
 * @file health.test.ts
 * @description Testes básicos para os endpoints de infraestrutura (health check e 404).
 *
 * São os testes mais simples do projeto — verificam que o servidor responde
 * corretamente a rotas públicas e que o handler de 404 está funcionando.
 * Servem também como smoke test rápido para confirmar que a aplicação inicia.
 */
import request from 'supertest'
import app from '../index'

describe('GET /health', () => {
  it('deve retornar status ok com timestamp', async () => {
    const res = await request(app).get('/health')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body).toHaveProperty('timestamp')
  })
})

describe('Rota inexistente', () => {
  it('deve retornar 404 para rota não mapeada', async () => {
    const res = await request(app).get('/api/rota-que-nao-existe')

    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Rota não encontrada')
  })
})
