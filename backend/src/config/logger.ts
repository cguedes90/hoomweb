/**
 * Configuração do logger da aplicação utilizando Winston.
 *
 * Em ambiente de desenvolvimento (NODE_ENV !== 'production'):
 *   - Nível: debug — exibe todos os logs incluindo detalhes de requisições
 *   - Formato: colorizado e simplificado para facilitar a leitura no terminal
 *
 * Em ambiente de produção:
 *   - Nível: info — omite mensagens de debug
 *   - Formato: JSON estruturado com timestamp e stack trace de erros,
 *     ideal para ingestão em ferramentas como Datadog, CloudWatch ou Loki
 */
import winston from 'winston';

const logger = winston.createLogger({
  // Define o nível mínimo de log de acordo com o ambiente
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

  format: winston.format.combine(
    winston.format.timestamp(),            // Adiciona campo "timestamp" em cada log
    winston.format.errors({ stack: true }), // Inclui stack trace em erros
    winston.format.json()                  // Serializa em JSON para produção
  ),

  transports: [
    // Em todos os ambientes, exibe logs no console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // Colore o nível (info=verde, error=vermelho...)
        winston.format.simple()    // Formato legível: "info: mensagem"
      ),
    }),
  ],
});

export default logger;
