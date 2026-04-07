/**
 * @module App
 * @description Ponto de entrada principal do servidor Express.
 *
 * Configura e inicializa a aplicação HTTP com todos os middlewares globais,
 * documentação Swagger, rotas da API, tratamento de rotas não encontradas (404)
 * e handler centralizado de erros (500).
 *
 * A inicialização de variáveis de ambiente via `dotenv/config` é feita no topo
 * do arquivo para garantir que todas as configurações estejam disponíveis antes
 * de qualquer outro módulo ser carregado (ex.: conexão com o banco de dados
 * importada indiretamente pelas rotas).
 *
 * O módulo exporta a instância `app` para facilitar testes de integração que
 * precisam montar o servidor sem iniciar o listener HTTP (ex.: com supertest).
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import logger from './config/logger';

import authRoutes from './routes/auth.routes';
import clientRoutes from './routes/client.routes';
import taskRoutes from './routes/task.routes';

const app = express();

// Habilita CORS para todas as origens — em produção, considerar restringir às origens permitidas
app.use(cors());

// Habilita parsing de JSON no body das requisições; payloads não-JSON retornarão 400 automaticamente
app.use(express.json());

// Middleware de log de requisições: registra método e path de cada chamada recebida
// Utiliza nível 'debug' para não poluir logs de produção quando o nível mínimo for 'info'
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Monta a interface Swagger UI — documentação interativa gerada a partir das anotações @openapi
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Registra as rotas da API sob o prefixo /api para facilitar versionamento futuro
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);

// Endpoint de health check — utilizado por load balancers e ferramentas de monitoramento
// Não requer autenticação e deve retornar 200 enquanto o processo estiver saudável
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Handler de rota não encontrada (404) — captura qualquer path que não foi tratado pelas rotas acima
// Deve ser registrado após todas as rotas para funcionar como fallback
app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

// Handler centralizado de erros não tratados (500)
// Express identifica este middleware pela assinatura de 4 parâmetros (err, req, res, next)
// Deve ser o último middleware registrado para capturar erros de toda a cadeia
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err.message, err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Inicia o servidor HTTP na porta configurada via variável de ambiente, com fallback para 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Swagger docs at http://localhost:${PORT}/api/docs`);
});

// Exporta a instância para uso em testes de integração com supertest
export default app;
