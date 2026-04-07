import axios from 'axios';
import logger from '../config/logger';

export interface AddressData {
  zipcode: string;
  street: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

export const CepService = {
  async lookup(cep: string): Promise<AddressData | null> {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return null;

    try {
      const { data } = await axios.get(`https://viacep.com.br/ws/${clean}/json/`, {
        timeout: 5000,
      });

      if (data.erro) return null;

      return {
        zipcode: data.cep,
        street: data.logradouro,
        complement: data.complemento,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
      };
    } catch (err) {
      logger.error('ViaCEP error', err);
      return null;
    }
  },
};
