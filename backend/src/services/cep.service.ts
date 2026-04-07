/**
 * @module CepService
 * @description Serviço de integração com a API pública ViaCEP para consulta de endereços.
 *
 * Encapsula toda a lógica de comunicação com o endpoint externo `viacep.com.br`,
 * incluindo sanitização do CEP de entrada, tratamento de CEPs inválidos e mapeamento
 * da resposta da API para o formato interno da aplicação.
 *
 * O serviço é consumido pelo `ClientController` para preencher automaticamente
 * os campos de endereço ao cadastrar ou editar um cliente.
 *
 * Ponto de atenção: a API ViaCEP não retorna erro HTTP para CEPs inexistentes;
 * em vez disso, retorna JSON com o campo `erro: true`. Esse comportamento é
 * tratado explicitamente neste serviço.
 */

import axios from 'axios';
import logger from '../config/logger';

/**
 * Representa os dados de endereço retornados após uma consulta de CEP bem-sucedida.
 * Os campos seguem a nomenclatura da aplicação (em inglês), diferente dos campos
 * originais da API ViaCEP (em português).
 */
export interface AddressData {
  /** CEP formatado retornado pelo ViaCEP (ex.: "01310-100"). */
  zipcode: string;
  /** Logradouro (nome da rua, avenida, etc.). */
  street: string;
  /** Complemento do endereço (pode ser string vazia). */
  complement: string;
  /** Bairro. */
  neighborhood: string;
  /** Cidade (nome do município). */
  city: string;
  /** Sigla do estado (UF). */
  state: string;
}

export const CepService = {
  /**
   * Consulta os dados de endereço correspondentes a um CEP brasileiro.
   *
   * O CEP de entrada é sanitizado — todos os caracteres não numéricos são removidos —
   * antes de ser enviado à API. Isso permite que o frontend envie o CEP com ou sem
   * formatação (ex.: "01310-100" ou "01310100") sem diferença no comportamento.
   *
   * Um timeout de 5 segundos é configurado para evitar que uma lentidão na API
   * externa bloqueie a requisição do usuário por tempo indeterminado.
   *
   * Em caso de falha na chamada HTTP (timeout, rede indisponível, erro 5xx), o erro
   * é logado e `null` é retornado em vez de propagar a exceção, deixando a decisão
   * de como tratar o erro para o controller chamador.
   *
   * @param cep - CEP a ser consultado. Pode conter formatação (hífen, espaços, etc.).
   * @returns Dados do endereço no formato interno ou `null` se o CEP for inválido,
   *          não encontrado ou se a API externa estiver indisponível.
   */
  async lookup(cep: string): Promise<AddressData | null> {
    // Remove qualquer caractere não numérico (ex.: hífen, parêntese, espaço)
    const clean = cep.replace(/\D/g, '');

    // CEP brasileiro sempre tem exatamente 8 dígitos; rejeita entradas inválidas sem chamar a API
    if (clean.length !== 8) return null;

    try {
      const { data } = await axios.get(`https://viacep.com.br/ws/${clean}/json/`, {
        timeout: 5000, // 5 segundos: tempo razoável para uma API pública sem SLA garantido
      });

      // A API ViaCEP retorna HTTP 200 mesmo para CEPs inexistentes, com { erro: true }
      if (data.erro) return null;

      // Mapeia os campos do ViaCEP (pt-BR) para o formato interno da aplicação (en)
      return {
        zipcode: data.cep,
        street: data.logradouro,
        complement: data.complemento,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
      };
    } catch (err) {
      // Loga o erro mas não propaga — o controller tratará o retorno null como 404
      logger.error('ViaCEP error', err);
      return null;
    }
  },
};
