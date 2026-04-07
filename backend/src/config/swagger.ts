/**
 * Configuração da documentação automática da API com Swagger/OpenAPI 3.0.
 *
 * As anotações JSDoc no formato @openapi presentes nos arquivos de rotas
 * são lidas pelo swagger-jsdoc e combinadas neste spec. A interface interativa
 * é servida pelo swagger-ui-express em /api/docs.
 *
 * Autenticação: todas as rotas protegidas esperam o header:
 *   Authorization: Bearer <token_jwt>
 */
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hoomweb API',
      version: '1.0.0',
      description: 'API REST para o Sistema de Gestão de Clientes e Tarefas',
    },
    components: {
      securitySchemes: {
        // Esquema de autenticação Bearer JWT reutilizado por todas as rotas protegidas
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    // Aplica autenticação JWT globalmente (pode ser sobrescrito com security: [] por rota)
    security: [{ bearerAuth: [] }],
  },
  // Lê as anotações @openapi de todos os arquivos de rotas
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
