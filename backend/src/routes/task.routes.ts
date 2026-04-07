/**
 * @module TaskRoutes
 * @description Definição das rotas de gerenciamento de tarefas da API.
 *
 * Todas as rotas são protegidas pelo middleware `authenticate`. O endpoint de
 * listagem aceita parâmetros de query opcionais para filtragem por status e
 * por cliente, evitando a necessidade de endpoints separados para cada filtro.
 *
 * O campo `status` é validado em criação e atualização para garantir que
 * apenas valores do enum `TaskStatus` sejam persistidos no banco.
 *
 * As anotações `@openapi` são utilizadas pelo `swagger-jsdoc` para geração
 * automática da documentação em `/api/docs`.
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { TaskController } from '../controllers/task.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

/**
 * @openapi
 * /api/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: Listar tarefas com filtros
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, in_progress, done, cancelled] }
 *       - in: query
 *         name: client_id
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista de tarefas
 */
// Os filtros são opcionais e cumulativos: ambos podem ser omitidos, usados separadamente ou juntos
router.get('/', authenticate, TaskController.list);

/**
 * @openapi
 * /api/tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Buscar tarefa por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Tarefa encontrada
 */
// Retorna a tarefa com o campo `client_name` via JOIN no model
router.get('/:id', authenticate, TaskController.getOne);

/**
 * @openapi
 * /api/tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Criar tarefa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, client_id]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [pending, in_progress, done, cancelled] }
 *               due_date: { type: string, format: date }
 *               client_id: { type: integer }
 *     responses:
 *       201:
 *         description: Tarefa criada
 */
router.post(
  '/',
  authenticate,
  [
    body('title').notEmpty().withMessage('Título obrigatório'),
    // client_id deve ser um inteiro positivo — referência a um cliente existente do usuário
    body('client_id').isInt({ min: 1 }).withMessage('Cliente obrigatório'),
    // status é opcional na criação; o model assume 'pending' como valor padrão
    body('status').optional().isIn(['pending', 'in_progress', 'done', 'cancelled']),
  ],
  validate,
  TaskController.create
);

/**
 * @openapi
 * /api/tasks/{id}:
 *   put:
 *     tags: [Tasks]
 *     summary: Atualizar tarefa
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Tarefa atualizada
 */
router.put(
  '/:id',
  authenticate,
  // Na atualização, apenas o status precisa ser validado se presente no body
  [body('status').optional().isIn(['pending', 'in_progress', 'done', 'cancelled'])],
  validate,
  TaskController.update
);

/**
 * @openapi
 * /api/tasks/{id}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Deletar tarefa
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Deletada
 */
// Retorna 204 sem corpo em caso de sucesso
router.delete('/:id', authenticate, TaskController.remove);

export default router;
