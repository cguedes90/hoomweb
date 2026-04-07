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
    body('client_id').isInt({ min: 1 }).withMessage('Cliente obrigatório'),
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
router.delete('/:id', authenticate, TaskController.remove);

export default router;
