/**
 * @module AuthController
 * @description Controller responsável pelo fluxo de autenticação da aplicação.
 *
 * Expõe três endpoints: registro de novo usuário, login com credenciais e
 * recuperação dos dados do usuário autenticado. Em todos os casos, o controller
 * delega a lógica de persistência ao `UserModel` e a geração de tokens ao
 * utilitário interno `generateToken`.
 *
 * A função `generateToken` é mantida neste módulo por ser exclusiva do fluxo
 * de autenticação. Se a geração de tokens for necessária em outros contextos
 * (ex.: refresh token), ela deve ser extraída para um serviço dedicado.
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserModel } from '../models/user.model';
import { EmailService } from '../services/email.service';
import logger from '../config/logger';

/**
 * Gera um JSON Web Token assinado com a chave secreta da aplicação.
 *
 * O payload contém apenas os dados mínimos necessários para identificar e
 * autorizar o usuário nas requisições subsequentes, evitando o acúmulo de
 * informações desnecessárias no token (princípio do menor privilégio).
 *
 * A expiração é configurável via variável de ambiente `JWT_EXPIRES_IN`,
 * com fallback para 7 dias — tempo suficientemente longo para UX sem sessões
 * persistentes, mas que força renovação em caso de comprometimento.
 *
 * @param payload - Dados do usuário a serem incluídos no token.
 * @returns String JWT assinada e pronta para ser enviada ao cliente.
 */
function generateToken(payload: { id: number; email: string; role: string }) {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
  });
}

export const AuthController = {
  /**
   * Registra um novo usuário na plataforma.
   *
   * Verifica previamente se o e-mail já está em uso para retornar um erro 409
   * (Conflict) ao invés de deixar o banco lançar uma violação de constraint
   * única, o que tornaria a mensagem de erro menos clara para o cliente.
   *
   * Após a criação bem-sucedida, retorna o token JWT junto com os dados públicos
   * do usuário, permitindo que o frontend já inicie a sessão autenticada sem
   * precisar fazer uma segunda requisição de login.
   *
   * @param req - Requisição com `name`, `email`, `password` e `role` (opcional) no body.
   * @param res - Resposta HTTP. Retorna 201 com `{ user, token }` em caso de sucesso.
   *              Retorna 409 se o e-mail já estiver cadastrado.
   *              Retorna 500 em caso de erro inesperado.
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role } = req.body;

      // Verifica duplicidade antes de tentar o INSERT para fornecer mensagem de erro clara
      const existing = await UserModel.findByEmail(email);
      if (existing) {
        res.status(409).json({ error: 'E-mail já cadastrado' });
        return;
      }

      const user = await UserModel.create({ name, email, password, role });
      // Gera o token imediatamente após o registro para autenticar o usuário na mesma resposta
      const token = generateToken({ id: user.id, email: user.email, role: user.role });

      logger.info(`User registered: ${email}`);
      res.status(201).json({ user, token });
    } catch (err) {
      logger.error('Register error', err);
      res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
  },

  /**
   * Autentica um usuário existente com e-mail e senha.
   *
   * Ambas as verificações (usuário não encontrado e senha inválida) retornam
   * o mesmo código 401 com a mesma mensagem genérica "Credenciais inválidas".
   * Essa uniformidade é intencional: respostas distintas permitiriam a um
   * atacante enumerar e-mails válidos na base (enumeração de usuários).
   *
   * O campo `password` é removido do objeto retornado via desestruturação,
   * garantindo que o hash nunca saia da camada de serviço.
   *
   * @param req - Requisição com `email` e `password` no body.
   * @param res - Resposta HTTP. Retorna 200 com `{ user, token }` em caso de sucesso.
   *              Retorna 401 para credenciais inválidas (usuário inexistente ou senha errada).
   *              Retorna 500 em caso de erro inesperado.
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Mensagem genérica proposital: não revela se o e-mail existe ou não
        res.status(401).json({ error: 'Credenciais inválidas' });
        return;
      }

      const valid = await UserModel.comparePassword(password, user.password);
      if (!valid) {
        // Mesma mensagem que o caso anterior para evitar enumeração de usuários
        res.status(401).json({ error: 'Credenciais inválidas' });
        return;
      }

      const token = generateToken({ id: user.id, email: user.email, role: user.role });
      // Desestrutura para remover o hash da senha antes de enviar ao cliente
      const { password: _, ...userPublic } = user;

      logger.info(`User logged in: ${email}`);
      res.json({ user: userPublic, token });
    } catch (err) {
      logger.error('Login error', err);
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  },

  /**
   * Retorna os dados do usuário atualmente autenticado.
   *
   * Este endpoint depende do middleware `authenticate`, que popula `req.user`
   * com o payload decodificado do JWT antes de chegar aqui. Por isso, o acesso
   * a `req.user!.id` é seguro neste contexto (o `!` reflete essa garantia).
   *
   * Busca os dados atualizados do banco em vez de retornar o payload do token,
   * garantindo que alterações de perfil feitas após a emissão do token sejam
   * refletidas nesta resposta.
   *
   * @param req - Requisição autenticada, com `req.user.id` preenchido pelo middleware.
   * @param res - Resposta HTTP. Retorna 200 com os dados públicos do usuário.
   *              Retorna 500 em caso de erro inesperado.
   */
  async me(req: Request & { user?: { id: number } }, res: Response): Promise<void> {
    try {
      const user = await UserModel.findById(req.user!.id);
      res.json(user);
    } catch (err) {
      logger.error('Me error', err);
      res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
  },

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      // Resposta genérica independente de o e-mail existir (evita enumeração)
      const genericOk = () => res.json({ message: 'Se o e-mail estiver cadastrado, você receberá as instruções.' });

      const user = await UserModel.findByEmail(email);
      if (!user) { genericOk(); return; }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
      await UserModel.setResetToken(email, token, expiresAt);

      try {
        await EmailService.sendPasswordReset(email, token);
      } catch (mailErr) {
        logger.error('Failed to send reset email', mailErr);
        // Não expõe o erro de e-mail ao cliente — o token foi salvo e pode ser reusado
      }

      genericOk();
    } catch (err) {
      logger.error('Forgot password error', err);
      res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
  },

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;

      const user = await UserModel.findByResetToken(token);
      if (!user) {
        res.status(400).json({ error: 'Token inválido ou expirado' });
        return;
      }

      await UserModel.resetPassword(user.id, password);
      logger.info(`Password reset for user ${user.email}`);
      res.json({ message: 'Senha redefinida com sucesso' });
    } catch (err) {
      logger.error('Reset password error', err);
      res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
  },
};
