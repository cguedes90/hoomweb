import pool from '../config/database';

export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  zipcode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export type ClientInput = Omit<Client, 'id' | 'created_at' | 'updated_at'>;

export const ClientModel = {
  async create(data: ClientInput): Promise<Client> {
    const { rows } = await pool.query(
      `INSERT INTO clients
        (name, email, phone, document, zipcode, street, number, complement, neighborhood, city, state, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        data.name, data.email, data.phone, data.document,
        data.zipcode, data.street, data.number, data.complement,
        data.neighborhood, data.city, data.state, data.user_id,
      ]
    );
    return rows[0];
  },

  async findAll(userId: number): Promise<Client[]> {
    const { rows } = await pool.query(
      'SELECT * FROM clients WHERE user_id = $1 ORDER BY name',
      [userId]
    );
    return rows;
  },

  async findById(id: number, userId: number): Promise<Client | null> {
    const { rows } = await pool.query(
      'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rows[0] || null;
  },

  async update(id: number, userId: number, data: Partial<ClientInput>): Promise<Client | null> {
    const fields = Object.keys(data).filter(k => k !== 'user_id');
    if (fields.length === 0) return this.findById(id, userId);

    const sets = fields.map((f, i) => `${f} = $${i + 3}`).join(', ');
    const values = fields.map(f => (data as Record<string, unknown>)[f]);

    const { rows } = await pool.query(
      `UPDATE clients SET ${sets}, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId, ...values]
    );
    return rows[0] || null;
  },

  async delete(id: number, userId: number): Promise<boolean> {
    const { rowCount } = await pool.query(
      'DELETE FROM clients WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return (rowCount ?? 0) > 0;
  },
};
