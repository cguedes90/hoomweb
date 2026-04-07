/**
 * @module ClientRoutes
 * @description Definição das rotas de gerenciamento de clientes da API.
 *
 * Todas as rotas deste módulo são protegidas pelo middleware `authenticate`,
 * que verifica o token JWT e garante que apenas usuários autenticados possam
 * acessar ou modificar dados de clientes.
 *
 * Atenção ao ordenamento das rotas: a rota `/cep/:cep` deve ser registrada
 * ANTES de `/:id`, pois o Express faz o match da primeira rota que satisfaz
 * o padrão. Se `/:id` viesse primeiro, a requisição para `/cep/01310100`
 * seria capturada com `req.params.id = "cep"`, causando comportamento incorreto.
 *
 * As anotações `@openapi` são utilizadas pelo `swagger-jsdoc` para geração
 * automática da documentação em `/api/docs`.
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { ClientController } from '../controllers/client.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

/**
 * @openapi
 * /api/clients:
 *   get:
 *     tags: [Clients]
 *     summary: Listar clientes
 *     responses:
 *       200:
 *         description: Lista de clientes
 */
// Retorna todos os clientes do usuário autenticado, ordenados por nome
router.get('/', authenticate, ClientController.list);

/**
 * @openapi
 * /api/clients/{id}:
 *   get:
 *     tags: [Clients]
 *     summary: Buscar cliente por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *       404:
 *         description: Não encontrado
 */
// Busca um cliente específico; retorna 404 se não pertencer ao usuário autenticado
router.get('/:id', authenticate, ClientController.getOne);

/**
 * @openapi
 * /api/clients:
 *   post:
 *     tags: [Clients]
 *     summary: Criar cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               document: { type: string }
 *               zipcode: { type: string }
 *               street: { type: string }
 *               number: { type: string }
 *               complement: { type: string }
 *               neighborhood: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *     responses:
 *       201:
 *         description: Cliente criado
 */
// Apenas `name` é obrigatório; demais campos de endereço e contato são opcionais
router.post(
  '/',
  authenticate,
  [body('name').notEmpty().withMessage('Nome obrigatório')],
  validate,
  ClientController.create
);

/**
 * @openapi
 * /api/clients/{id}:
 *   put:
 *     tags: [Clients]
 *     summary: Atualizar cliente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Cliente atualizado
 */
// Atualização parcial: apenas os campos presentes no body serão modificados
router.put('/:id', authenticate, ClientController.update);

/**
 * @openapi
 * /api/clients/{id}:
 *   delete:
 *     tags: [Clients]
 *     summary: Deletar cliente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Deletado
 */
// Retorna 204 sem body em caso de sucesso; pode remover tarefas em cascata no banco
router.delete('/:id', authenticate, ClientController.remove);

/**
 * @openapi
 * /api/clients/cep/{cep}:
 *   get:
 *     tags: [Clients]
 *     summary: Consultar endereço por CEP
 *     parameters:
 *       - in: path
 *         name: cep
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Dados do endereço
 */
// IMPORTANTE: esta rota deve ser declarada antes de /:id para evitar conflito de matching
router.get('/cep/:cep', authenticate, ClientController.lookupCep);

export default router;
