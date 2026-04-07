import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ClientModel } from '../models/client.model';
import { CepService } from '../services/cep.service';
import logger from '../config/logger';

export const ClientController = {
  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const clients = await ClientModel.findAll(req.user!.id);
      res.json(clients);
    } catch (err) {
      logger.error('List clients error', err);
      res.status(500).json({ error: 'Erro ao listar clientes' });
    }
  },

  async getOne(req: AuthRequest, res: Response): Promise<void> {
    try {
      const client = await ClientModel.findById(Number(req.params.id), req.user!.id);
      if (!client) {
        res.status(404).json({ error: 'Cliente não encontrado' });
        return;
      }
      res.json(client);
    } catch (err) {
      logger.error('Get client error', err);
      res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
  },

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = { ...req.body, user_id: req.user!.id };
      const client = await ClientModel.create(data);
      logger.info(`Client created: ${client.id} by user ${req.user!.id}`);
      res.status(201).json(client);
    } catch (err) {
      logger.error('Create client error', err);
      res.status(500).json({ error: 'Erro ao criar cliente' });
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const client = await ClientModel.update(Number(req.params.id), req.user!.id, req.body);
      if (!client) {
        res.status(404).json({ error: 'Cliente não encontrado' });
        return;
      }
      res.json(client);
    } catch (err) {
      logger.error('Update client error', err);
      res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
  },

  async remove(req: AuthRequest, res: Response): Promise<void> {
    try {
      const deleted = await ClientModel.delete(Number(req.params.id), req.user!.id);
      if (!deleted) {
        res.status(404).json({ error: 'Cliente não encontrado' });
        return;
      }
      res.status(204).send();
    } catch (err) {
      logger.error('Delete client error', err);
      res.status(500).json({ error: 'Erro ao deletar cliente' });
    }
  },

  async lookupCep(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { cep } = req.params;
      const address = await CepService.lookup(cep);
      if (!address) {
        res.status(404).json({ error: 'CEP não encontrado' });
        return;
      }
      res.json(address);
    } catch (err) {
      logger.error('CEP lookup error', err);
      res.status(500).json({ error: 'Erro ao consultar CEP' });
    }
  },
};
