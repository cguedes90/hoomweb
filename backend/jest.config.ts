import type { Config } from 'jest'

/**
 * Configuração do Jest para o projeto TypeScript.
 *
 * Utiliza ts-jest para transpilar TypeScript em tempo de execução durante os testes,
 * sem necessidade de compilar o projeto antes. Os arquivos de teste são buscados em
 * src/__tests__ com os padrões *.test.ts e *.spec.ts.
 *
 * O timeout de 15s acomoda operações de banco reais (sem mocks), que podem ser
 * mais lentas em ambientes de CI com conexão a banco remoto (ex.: Neon via SSL).
 */
const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/__tests__/**/*.test.ts'],
  // Timeout aumentado para acomodar conexões com banco remoto (Neon via SSL)
  testTimeout: 15000,
  // Carrega variáveis de ambiente antes de qualquer teste
  globalSetup: './src/__tests__/setup.ts',
  // Fecha o pool de conexões após todos os testes para o processo terminar limpo
  globalTeardown: './src/__tests__/teardown.ts',
  // Garante isolamento de módulos entre suítes para evitar estado compartilhado
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/migrations/**',
    '!src/__tests__/**',
    '!src/index.ts',
  ],
}

export default config
