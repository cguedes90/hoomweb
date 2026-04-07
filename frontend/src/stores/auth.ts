/**
 * @module useAuthStore
 * @description Store Pinia responsável pelo estado de autenticação do usuário.
 *
 * Gerencia o ciclo de vida da sessão do usuário: login, registro, logout e
 * persistência do estado entre recarregamentos de página via `localStorage`.
 *
 * O estado é hidratado a partir do `localStorage` na inicialização da store,
 * garantindo que um usuário que já fez login anteriormente permaneça autenticado
 * após um refresh de página, sem necessidade de re-login.
 *
 * A computed property `isAuthenticated` é a fonte de verdade utilizada pelo
 * router guard para decidir se o usuário pode acessar rotas protegidas.
 *
 * Utiliza a sintaxe de setup function do Pinia (Composition API), que proporciona
 * melhor tipagem TypeScript e maior familiaridade para desenvolvedores que já
 * conhecem a Composition API do Vue 3.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

/**
 * Representa os dados públicos do usuário autenticado.
 * Não inclui o campo `password` — o backend nunca o retorna nas respostas.
 */
interface User {
  id: number
  name: string
  email: string
  role: string
}

export const useAuthStore = defineStore('auth', () => {
  /**
   * Token JWT da sessão atual.
   * Inicializado a partir do `localStorage` para persistir entre recarregamentos.
   * Quando `null`, o usuário não está autenticado.
   */
  const token = ref<string | null>(localStorage.getItem('token'))

  /**
   * Dados do usuário autenticado.
   * Persistido como JSON no `localStorage`; deserializado na inicialização.
   * O fallback 'null' garante que `JSON.parse` retorne `null` quando a chave não existir.
   */
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') || 'null'))

  /**
   * Indica se há uma sessão ativa.
   * Derivado da presença do token — se o token foi removido (ex.: pelo interceptor
   * do Axios em caso de 401), esta computed automaticamente se torna `false`.
   */
  const isAuthenticated = computed(() => !!token.value)

  /**
   * Autentica o usuário com e-mail e senha.
   *
   * Armazena o token e os dados do usuário tanto no estado reativo (para uso
   * imediato) quanto no `localStorage` (para persistência entre sessões).
   * Erros de rede ou credenciais inválidas são propagados para o componente
   * chamador, que é responsável por exibir o feedback ao usuário.
   *
   * @param email    - E-mail do usuário.
   * @param password - Senha em texto simples (enviada via HTTPS).
   * @throws Propaga o erro do Axios em caso de falha (ex.: 401 Unauthorized).
   */
  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password })
    token.value = data.token
    user.value = data.user
    // Persiste no localStorage para sobreviver a recarregamentos de página
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  /**
   * Registra um novo usuário e já o autentica na sequência.
   *
   * O backend cria o usuário e retorna token + dados do usuário na mesma resposta,
   * permitindo que o frontend inicie a sessão sem uma segunda requisição de login.
   *
   * @param name     - Nome completo do usuário.
   * @param email    - E-mail (deve ser único na base).
   * @param password - Senha com mínimo de 6 caracteres.
   * @throws Propaga o erro do Axios em caso de falha (ex.: 409 E-mail já cadastrado).
   */
  async function register(name: string, email: string, password: string) {
    const { data } = await api.post('/auth/register', { name, email, password })
    token.value = data.token
    user.value = data.user
    // Mesmo comportamento do login: persiste imediatamente para evitar re-login
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  /**
   * Encerra a sessão do usuário.
   *
   * Limpa o estado reativo e remove os dados persistidos do `localStorage`.
   * Após o logout, `isAuthenticated` retorna `false` e o router guard redireciona
   * automaticamente para a tela de login em qualquer tentativa de acesso a rota protegida.
   *
   * Não realiza chamada ao backend (sem endpoint de logout com blacklist de token),
   * pois o token é stateless e expirará naturalmente pelo tempo configurado no servidor.
   */
  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // Expõe apenas o necessário — estado e ações da store
  return { token, user, isAuthenticated, login, register, logout }
})
