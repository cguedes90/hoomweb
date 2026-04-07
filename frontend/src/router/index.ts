/**
 * @module router
 * @description Configuração do Vue Router com proteção de rotas baseada em autenticação.
 *
 * Define as rotas da aplicação SPA e implementa um navigation guard global que
 * controla o acesso com base no estado de autenticação do usuário (via `useAuthStore`).
 *
 * As rotas são classificadas em duas categorias:
 * - Rotas públicas: marcadas com `meta: { public: true }`, acessíveis sem autenticação.
 *   Usuários autenticados que tentarem acessá-las são redirecionados para `/clients`.
 * - Rotas protegidas: sem a meta `public`, requerem autenticação.
 *   Usuários não autenticados são redirecionados para `/login`.
 *
 * Todos os componentes de rota são carregados com lazy loading (import dinâmico),
 * gerando chunks separados por rota e reduzindo o tamanho do bundle inicial.
 *
 * O histórico de navegação utiliza HTML5 History API (`createWebHistory`), produzindo
 * URLs limpas sem `#`. Requer configuração de fallback no servidor de produção para
 * redirecionar todas as rotas para `index.html`.
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  // HTML5 History API: URLs sem hash (ex.: /clients em vez de /#/clients)
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      // Lazy loading: o chunk da LoginView só é carregado quando o usuário acessa esta rota
      component: () => import('@/views/LoginView.vue'),
      // meta.public: true indica que esta rota não requer autenticação
      meta: { public: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { public: true },
    },
    {
      // Rota raiz redireciona para /clients — evita uma tela em branco no acesso direto a "/"
      path: '/',
      redirect: '/clients',
    },
    {
      path: '/clients',
      name: 'clients',
      // Rota protegida (sem meta.public): requer autenticação
      component: () => import('@/views/ClientsView.vue'),
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: () => import('@/views/TasksView.vue'),
    },
  ],
})

/**
 * Navigation guard global executado antes de cada navegação.
 *
 * Implementa três regras de redirecionamento:
 * 1. Rota protegida + usuário não autenticado -> redireciona para /login.
 * 2. Rota pública + usuário autenticado -> redireciona para /clients (evita
 *    que usuários logados acessem login/register desnecessariamente).
 * 3. Qualquer outro caso -> permite a navegação normalmente.
 *
 * A store é instanciada dentro do guard (e não no topo do módulo) para garantir
 * que o Pinia já esteja inicializado quando o guard for executado pela primeira vez.
 *
 * @param to   - Rota de destino da navegação.
 * @param _from - Rota de origem (não utilizada neste guard).
 * @param next  - Função que autoriza ou redireciona a navegação.
 */
router.beforeEach((to, _from, next) => {
  // Instancia a store aqui para garantir disponibilidade do Pinia no contexto do guard
  const auth = useAuthStore()

  if (!to.meta.public && !auth.isAuthenticated) {
    // Rota protegida sem autenticação: redireciona para o login
    next('/login')
  } else if (to.meta.public && auth.isAuthenticated) {
    // Usuário já logado tentando acessar login/register: redireciona para a área principal
    next('/clients')
  } else {
    // Navegação permitida: usuário autenticado em rota protegida, ou não autenticado em rota pública
    next()
  }
})

export default router
