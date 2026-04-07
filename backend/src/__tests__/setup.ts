/**
 * @file setup.ts
 * @description Setup global executado uma única vez antes de todos os testes (globalSetup do Jest).
 *
 * Carrega as variáveis de ambiente do arquivo .env antes que qualquer suíte seja iniciada,
 * garantindo que DATABASE_URL, JWT_SECRET e demais configs estejam disponíveis para os
 * módulos importados pelos testes.
 *
 * Como este arquivo é executado no contexto do Node (não do Jest), `dotenv` é importado
 * diretamente — sem uso do alias de path do tsconfig.
 */
import { config } from 'dotenv'
import { resolve } from 'path'

export default async function globalSetup() {
  // Carrega o .env da raiz do backend (dois níveis acima de src/__tests__)
  config({ path: resolve(__dirname, '../../.env') })
}
