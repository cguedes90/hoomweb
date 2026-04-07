import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { TaskModel, TaskStatus } from '../models/task.model';
import logger from '../config/logger';

export const TaskController = {
  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = {
        status: req.query.status as TaskStatus | undefined,
        client_id: req.query.client_id ? Number(req.query.client_id) : undefined,
      };
      const tasks = await TaskModel.findAll(req.user!.id, filters);
      res.json(tasks);
    } catch (err) {
      logger.error('List tasks error', err);
      res.status(500).json({ error: 'Erro ao listar tarefas' });
    }
  },

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

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = { ...req.body, user_id: req.user!.id };
      const task = await TaskModel.create(data);
      logger.info(`Task created: ${task.id} by user ${req.user!.id}`);
      res.status(201).json(task);
    } catch (err) {
      logger.error('Create task error', err);
      res.status(500).json({ error: 'Erro ao criar tarefa' });
    }
  },

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

  async remove(req: AuthRequest, res: Response): Promise<void> {
    try {
      const deleted = await TaskModel.delete(Number(req.params.id), req.user!.id);
      if (!deleted) {
        res.status(404).json({ error: 'Tarefa não encontrada' });
        return;
      }
      res.status(204).send();
    } catch (err) {
      logger.error('Delete task error', err);
      res.status(500).json({ error: 'Erro ao deletar tarefa' });
    }
  },
};
