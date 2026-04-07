/**
 * @module ClientModel
 * @description Modelo de dados para a entidade Cliente.
 *
 * Responsável por todas as operações de persistência de clientes no PostgreSQL.
 * Todos os métodos aplicam isolamento por `user_id`, garantindo que cada usuário
 * da plataforma acesse somente os clientes que ele mesmo cadastrou (multi-tenancy
 * em nível de linha). O campo de endereço é composto por múltiplos atributos
 * derivados da consulta ao serviço de CEP.
 */

import pool from '../config/database';

/**
 * Representa um cliente completo conforme armazenado no banco de dados.
 * Os campos de endereço e de contato são opcionais para permitir cadastros
 * parciais, que podem ser complementados posteriormente.
 */
export interface Client {
  id: number;
  name: string;
  /** E-mail de contato do cliente (opcional). */
  email?: string;
  /** Telefone de contato (opcional, sem formatação obrigatória). */
  phone?: string;
  /** CPF ou CNPJ do cliente (opcional). */
  document?: string;
  /** CEP do endereço no formato retornado pelo ViaCEP (ex.: "01310-100"). */
  zipcode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  /** Sigla da unidade federativa (ex.: "SP", "RJ"). */
  state?: string;
  /** Chave estrangeira para o usuário dono deste registro. */
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Tipo utilizado como entrada para criação e atualização de clientes.
 * Remove os campos gerados automaticamente pelo banco (`id`, `created_at`, `updated_at`).
 */
export type ClientInput = Omit<Client, 'id' | 'created_at' | 'updated_at'>;

export const ClientModel = {
  /**
   * Insere um novo cliente no banco de dados.
   *
   * Todos os campos de endereço e contato são opcionais; o banco armazenará
   * NULL para os que não forem fornecidos. A cláusula RETURNING * evita um
   * segundo SELECT e retorna o registro completo com o ID gerado.
   *
   * @param data - Dados do cliente, incluindo obrigatoriamente `name` e `user_id`.
   * @returns O cliente recém-criado com todos os campos, incluindo `id` e timestamps.
   */
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

  /**
   * Retorna todos os clientes pertencentes a um determinado usuário.
   *
   * A ordenação alfabética por `name` facilita a exibição em tabelas e
   * selects do frontend sem exigir ordenação adicional no lado do cliente.
   *
   * @param userId - ID do usuário autenticado, usado para filtrar os registros.
   * @returns Array de clientes ordenados pelo nome. Pode ser vazio.
   */
  async findAll(userId: number): Promise<Client[]> {
    const { rows } = await pool.query(
      'SELECT * FROM clients WHERE user_id = $1 ORDER BY name',
      [userId]
    );
    return rows;
  },

  /**
   * Busca um único cliente pelo seu ID, respeitando o isolamento por usuário.
   *
   * A combinação de `id` e `user_id` na cláusula WHERE impede que um usuário
   * acesse registros de outro usuário mesmo conhecendo o ID numérico do cliente.
   *
   * @param id     - ID primário do cliente.
   * @param userId - ID do usuário autenticado.
   * @returns O cliente encontrado ou `null` se não existir ou não pertencer ao usuário.
   */
  async findById(id: number, userId: number): Promise<Client | null> {
    const { rows } = await pool.query(
      'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rows[0] || null;
  },

  /**
   * Atualiza parcialmente um cliente existente (PATCH semântico via PUT).
   *
   * A construção dinâmica da cláusula SET permite que apenas os campos enviados
   * na requisição sejam atualizados, sem sobrescrever os demais com NULL.
   * O campo `user_id` é explicitamente excluído dos campos atualizáveis para
   * evitar transferência de propriedade entre usuários.
   *
   * Se nenhum campo válido for enviado, retorna o cliente atual sem executar UPDATE.
   *
   * @param id     - ID do cliente a ser atualizado.
   * @param userId - ID do usuário autenticado (garante isolamento).
   * @param data   - Objeto parcial com os campos a atualizar.
   * @returns O cliente atualizado ou `null` se não encontrado.
   */
  async update(id: number, userId: number, data: Partial<ClientInput>): Promise<Client | null> {
    // Remove user_id dos campos atualizáveis — a propriedade do registro não pode ser transferida
    const fields = Object.keys(data).filter(k => k !== 'user_id');
    if (fields.length === 0) return this.findById(id, userId);

    // Gera placeholders parametrizados ($3, $4, ...) para cada campo a atualizar
    // Os parâmetros $1 e $2 são reservados para `id` e `userId` na cláusula WHERE
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

  /**
   * Remove um cliente do banco de dados.
   *
   * O isolamento por `user_id` garante que o usuário só consiga deletar
   * registros que lhe pertencem. Dependendo das constraints de banco definidas
   * nas migrations, tarefas vinculadas ao cliente podem ser removidas em cascata.
   *
   * @param id     - ID do cliente a ser removido.
   * @param userId - ID do usuário autenticado.
   * @returns `true` se o registro foi deletado, `false` se não foi encontrado.
   */
  async delete(id: number, userId: number): Promise<boolean> {
    const { rowCount } = await pool.query(
      'DELETE FROM clients WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    // rowCount pode ser null em queries que não são DML; o operador ?? garante fallback para 0
    return (rowCount ?? 0) > 0;
  },
};
