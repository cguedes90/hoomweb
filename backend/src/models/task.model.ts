import pool from '../config/database';

export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'cancelled';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  due_date?: Date;
  client_id: number;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export type TaskInput = Omit<Task, 'id' | 'created_at' | 'updated_at'>;

export interface TaskFilters {
  status?: TaskStatus;
  client_id?: number;
}

export const TaskModel = {
  async create(data: TaskInput): Promise<Task> {
    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description, status, due_date, client_id, user_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [data.title, data.description, data.status || 'pending', data.due_date, data.client_id, data.user_id]
    );
    return rows[0];
  },

  async findAll(userId: number, filters: TaskFilters = {}): Promise<Task[]> {
    const conditions: string[] = ['t.user_id = $1'];
    const values: unknown[] = [userId];
    let idx = 2;

    if (filters.status) {
      conditions.push(`t.status = $${idx++}`);
      values.push(filters.status);
    }
    if (filters.client_id) {
      conditions.push(`t.client_id = $${idx++}`);
      values.push(filters.client_id);
    }

    const { rows } = await pool.query(
      `SELECT t.*, c.name AS client_name
       FROM tasks t
       JOIN clients c ON c.id = t.client_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY t.created_at DESC`,
      values
    );
    return rows;
  },

  async findById(id: number, userId: number): Promise<Task | null> {
    const { rows } = await pool.query(
      `SELECT t.*, c.name AS client_name
       FROM tasks t
       JOIN clients c ON c.id = t.client_id
       WHERE t.id = $1 AND t.user_id = $2`,
      [id, userId]
    );
    return rows[0] || null;
  },

  async update(id: number, userId: number, data: Partial<TaskInput>): Promise<Task | null> {
    const allowed = ['title', 'description', 'status', 'due_date', 'client_id'];
    const fields = Object.keys(data).filter(k => allowed.includes(k));
    if (fields.length === 0) return this.findById(id, userId);

    const sets = fields.map((f, i) => `${f} = $${i + 3}`).join(', ');
    const values = fields.map(f => (data as Record<string, unknown>)[f]);

    const { rows } = await pool.query(
      `UPDATE tasks SET ${sets}, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId, ...values]
    );
    return rows[0] || null;
  },

  async delete(id: number, userId: number): Promise<boolean> {
    const { rowCount } = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return (rowCount ?? 0) > 0;
  },
};
