/**
 * Middleware de validação de entrada.
 *
 * Centraliza a verificação dos erros gerados pelas regras do express-validator
 * definidas nas rotas. Se houver algum erro de validação, interrompe a requisição
 * e retorna HTTP 422 com a lista de erros antes de chegar ao controller.
 */
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Verifica se os validators da rota encontraram erros.
 * Em caso positivo, retorna 422 Unprocessable Entity com os detalhes.
 * Em caso negativo, chama next() e segue para o controller.
 */
export function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Retorna todos os erros encontrados para facilitar o diagnóstico no cliente
    res.status(422).json({ errors: errors.array() });
    return;
  }
  next();
}
