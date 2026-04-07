/**
 * @module MigrationsRunner
 * @description Script de execução de migrations do banco de dados PostgreSQL.
 *
 * Implementa um sistema de migrations simples e idempotente baseado em arquivos
 * SQL. A idempotência é garantida por uma tabela de controle `_migrations` que
 * registra quais arquivos já foram executados, de modo que rodar o script múltiplas
 * vezes não reaplica migrations já concluídas.
 *
 * As migrations são lidas do mesmo diretório onde este script está localizado
 * (`__dirname`), filtradas por extensão `.sql` e executadas em ordem lexicográfica
 * (sort). Por convenção, os arquivos devem ser nomeados com prefixo numérico
 * sequencial (ex.: `001_create_users.sql`, `002_create_clients.sql`) para garantir
 * a ordem correta de execução.
 *
 * O script utiliza uma única conexão do pool durante todo o processo e a libera
 * ao final, encerrando o pool para que o processo Node.js possa terminar normalmente.
 * Em caso de erro, o processo é encerrado com código de saída 1.
 *
 * Este script deve ser executado como parte do processo de inicialização do ambiente
 * (ex.: via npm script `db:migrate`) e não é importado pela aplicação em runtime.
 */

import fs from 'fs';
import path from 'path';
import pool from '../config/database';
import logger from '../config/logger';

/**
 * Executa todas as migrations SQL pendentes em ordem lexicográfica.
 *
 * O fluxo de execução é:
 * 1. Cria a tabela `_migrations` se ainda não existir (bootstrapping).
 * 2. Lê todos os arquivos `.sql` do diretório atual e os ordena.
 * 3. Para cada arquivo, verifica se já foi executado consultando `_migrations`.
 * 4. Se não executado, roda o SQL e registra o filename na tabela de controle.
 * 5. Se já executado, pula e continua para o próximo.
 *
 * @throws Propaga o erro em caso de falha, para que o processo termine com exit code 1.
 */
async function runMigrations() {
  // Adquire uma conexão dedicada do pool para garantir contexto consistente durante todo o processo
  const client = await pool.connect();
  try {
    // Cria a tabela de controle de migrations caso ainda não exista (primeira execução)
    // O campo `filename` é UNIQUE para evitar registros duplicados em caso de erro parcial
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Lê os arquivos SQL do mesmo diretório deste script e os ordena lexicograficamente
    // A ordenação garante que migrations com prefixo numérico sejam executadas na sequência correta
    const migrationsDir = path.join(__dirname);
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      // Verifica se esta migration já foi executada em alguma execução anterior
      const { rows } = await client.query(
        'SELECT id FROM _migrations WHERE filename = $1',
        [file]
      );

      if (rows.length === 0) {
        // Migration pendente: lê o conteúdo do arquivo e executa no banco
        logger.info(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query(sql);
        // Registra a migration como executada para que não seja reaplicada nas próximas execuções
        await client.query(
          'INSERT INTO _migrations (filename) VALUES ($1)',
          [file]
        );
        logger.info(`Migration ${file} completed`);
      } else {
        // Migration já aplicada anteriormente — pula sem erro
        logger.info(`Migration ${file} already executed, skipping`);
      }
    }

    logger.info('All migrations completed successfully');
  } catch (err) {
    logger.error('Migration failed', err);
    // Propaga o erro para que o catch externo termine o processo com exit code 1
    throw err;
  } finally {
    // Sempre libera a conexão de volta ao pool, independentemente de sucesso ou erro
    client.release();
    // Encerra o pool para que o processo Node.js termine graciosamente após a execução
    await pool.end();
  }
}

// Ponto de entrada: executa as migrations e, em caso de falha, encerra com código 1
// sinalizando erro para ferramentas de CI/CD e scripts de deploy
runMigrations().catch(() => process.exit(1));
