import pool from '../config/database';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  created_at: Date;
  updated_at: Date;
}

export type UserPublic = Omit<User, 'password'>;

export const UserModel = {
  async create(data: { name: string; email: string; password: string; role?: string }): Promise<UserPublic> {
    const hash = await bcrypt.hash(data.password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at, updated_at`,
      [data.name, data.email, hash, data.role || 'user']
    );
    return rows[0];
  },

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },

  async findById(id: number): Promise<UserPublic | null> {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  },
};
