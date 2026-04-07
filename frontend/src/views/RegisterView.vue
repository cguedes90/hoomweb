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
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const form = ref({ name: '', email: '', password: '' })
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.register(form.value.name, form.value.email, form.value.password)
    router.push('/clients')
  } catch (e: unknown) {
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
