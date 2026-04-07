<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <h1>Hoomweb</h1>
      <p class="subtitle">Sistema de Gestão de Clientes e Tarefas</p>

      <form @submit.prevent="submit">
        <div class="form-group">
          <label>E-mail</label>
          <input v-model="form.email" type="email" required placeholder="seu@email.com" />
        </div>
        <div class="form-group">
          <label>Senha</label>
          <input v-model="form.password" type="password" required placeholder="••••••" />
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <p class="auth-link">
        Não tem conta? <RouterLink to="/register">Cadastre-se</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @component LoginView
 * @description Tela de autenticação da aplicação.
 *
 * Exibe um formulário de login com campos de e-mail e senha. Ao submeter,
 * delega a autenticação ao `useAuthStore`, que realiza a chamada à API e
 * persiste o token no `localStorage`. Em caso de sucesso, redireciona o
 * usuário para a área principal (`/clients`).
 *
 * Erros de autenticação (credenciais inválidas, falha de rede) são exibidos
 * diretamente abaixo dos campos do formulário.
 *
 * O botão de submit é desabilitado durante o processamento para evitar
 * múltiplos envios simultâneos.
 */
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/** Store de autenticação: gerencia o estado da sessão e expõe a ação `login`. */
const auth = useAuthStore()
/** Router para redirecionamento programático após login bem-sucedido. */
const router = useRouter()
/** Dados do formulário de login. */
const form = ref({ email: '', password: '' })
/** Mensagem de erro exibida ao usuário em caso de falha na autenticação. */
const error = ref('')
/** Indica se a requisição de login está em andamento. */
const loading = ref(false)

/**
 * Submete o formulário de login.
 *
 * Limpa o erro anterior, aciona o estado de loading e chama `auth.login`.
 * Em caso de sucesso, redireciona para `/clients` via router (navegação SPA,
 * sem recarregar a página). Em caso de falha, exibe a mensagem retornada
 * pelo backend ou uma mensagem genérica de fallback.
 *
 * O bloco `finally` garante que o estado de loading seja sempre resetado,
 * mesmo em caso de erro inesperado.
 */
async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(form.value.email, form.value.password)
    // Redireciona para a tela principal após autenticação bem-sucedida
    router.push('/clients')
  } catch (e: unknown) {
    // Tipagem manual necessária pois o TypeScript infere `unknown` em blocos catch
    const err = e as { response?: { data?: { error?: string } } }
    error.value = err.response?.data?.error || 'Erro ao fazer login'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(135deg, #1a56db 0%, #1648c4 100%);
}
.auth-card {
  background: white;
  border-radius: 12px;
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0,0,0,.2);
}
.auth-card h1 { text-align: center; color: #1a56db; margin-bottom: .25rem; }
.subtitle { text-align: center; color: #6b7280; font-size: .875rem; margin-bottom: 2rem; }
.btn-block { width: 100%; padding: .65rem; margin-top: .5rem; }
.auth-link { text-align: center; margin-top: 1.25rem; font-size: .875rem; color: #6b7280; }
.auth-link a { color: #1a56db; }

@media (max-width: 480px) {
  .auth-card { padding: 1.75rem 1.25rem; border-radius: 10px; }
}
</style>
