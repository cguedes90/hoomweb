# Hoomweb — Sistema de Gestão de Clientes e Tarefas

[![CI](https://github.com/cguedes90/hoomweb/actions/workflows/ci.yml/badge.svg)](https://github.com/cguedes90/hoomweb/actions/workflows/ci.yml)

Desafio Técnico Fullstack — solução completa cobrindo todas as etapas: 1, 2, 3, 4, 5 e 6.

## Stack

| Camada    | Tecnologia                                      |
|-----------|-------------------------------------------------|
| Backend   | Node.js 20 + TypeScript + Express               |
| Banco     | PostgreSQL (Neon / qualquer Postgres)           |
| Frontend  | Vue 3 + TypeScript + Pinia + Vue Router         |
| Mobile    | Flutter 3 + Provider + flutter_secure_storage   |
| Infra     | Docker + docker-compose                         |

---

## Etapas implementadas

- **Etapa 1 — API REST**: autenticação JWT, CRUD de clientes e tarefas, filtros por status/cliente, documentação Swagger
- **Etapa 2 — Web**: login, cadastro, listagem/cadastro/edição de clientes e tarefas, filtros, máscaras CPF/CNPJ e telefone, layout desktop com sidebar lateral
- **Etapa 3 — Mobile**: app Flutter com login, listagem de clientes, listagem de tarefas e atualização de status
- **Etapa 4 — Integração CEP**: consulta automática via ViaCEP ao digitar o CEP no cadastro de clientes
- **Etapa 5 — Docker**: Dockerfile multistage para backend e frontend, docker-compose
- **Etapa 6 — Diferenciais**:
  - Testes automatizados com Jest + Supertest (32 testes, ~78% de cobertura)
  - CI/CD com GitHub Actions (build + test em cada push/PR)
  - Controle de permissões: roles `user`/`admin` com middleware `requireAdmin`
  - Logs estruturados com Winston (JSON em produção, colorizado em dev)
  - Documentação Swagger/OpenAPI 3.0 em `/api/docs`

---

## Execução rápida com Docker

```bash
# 1. Clone o repositório
git clone <repo-url>
cd hoomweb

# 2. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com sua DATABASE_URL e JWT_SECRET

# 3. Suba os serviços
docker-compose up -d

# Frontend: http://localhost
# Backend:  http://localhost:3000
# Swagger:  http://localhost:3000/api/docs
```

---

## Execução local (sem Docker)

### Pré-requisitos
- Node.js 20+
- Banco PostgreSQL acessível

### Backend

```bash
cd backend
cp .env.example .env
# Configure DATABASE_URL e JWT_SECRET no .env

npm install
npm run migrate   # Cria as tabelas no banco
npm run dev       # Desenvolvimento com hot-reload
# ou
npm run build && npm start
```

### Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:3000/api

npm install
npm run dev
```

---

## Variáveis de ambiente

### Raiz / Docker (`/.env`)

| Variável        | Descrição                          |
|-----------------|------------------------------------|
| `DATABASE_URL`  | Connection string PostgreSQL       |
| `JWT_SECRET`    | Segredo para assinar tokens JWT    |
| `JWT_EXPIRES_IN`| Expiração do token (padrão: `7d`)  |

### Backend (`/backend/.env`)

Mesmo que a raiz, mais:

| Variável  | Padrão |
|-----------|--------|
| `PORT`    | `3000` |
| `NODE_ENV`| `development` |

### Frontend (`/frontend/.env`)

| Variável        | Valor padrão                    |
|-----------------|---------------------------------|
| `VITE_API_URL`  | `http://localhost:3000/api`     |

---

## API — Endpoints

### Auth
| Método | Rota               | Auth | Descrição           |
|--------|--------------------|------|---------------------|
| POST   | /api/auth/register | ✗    | Cadastrar usuário   |
| POST   | /api/auth/login    | ✗    | Login               |
| GET    | /api/auth/me       | ✓    | Dados do usuário    |

### Clientes
| Método | Rota                   | Descrição                    |
|--------|------------------------|------------------------------|
| GET    | /api/clients           | Listar clientes               |
| GET    | /api/clients/:id       | Buscar cliente                |
| POST   | /api/clients           | Criar cliente                 |
| PUT    | /api/clients/:id       | Atualizar cliente             |
| DELETE | /api/clients/:id       | Deletar cliente               |
| GET    | /api/clients/cep/:cep  | Consultar endereço por CEP   |

### Tarefas
| Método | Rota            | Descrição                                      |
|--------|-----------------|------------------------------------------------|
| GET    | /api/tasks      | Listar tarefas (query: `status`, `client_id`) |
| GET    | /api/tasks/:id  | Buscar tarefa                                  |
| POST   | /api/tasks      | Criar tarefa                                   |
| PUT    | /api/tasks/:id  | Atualizar tarefa                               |
| DELETE | /api/tasks/:id  | Deletar tarefa                                 |

Documentação interativa: `GET /api/docs`

---

## Mobile (Etapa 3)

### Pré-requisitos
- Flutter SDK 3.x ([flutter.dev/docs/get-started/install](https://docs.flutter.dev/get-started/install))
- Android Studio / Xcode (para emulador) ou dispositivo físico

### Executar

```bash
cd mobile_flutter
flutter pub get
flutter run
```

O app conecta automaticamente ao backend em produção.

### Funcionalidades
- Login com e-mail e senha
- Listagem de clientes com avatar, e-mail, telefone e cidade
- Listagem de tarefas com status colorido e vencimento
- Atualização de status com um toque (Pendente → Em andamento → Concluído)
- Pull to refresh em todas as listas

---

## Estrutura do projeto

```
hoomweb/
├── .github/
│   └── workflows/
│       └── ci.yml         # GitHub Actions: test + build
├── backend/
│   ├── src/
│   │   ├── __tests__/     # Testes de integração (Jest + Supertest)
│   │   ├── config/        # Database, Swagger, Logger
│   │   ├── controllers/   # Auth, Client, Task
│   │   ├── middlewares/   # Auth JWT, Validação
│   │   ├── migrations/    # SQL + runner idempotente
│   │   ├── models/        # User, Client, Task
│   │   ├── routes/        # Auth, Client, Task
│   │   ├── services/      # CEP (ViaCEP)
│   │   └── index.ts
│   ├── Dockerfile
│   ├── jest.config.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── router/
│   │   ├── services/      # Axios instance
│   │   ├── stores/        # Pinia: auth
│   │   └── views/         # Login, Register, Clients, Tasks
│   ├── Dockerfile
│   └── nginx.conf
├── mobile_flutter/        # App Flutter (Etapa 3)
│   ├── lib/
│   │   ├── screens/       # LoginScreen, ClientsScreen, TasksScreen, HomeScreen
│   │   └── services/      # ApiService, AuthProvider
│   └── test/
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Observações técnicas

- **Banco**: PostgreSQL via Neon (serverless). O script de migration em `backend/src/migrations/001_initial.sql` cria todas as tabelas com índices otimizados.
- **Segurança**: senhas com bcrypt (salt 12), JWT com expiração configurável, validação de entrada com `express-validator`, anti-enumeração de usuários no login.
- **Multi-tenancy**: cada usuário só acessa seus próprios clientes e tarefas (filtro por `user_id` em todas as queries).
- **CEP**: integração com ViaCEP (`viacep.com.br`) — preenchimento automático de endereço no cadastro de clientes.
- **Logs estruturados**: Winston com JSON em produção, colorizado em desenvolvimento.
- **Swagger**: documentação interativa em `/api/docs` com autenticação Bearer JWT.
- **Docker**: build multistage para imagens menores. Frontend servido por Nginx com variável PORT dinâmica.
- **Testes**: 32 testes de integração com banco real (sem mocks), usando e-mails únicos por execução para isolamento. Cobertura ~78%.
- **CI/CD**: GitHub Actions com 3 jobs — test (com banco real via secrets), build-backend e build-frontend.

## Deploy em produção

| Serviço  | URL |
|----------|-----|
| Frontend | https://frontend-production-f738.up.railway.app |
| Backend  | https://caring-bravery-production-91ef.up.railway.app |
| Swagger  | https://caring-bravery-production-91ef.up.railway.app/api/docs |
