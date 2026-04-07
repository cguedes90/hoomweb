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
router.get('/cep/:cep', authenticate, ClientController.lookupCep);

export default router;
