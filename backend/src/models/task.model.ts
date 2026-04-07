/**
 * @module TaskModel
 * @description Modelo de dados para a entidade Tarefa.
 *
 * Gerencia todas as operações de persistência de tarefas no PostgreSQL.
 * As tarefas pertencem a um usuário e obrigatoriamente estão vinculadas a um
 * cliente, representando um trabalho ou atividade a ser executada. O modelo
 * suporta filtragem por status e por cliente, e enriquece o retorno com o nome
 * do cliente via JOIN, evitando round-trips adicionais ao banco.
 *
 * O mesmo padrão de isolamento por `user_id` presente no ClientModel é aplicado
 * aqui, garantindo que um usuário só manipule suas próprias tarefas.
 */

import pool from '../config/database';

/**
 * Tipo literal para os estados possíveis de uma tarefa.
 * O ciclo de vida típico segue: pending -> in_progress -> done (ou cancelled).
 */
export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'cancelled';

/**
 * Representa uma tarefa completa conforme armazenada no banco de dados.
 * Nas consultas que fazem JOIN com a tabela `clients`, o campo `client_name`
 * também estará disponível no objeto retornado (campo extra não tipado aqui,
 * mas presente em tempo de execução).
 */
export interface Task {
  id: number;
  title: string;
  /** Descrição detalhada da tarefa (opcional). */
  description?: string;
  status: TaskStatus;
  /** Data limite para conclusão da tarefa (opcional). */
  due_date?: Date;
  /** Chave estrangeira para o cliente ao qual a tarefa pertence. */
  client_id: number;
  /** Chave estrangeira para o usuário dono desta tarefa. */
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Tipo de entrada para criação e atualização de tarefas.
 * Exclui os campos gerados automaticamente pelo banco.
 */
export type TaskInput = Omit<Task, 'id' | 'created_at' | 'updated_at'>;

/**
 * Parâmetros opcionais de filtragem para a listagem de tarefas.
 * Ambos os filtros são cumulativos quando fornecidos simultaneamente.
 */
export interface TaskFilters {
  /** Filtra tarefas pelo status (ex.: exibir apenas as pendentes). */
  status?: TaskStatus;
  /** Filtra tarefas de um cliente específico. */
  client_id?: number;
}

export const TaskModel = {
  /**
   * Cria uma nova tarefa associada a um cliente e a um usuário.
   *
   * O status padrão é 'pending' quando não informado, representando uma tarefa
   * recém-criada que ainda não foi iniciada.
   *
   * @param data - Dados da tarefa. `client_id` e `user_id` são obrigatórios.
   * @returns A tarefa criada com todos os campos, incluindo `id` e timestamps.
   */
  async create(data: TaskInput): Promise<Task> {
    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description, status, due_date, client_id, user_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      // O operador || garante o status padrão caso o campo não seja enviado pelo controller
      [data.title, data.description, data.status || 'pending', data.due_date, data.client_id, data.user_id]
    );
    return rows[0];
  },

  /**
   * Retorna todas as tarefas de um usuário, com suporte a filtros opcionais.
   *
   * A query é construída dinamicamente: parte de uma condição base (`user_id`)
   * e acrescenta cláusulas conforme os filtros fornecidos, usando um contador
   * de índice para os placeholders parametrizados do pg.
   *
   * O JOIN com a tabela `clients` adiciona `client_name` ao resultado,
   * permitindo que o frontend exiba o nome do cliente sem precisar de outra
   * chamada à API.
   *
   * Os resultados são ordenados do mais recente para o mais antigo.
   *
   * @param userId  - ID do usuário autenticado.
   * @param filters - Objeto com filtros opcionais de status e/ou cliente.
   * @returns Array de tarefas enriquecidas com `client_name`. Pode ser vazio.
   */
  async findAll(userId: number, filters: TaskFilters = {}): Promise<Task[]> {
    // Inicia com a condição obrigatória de isolamento por usuário
    const conditions: string[] = ['t.user_id = $1'];
    const values: unknown[] = [userId];
    // idx controla o número do próximo placeholder ($2, $3, ...) para evitar colisões
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

  /**
   * Busca uma única tarefa pelo ID, com isolamento por usuário e nome do cliente.
   *
   * Assim como em `findAll`, o JOIN traz `client_name` diretamente, evitando
   * uma consulta adicional ao banco para obter esse dado.
   *
   * @param id     - ID primário da tarefa.
   * @param userId - ID do usuário autenticado (garante isolamento).
   * @returns A tarefa encontrada (com `client_name`) ou `null`.
   */
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

  /**
   * Atualiza parcialmente uma tarefa existente.
   *
   * Aplica uma lista de campos permitidos (`allowed`) para evitar que campos
   * sensíveis como `user_id` sejam alterados indiretamente via body da requisição.
   * Essa lista de whitelist é diferente da abordagem do ClientModel, que usa
   * apenas blacklist; aqui a segurança é mais estrita por incluir `client_id`
   * como campo editável controlado.
   *
   * @param id     - ID da tarefa a ser atualizada.
   * @param userId - ID do usuário autenticado.
   * @param data   - Campos a atualizar (apenas os presentes em `allowed` serão processados).
   * @returns A tarefa atualizada ou `null` se não encontrada.
   */
  async update(id: number, userId: number, data: Partial<TaskInput>): Promise<Task | null> {
    // Whitelist explícita dos campos atualizáveis — user_id é propositalmente excluído
    const allowed = ['title', 'description', 'status', 'due_date', 'client_id'];
    const fields = Object.keys(data).filter(k => allowed.includes(k));
    if (fields.length === 0) return this.findById(id, userId);

    // $1 = id, $2 = userId — campos começam a partir de $3
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

  /**
   * Remove uma tarefa do banco de dados.
   *
   * A verificação de `user_id` garante que somente o dono da tarefa possa
   * excluí-la, mesmo que o ID seja descoberto por outro meio.
   *
   * @param id     - ID da tarefa a ser removida.
   * @param userId - ID do usuário autenticado.
   * @returns `true` se a tarefa foi deletada, `false` se não foi encontrada.
   */
  async delete(id: number, userId: number): Promise<boolean> {
    const { rowCount } = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    // rowCount pode ser null em drivers mais antigos do pg; ?? 0 garante retorno seguro
    return (rowCount ?? 0) > 0;
  },
};
