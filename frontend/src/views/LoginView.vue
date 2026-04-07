<template>
  <div class="auth-wrapper">
    <!-- Painel esquerdo: branding (visível só no desktop) -->
    <div class="auth-hero">
      <div class="auth-hero-content">
        <div class="auth-hero-logo">H</div>
        <h2>Hoomweb</h2>
        <p>Gerencie clientes e tarefas com eficiência. Tudo em um só lugar.</p>
        <ul class="auth-features">
          <li>✓ Cadastro e gestão de clientes</li>
          <li>✓ Tarefas vinculadas a clientes</li>
          <li>✓ Filtros por status e cliente</li>
          <li>✓ Preenchimento automático de CEP</li>
        </ul>
      </div>
    </div>

    <!-- Painel direito: formulário -->
    <div class="auth-form-panel">
      <div class="auth-card">
        <h1>Bem-vindo de volta</h1>
        <p class="subtitle">Faça login para continuar</p>

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
}

/* ── Hero panel (desktop only) ── */
.auth-hero {
  display: none;
}
@media (min-width: 768px) {
  .auth-hero {
    display: flex;
    flex: 1;
    background: linear-gradient(145deg, #1a56db 0%, #1035a8 100%);
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: white;
  }
}
.auth-hero-content { max-width: 380px; }
.auth-hero-logo {
  width: 56px; height: 56px;
  background: rgba(255,255,255,.2);
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.6rem; font-weight: 800;
  margin-bottom: 1.5rem;
}
.auth-hero-content h2 { font-size: 2rem; font-weight: 800; margin-bottom: .75rem; }
.auth-hero-content p { font-size: 1rem; opacity: .85; margin-bottom: 2rem; line-height: 1.6; }
.auth-features { list-style: none; display: flex; flex-direction: column; gap: .6rem; }
.auth-features li { font-size: .9rem; opacity: .9; }

/* ── Form panel ── */
.auth-form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  background: #f3f4f6;
  width: 100%;
}
@media (min-width: 768px) {
  .auth-form-panel {
    width: 480px;
    min-width: 480px;
    flex: none;
    padding: 3rem 2.5rem;
    background: #f3f4f6;
  }
}
.auth-card {
  background: white;
  border-radius: 14px;
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 24px rgba(0,0,0,.08);
}
.auth-card h1 { color: #111827; font-size: 1.5rem; margin-bottom: .3rem; }
.subtitle { color: #6b7280; font-size: .875rem; margin-bottom: 2rem; }
.btn-block { width: 100%; padding: .7rem; margin-top: .5rem; font-size: .95rem; }
.auth-link { text-align: center; margin-top: 1.25rem; font-size: .875rem; color: #6b7280; }
.auth-link a { color: #1a56db; font-weight: 500; }
</style>
