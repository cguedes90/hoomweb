/**
 * Middleware de autenticação e autorização via JWT.
 *
 * Fluxo de autenticação:
 *  1. Extrai o token do header "Authorization: Bearer <token>"
 *  2. Verifica a assinatura e a validade do JWT com a chave secreta
 *  3. Confirma que o usuário ainda existe no banco de dados
 *  4. Injeta os dados do usuário em req.user para uso nos controllers
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';

/**
 * Extensão da interface padrão Request do Express.
 * Permite que controllers tipados acessem req.user com segurança.
 */
export interface AuthRequest extends Request {
  user?: { id: number; email: string; role: string };
}

/**
 * Protege rotas que exigem autenticação.
 * Deve ser adicionado como middleware antes do handler da rota.
 */
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  // Rejeita requisições sem o header ou com formato diferente de "Bearer <token>"
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }

  // Extrai apenas o token (remove o prefixo "Bearer ")
  const token = authHeader.split(' ')[1];

  try {
    // Verifica assinatura e decodifica o payload; lança exceção se inválido/expirado
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      email: string;
      role: string;
    };

    // Valida que o usuário ainda existe (pode ter sido removido após o login)
    const user = await UserModel.findById(payload.id);
    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado' });
      return;
    }

    // Injeta os dados do usuário para uso nos controllers seguintes
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

/**
 * Restringe o acesso a usuários com perfil "admin".
 * Deve ser usado em conjunto com o middleware authenticate.
 *
 * Exemplo de uso em rota:
 *   router.delete('/users/:id', authenticate, requireAdmin, handler)
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Acesso restrito a administradores' });
    return;
  }
  next();
}
