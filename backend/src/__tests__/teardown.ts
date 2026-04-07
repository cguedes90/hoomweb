/**
 * @file teardown.ts
 * @description Teardown global executado uma única vez após todos os testes (globalTeardown do Jest).
 *
 * Fecha o pool de conexões do banco de dados para que o processo Node termine
 * sem ficar aguardando conexões abertas. Sem este teardown, o Jest pode travar
 * ao finalizar os testes porque o pool mantém handles ativos.
 */
import pool from '../config/database'

export default async function globalTeardown() {
  await pool.end()
}
