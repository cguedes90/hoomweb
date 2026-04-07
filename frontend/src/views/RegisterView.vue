<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <h1>Criar conta</h1>
      <form @submit.prevent="submit">
        <div class="form-group">
          <label>Nome</label>
          <input v-model="form.name" type="text" required placeholder="Seu nome" />
        </div>
        <div class="form-group">
          <label>E-mail</label>
          <input v-model="form.email" type="email" required placeholder="seu@email.com" />
        </div>
        <div class="form-group">
          <label>Senha</label>
          <input v-model="form.password" type="password" required placeholder="Mínimo 6 caracteres" minlength="6" />
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? 'Cadastrando...' : 'Criar conta' }}
        </button>
      </form>
      <p class="auth-link">
        Já tem conta? <RouterLink to="/login">Entrar</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @component RegisterView
 * @description Tela de cadastro de novo usuário.
 *
 * Exibe um formulário com campos de nome, e-mail e senha. Ao submeter, delega
 * o cadastro ao `useAuthStore`, que chama a API e já autentica o usuário com
 * o token retornado na mesma resposta. Em caso de sucesso, redireciona para
 * `/clients` sem necessidade de um login adicional.
 *
 * A validação mínima de senha (6 caracteres) é aplicada pelo atributo `minlength`
 * no input do template, complementada pela validação do backend. Erros de negócio
 * — como e-mail já cadastrado — são exibidos abaixo dos campos do formulário.
 */
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/** Store de autenticação: gerencia o estado da sessão e expõe a ação `register`. */
const auth = useAuthStore()
/** Router para redirecionamento programático após cadastro bem-sucedido. */
const router = useRouter()
/** Dados do formulário de cadastro. */
const form = ref({ name: '', email: '', password: '' })
/** Mensagem de erro exibida ao usuário em caso de falha no cadastro. */
const error = ref('')
/** Indica se a requisição de cadastro está em andamento. */
const loading = ref(false)

/**
 * Submete o formulário de cadastro.
 *
 * Chama `auth.register`, que cria o usuário no backend e já inicia a sessão
 * com o token retornado — comportamento que evita a etapa redundante de login
 * logo após o cadastro. Em caso de sucesso, redireciona para `/clients`.
 *
 * Erros comuns tratados: e-mail duplicado (409 do backend) e erros de validação
 * de campos. O fallback da mensagem garante que o usuário sempre receba algum
 * feedback em caso de falha inesperada.
 *
 * O bloco `finally` garante que o estado de loading seja resetado mesmo em
 * caso de erro não previsto.
 */
async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.register(form.value.name, form.value.email, form.value.password)
    // O backend retorna token + user após o registro, então o usuário já está autenticado aqui
    router.push('/clients')
  } catch (e: unknown) {
    // Tipagem manual necessária pois o TypeScript infere `unknown` em blocos catch
    const err = e as { response?: { data?: { error?: string } } }
    error.value = err.response?.data?.error || 'Erro ao cadastrar'
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

@media (max-width: 480px) {
  .auth-card { padding: 1.75rem 1.25rem; border-radius: 10px; }
}
.auth-card h1 { text-align: center; color: #1a56db; margin-bottom: 1.5rem; }
.btn-block { width: 100%; padding: .65rem; margin-top: .5rem; }
.auth-link { text-align: center; margin-top: 1.25rem; font-size: .875rem; color: #6b7280; }
.auth-link a { color: #1a56db; }
</style>
