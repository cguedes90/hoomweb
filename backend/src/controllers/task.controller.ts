/**
 * @module TaskController
 * @description Controller responsável pelas operações CRUD de tarefas.
 *
 * Segue o mesmo padrão de autenticação e isolamento por `user_id` aplicado
 * no `ClientController`. Todas as operações garantem que o usuário autenticado
 * só acesse e manipule as próprias tarefas.
 *
 * O endpoint de listagem suporta filtragem opcional por status e por cliente,
 * permitindo que o frontend exiba subconjuntos de tarefas sem precisar filtrar
 * no lado do cliente.
 */

import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { TaskModel, TaskStatus } from '../models/task.model';
import logger from '../config/logger';

export const TaskController = {
  /**
   * Lista as tarefas do usuário autenticado, com suporte a filtros por query string.
   *
   * Os parâmetros `status` e `client_id` são opcionais e cumulativos: se ambos
   * forem fornecidos, a query retorna apenas as tarefas que satisfazem os dois
   * critérios simultaneamente.
   *
   * `req.query` sempre retorna strings; por isso, `client_id` precisa ser
   * convertido para número antes de ser passado ao model.
   *
   * @param req - Requisição autenticada. Query params opcionais: `status` (string)
   *              e `client_id` (inteiro como string).
   * @param res - Resposta HTTP. Retorna 200 com array de tarefas (pode ser vazio).
   *              Retorna 500 em caso de erro de banco.
   */
  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Monta o objeto de filtros apenas com os parâmetros presentes na query string
      const filters = {
        status: req.query.status as TaskStatus | undefined,
        // Converte de string para number; se não informado, mantém undefined (sem filtro)
        client_id: req.query.client_id ? Number(req.query.client_id) : undefined,
      };
      const tasks = await TaskModel.findAll(req.user!.id, filters);
      res.json(tasks);
    } catch (err) {
      logger.error('List tasks error', err);
      res.status(500).json({ error: 'Erro ao listar tarefas' });
    }
  },

  /**
   * Retorna uma única tarefa pelo ID, enriquecida com o nome do cliente.
   *
   * O modelo aplica isolamento por `user_id`, portanto um 404 pode significar
   * tanto que a tarefa não existe quanto que pertence a outro usuário — ambos
   * os casos são tratados identicamente para não vazar informações.
   *
   * @param req - Requisição autenticada com `req.params.id` (ID da tarefa).
   * @param res - Resposta HTTP. Retorna 200 com a tarefa ou 404 se não encontrada.
   */
  async getOne(req: AuthRequest, res: Response): Promise<void> {
    try {
      const task = await TaskModel.findById(Number(req.params.id), req.user!.id);
      if (!task) {
        res.status(404).json({ error: 'Tarefa não encontrada' });
        return;
      }
      res.json(task);
    } catch (err) {
      logger.error('Get task error', err);
      res.status(500).json({ error: 'Erro ao buscar tarefa' });
    }
  },

  /**
   * Cria uma nova tarefa vinculada ao usuário autenticado e a um cliente.
   *
   * O `user_id` é sempre injetado pelo controller a partir do token autenticado,
   * impedindo que o chamante associe a tarefa a outro usuário via body.
   * O `client_id` deve ser fornecido no body e é validado pelo middleware de
   * validação antes de chegar aqui.
   *
   * @param req - Requisição autenticada com os dados da tarefa no body.
   *              Campos obrigatórios: `title`, `client_id`.
   *              Campos opcionais: `description`, `status`, `due_date`.
   * @param res - Resposta HTTP. Retorna 201 com a tarefa criada.
   *              Retorna 500 em caso de erro (ex.: client_id inválido viola FK do banco).
   */
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      // user_id é sempre sobrescrito com o valor do token, descartando qualquer valor do body
      const data = { ...req.body, user_id: req.user!.id };
      const task = await TaskModel.create(data);
      logger.info(`Task created: ${task.id} by user ${req.user!.id}`);
      res.status(201).json(task);
    } catch (err) {
      logger.error('Create task error', err);
      res.status(500).json({ error: 'Erro ao criar tarefa' });
    }
  },

  /**
   * Atualiza parcialmente uma tarefa existente.
   *
   * O model aplica uma whitelist de campos editáveis para garantir que apenas
   * campos intencionalmente expostos possam ser alterados. O status é validado
   * pelo middleware antes de chegar ao controller.
   *
   * @param req - Requisição autenticada com `req.params.id` e campos a atualizar no body.
   * @param res - Resposta HTTP. Retorna 200 com a tarefa atualizada ou 404 se não encontrada.
   */
  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const task = await TaskModel.update(Number(req.params.id), req.user!.id, req.body);
      if (!task) {
        res.status(404).json({ error: 'Tarefa não encontrada' });
        return;
      }
      res.json(task);
    } catch (err) {
      logger.error('Update task error', err);
      res.status(500).json({ error: 'Erro ao atualizar tarefa' });
    }
  },

  /**
   * Remove uma tarefa do banco de dados.
   *
   * Retorna 204 (No Content) em caso de sucesso, sem body na resposta,
   * seguindo a convenção REST para deleções. O isolamento por `user_id` no
   * model garante que somente o dono da tarefa possa excluí-la.
   *
   * @param req - Requisição autenticada com `req.params.id`.
   * @param res - Resposta HTTP. Retorna 204 em sucesso ou 404 se não encontrada.
   */
  async remove(req: AuthRequest, res: Response): Promise<void> {
    try {
      const deleted = await TaskModel.delete(Number(req.params.id), req.user!.id);
      if (!deleted) {
        res.status(404).json({ error: 'Tarefa não encontrada' });
        return;
      }
      // 204 No Content: deleção bem-sucedida, sem necessidade de corpo na resposta
      res.status(204).send();
    } catch (err) {
      logger.error('Delete task error', err);
      res.status(500).json({ error: 'Erro ao deletar tarefa' });
    }
  },
};
