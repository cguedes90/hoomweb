/**
 * @module ClientController
 * @description Controller responsável pelas operações CRUD de clientes e consulta de CEP.
 *
 * Todos os métodos exigem autenticação via middleware (recebem `AuthRequest`, que
 * estende `Request` com o campo `req.user`). O `user_id` do token autenticado é
 * sempre injetado nas operações de banco, garantindo o isolamento entre usuários
 * sem depender de dados fornecidos pelo cliente na requisição.
 *
 * O endpoint de consulta de CEP (`lookupCep`) foi colocado neste controller por
 * ser uma funcionalidade auxiliar ao cadastro de clientes, embora delegue a lógica
 * ao `CepService`.
 */

import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ClientModel } from '../models/client.model';
import { CepService } from '../services/cep.service';
import logger from '../config/logger';

export const ClientController = {
  /**
   * Lista todos os clientes do usuário autenticado.
   *
   * O isolamento por usuário é aplicado no modelo, que filtra pelo `user_id`
   * extraído do token JWT. Não há paginação implementada nesta versão; para
   * bases com muitos clientes, considerar a adição de limit/offset ou cursor.
   *
   * @param req - Requisição autenticada com `req.user.id`.
   * @param res - Resposta HTTP. Retorna 200 com array de clientes (pode ser vazio).
   *              Retorna 500 em caso de erro de banco.
   */
  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const clients = await ClientModel.findAll(req.user!.id);
      res.json(clients);
    } catch (err) {
      logger.error('List clients error', err);
      res.status(500).json({ error: 'Erro ao listar clientes' });
    }
  },

  /**
   * Retorna um único cliente pelo ID, validando que pertence ao usuário autenticado.
   *
   * `req.params.id` chega como string — o `Number()` converte para inteiro antes
   * de passar ao model. Se o cliente não for encontrado ou não pertencer ao usuário,
   * retorna 404 (não distingue os dois casos para não vazar informações de existência).
   *
   * @param req - Requisição autenticada com `req.params.id` (ID do cliente).
   * @param res - Resposta HTTP. Retorna 200 com o cliente ou 404 se não encontrado.
   */
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

  /**
   * Cria um novo cliente vinculado ao usuário autenticado.
   *
   * O `user_id` é injetado pelo controller a partir do token, e não do body
   * da requisição. Isso impede que um usuário malicioso crie clientes em nome
   * de outro usuário ao fornecer um `user_id` diferente no payload.
   *
   * @param req - Requisição autenticada com os dados do cliente no body.
   * @param res - Resposta HTTP. Retorna 201 com o cliente criado.
   *              Retorna 500 em caso de erro de banco.
   */
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = { ...req.body, user_id: req.user!.id };
      const client = await ClientModel.create(data);
      logger.info(`Client created: ${client.id} by user ${req.user!.id}`);
      res.status(201).json(client);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('uk_clients_document')) {
        res.status(409).json({ error: 'CPF/CNPJ já cadastrado para outro cliente' }); return;
      }
      if (msg.includes('uk_clients_email')) {
        res.status(409).json({ error: 'E-mail já cadastrado para outro cliente' }); return;
      }
      logger.error('Create client error', err);
      res.status(500).json({ error: 'Erro ao criar cliente' });
    }
  },

  /**
   * Atualiza parcialmente um cliente existente.
   *
   * O model aceita apenas os campos presentes no body, sem sobrescrever os
   * demais com NULL. A combinação de `id` e `user_id` no model garante que
   * o usuário só possa editar seus próprios clientes.
   *
   * @param req - Requisição autenticada com `req.params.id` e campos a atualizar no body.
   * @param res - Resposta HTTP. Retorna 200 com o cliente atualizado ou 404 se não encontrado.
   */
  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const client = await ClientModel.update(Number(req.params.id), req.user!.id, req.body);
      if (!client) {
        res.status(404).json({ error: 'Cliente não encontrado' });
        return;
      }
      res.json(client);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('uk_clients_document')) {
        res.status(409).json({ error: 'CPF/CNPJ já cadastrado para outro cliente' }); return;
      }
      if (msg.includes('uk_clients_email')) {
        res.status(409).json({ error: 'E-mail já cadastrado para outro cliente' }); return;
      }
      logger.error('Update client error', err);
      res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
  },

  /**
   * Remove um cliente do banco de dados.
   *
   * Em caso de sucesso, retorna 204 (No Content) sem body, seguindo a convenção
   * REST para operações de deleção bem-sucedidas. Dependendo das constraints
   * definidas nas migrations (ex.: ON DELETE CASCADE), as tarefas do cliente
   * também serão removidas automaticamente pelo banco.
   *
   * @param req - Requisição autenticada com `req.params.id`.
   * @param res - Resposta HTTP. Retorna 204 em sucesso ou 404 se não encontrado.
   */
  async remove(req: AuthRequest, res: Response): Promise<void> {
    try {
      const deleted = await ClientModel.delete(Number(req.params.id), req.user!.id);
      if (!deleted) {
        res.status(404).json({ error: 'Cliente não encontrado' });
        return;
      }
      // 204 No Content: deleção bem-sucedida, sem corpo na resposta (convenção REST)
      res.status(204).send();
    } catch (err) {
      logger.error('Delete client error', err);
      res.status(500).json({ error: 'Erro ao deletar cliente' });
    }
  },

  /**
   * Consulta os dados de endereço a partir de um CEP informado.
   *
   * Delega a chamada à API externa (ViaCEP) para o `CepService`, mantendo
   * o controller desacoplado dos detalhes de integração. Se o CEP não for
   * encontrado ou for inválido, o serviço retorna `null` e o controller
   * responde com 404.
   *
   * Este endpoint exige autenticação para evitar abuso da integração externa
   * por usuários não autenticados.
   *
   * @param req - Requisição autenticada com `req.params.cep` (CEP com ou sem máscara).
   * @param res - Resposta HTTP. Retorna 200 com os dados de endereço ou 404 se não encontrado.
   */
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
