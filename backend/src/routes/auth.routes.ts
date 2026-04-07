/**
 * @module AuthRoutes
 * @description Definição das rotas de autenticação da API.
 *
 * Registra os endpoints públicos de registro e login, além do endpoint protegido
 * `/me` que retorna os dados do usuário autenticado. As rotas públicas não exigem
 * token JWT; o endpoint `/me` passa pelo middleware `authenticate` antes de
 * chegar ao controller.
 *
 * Cada rota pública possui validação de corpo com `express-validator`, centralizada
 * no middleware `validate`, que interrompe o fluxo e retorna 422 caso haja erros
 * de validação, sem chegar ao controller.
 *
 * As anotações `@openapi` são processadas pelo `swagger-jsdoc` para geração
 * automática da documentação interativa disponível em `/api/docs`.
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Cadastro de usuário
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               role: { type: string, enum: [user, admin] }
 *     responses:
 *       201:
 *         description: Usuário criado
 *       409:
 *         description: E-mail já cadastrado
 */
// Rota pública — não exige token. Valida os campos antes de chegar ao controller.
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Nome obrigatório'),
    body('email').isEmail().withMessage('E-mail inválido'),
    // Senha mínima de 6 caracteres — o hash bcrypt é aplicado no model
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter ao menos 6 caracteres'),
  ],
  validate,
  AuthController.register
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *       401:
 *         description: Credenciais inválidas
 */
// Rota pública — valida apenas formato dos campos, a verificação de credenciais fica no controller
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('E-mail inválido'),
    body('password').notEmpty().withMessage('Senha obrigatória'),
  ],
  validate,
  AuthController.login
);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Dados do usuário autenticado
 *     responses:
 *       200:
 *         description: Dados do usuário
 */
// Rota protegida — o middleware `authenticate` valida o JWT e popula req.user antes do controller
router.get('/me', authenticate, AuthController.me);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('E-mail inválido')],
  validate,
  AuthController.forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token obrigatório'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter ao menos 6 caracteres'),
  ],
  validate,
  AuthController.resetPassword
);

export default router;
