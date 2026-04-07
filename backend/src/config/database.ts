/**
 * Configuração do pool de conexões com o PostgreSQL.
 *
 * Utiliza a biblioteca `pg` para criar um pool de conexões persistentes,
 * evitando o overhead de abrir/fechar uma nova conexão por requisição.
 *
 * A connection string é lida da variável de ambiente DATABASE_URL (definida no .env).
 * O SSL é habilitado sem verificação de certificado para compatibilidade com
 * provedores como Neon, Supabase e Railway.
 */
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

/**
 * Pool compartilhado por toda a aplicação.
 *
 * Parâmetros:
 * - max: limite de conexões simultâneas abertas com o banco
 * - idleTimeoutMillis: conexões ociosas são encerradas após 30 segundos
 * - connectionTimeoutMillis: se não houver conexão disponível em 2s, lança erro
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Em caso de erro não tratado no pool, registra e encerra o processo
pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões:', err);
  process.exit(-1);
});

export default pool;
