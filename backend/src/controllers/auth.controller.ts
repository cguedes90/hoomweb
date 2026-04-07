import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';
import logger from '../config/logger';

function generateToken(payload: { id: number; email: string; role: string }) {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
  });
}

export const AuthController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role } = req.body;

      const existing = await UserModel.findByEmail(email);
      if (existing) {
        res.status(409).json({ error: 'E-mail já cadastrado' });
        return;
      }

      const user = await UserModel.create({ name, email, password, role });
      const token = generateToken({ id: user.id, email: user.email, role: user.role });

      logger.info(`User registered: ${email}`);
      res.status(201).json({ user, token });
    } catch (err) {
      logger.error('Register error', err);
      res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await UserModel.findByEmail(email);
      if (!user) {
        res.status(401).json({ error: 'Credenciais inválidas' });
        return;
      }

      const valid = await UserModel.comparePassword(password, user.password);
      if (!valid) {
        res.status(401).json({ error: 'Credenciais inválidas' });
        return;
      }

      const token = generateToken({ id: user.id, email: user.email, role: user.role });
      const { password: _, ...userPublic } = user;

      logger.info(`User logged in: ${email}`);
      res.json({ user: userPublic, token });
    } catch (err) {
      logger.error('Login error', err);
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  },

  async me(req: Request & { user?: { id: number } }, res: Response): Promise<void> {
    try {
      const user = await UserModel.findById(req.user!.id);
      res.json(user);
    } catch (err) {
      logger.error('Me error', err);
      res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
  },
};
