/**
 * @module api
 * @description Instância configurada do Axios para comunicação com a API REST do backend.
 *
 * Centraliza todas as chamadas HTTP da aplicação, configurando a URL base,
 * timeout padrão e dois interceptors: um de requisição e um de resposta.
 *
 * O interceptor de requisição injeta automaticamente o token JWT em todas as
 * chamadas autenticadas, eliminando a necessidade de passar o header manualmente
 * em cada chamada de serviço.
 *
 * O interceptor de resposta trata o caso de token expirado ou inválido (HTTP 401),
 * limpando o estado de autenticação persistido e redirecionando o usuário para
 * a tela de login sem necessidade de intervenção adicional na camada de view.
 *
 * Esta instância deve ser utilizada em toda a aplicação; chamadas diretas ao
 * `axios` global devem ser evitadas para garantir o comportamento consistente
 * dos interceptors.
 */

import axios from 'axios'

/**
 * Instância Axios configurada com a URL base da API e timeout de 10 segundos.
 * A URL base é lida da variável de ambiente `VITE_API_URL`, com fallback para
 * localhost em ambiente de desenvolvimento.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  // Timeout de 10 segundos para evitar que requisições penduradas bloqueiem a UI indefinidamente
  timeout: 10000,
})

/**
 * Interceptor de requisição: injeta o token JWT no header Authorization.
 *
 * Lê o token diretamente do `localStorage` a cada requisição, e não de uma
 * variável em memória. Isso garante que, mesmo após um refresh de página, o
 * token mais recente seja sempre utilizado sem necessidade de re-login.
 *
 * O header só é adicionado se o token existir; requisições públicas (login,
 * register) não serão afetadas se não houver token armazenado.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    // Padrão Bearer Token conforme RFC 6750 para autenticação OAuth2/JWT
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Interceptor de resposta: trata erros HTTP de forma centralizada.
 *
 * Em caso de erro 401 (Unauthorized), o token e os dados do usuário são removidos
 * do `localStorage` e o usuário é redirecionado para `/login` via `window.location.href`.
 * O uso de `window.location.href` (redirecionamento completo) em vez de `router.push`
 * é intencional: garante que o estado do Vue e do Pinia seja totalmente reiniciado,
 * evitando que dados obsoletos do usuário anterior permaneçam em memória.
 *
 * Para todos os outros erros, a Promise é rejeitada normalmente para que a view
 * ou o store chamador possa tratar o erro de forma específica.
 */
api.interceptors.response.use(
  // Requisições bem-sucedidas passam direto sem transformação
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Remove credenciais persistidas para forçar novo login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Redirecionamento completo de página para garantir limpeza total do estado da aplicação
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
