/**
 * @module UserModel
 * @description Modelo de dados para a entidade Usuário.
 *
 * Encapsula todas as operações de persistência relacionadas a usuários no banco
 * de dados PostgreSQL, incluindo criação com hash de senha, busca por e-mail ou
 * ID e validação de credenciais. A camada de model nunca expõe o campo `password`
 * nas consultas de leitura por ID, garantindo que dados sensíveis não sejam
 * trafegados desnecessariamente pela aplicação.
 */

import pool from '../config/database';
import bcrypt from 'bcryptjs';

/**
 * Representa um usuário completo conforme armazenado no banco de dados.
 * O campo `password` contém o hash bcrypt, nunca a senha em texto simples.
 */
export interface User {
  id: number;
  name: string;
  email: string;
  /** Hash bcrypt da senha. Nunca deve ser exposto em respostas de API. */
  password: string;
  role: 'admin' | 'user';
  created_at: Date;
  updated_at: Date;
}

/**
 * Versão pública do usuário, sem o campo `password`.
 * Utilizada em todas as respostas da API que retornam dados do usuário.
 */
export type UserPublic = Omit<User, 'password'>;

export const UserModel = {
  /**
   * Cria um novo usuário no banco de dados.
   *
   * O hash da senha é gerado com fator de custo 12, o que oferece um bom
   * equilíbrio entre segurança e performance. A query usa RETURNING para
   * evitar um segundo SELECT após o INSERT.
   *
   * @param data - Dados do novo usuário. O campo `role` é opcional e assume
   *               o valor padrão 'user' quando omitido.
   * @returns O usuário criado sem o campo `password`.
   */
  async create(data: { name: string; email: string; password: string; role?: string }): Promise<UserPublic> {
    // Gera o hash com custo 12 — aumentar esse valor aumenta o tempo de processamento
    // e dificulta ataques de força bruta, mas impacta a latência do endpoint de registro
    const hash = await bcrypt.hash(data.password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at, updated_at`,
      [data.name, data.email, hash, data.role || 'user']
    );
    return rows[0];
  },

  /**
   * Busca um usuário pelo endereço de e-mail.
   *
   * Este método retorna o objeto completo, incluindo o hash da senha, pois
   * é utilizado exclusivamente pelo fluxo de autenticação para validar credenciais.
   * Fora desse contexto, prefira `findById`, que retorna o tipo `UserPublic`.
   *
   * @param email - E-mail do usuário a ser localizado.
   * @returns O usuário encontrado (com senha) ou `null` se não existir.
   */
  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    // Retorna null em vez de undefined para facilitar verificações explícitas no controller
    return rows[0] || null;
  },

  /**
   * Busca um usuário pelo seu ID primário.
   *
   * A query seleciona explicitamente as colunas, omitindo `password`, de modo
   * que o retorno seja sempre seguro para ser enviado ao cliente.
   *
   * @param id - ID numérico do usuário.
   * @returns Dados públicos do usuário ou `null` se não encontrado.
   */
  async findById(id: number): Promise<UserPublic | null> {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Verifica se uma senha em texto simples corresponde a um hash bcrypt armazenado.
   *
   * Utiliza `bcrypt.compare`, que é resistente a ataques de timing ao realizar
   * a comparação em tempo constante independentemente do resultado.
   *
   * @param plain - Senha fornecida pelo usuário no login.
   * @param hash  - Hash bcrypt armazenado no banco de dados.
   * @returns `true` se a senha é válida, `false` caso contrário.
   */
  async comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  },
};
