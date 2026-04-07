<template>
  <div class="auth-wrapper">
    <div class="auth-hero">
      <div class="auth-hero-content">
        <div class="auth-hero-logo">H</div>
        <h2>Recuperar senha</h2>
        <p>Informe seu e-mail e enviaremos um link para você criar uma nova senha.</p>
      </div>
    </div>

    <div class="auth-form-panel">
      <div class="auth-card">
        <template v-if="!sent">
          <h1>Esqueci minha senha</h1>
          <p class="subtitle">Enviaremos um link para seu e-mail</p>

          <form @submit.prevent="submit">
            <div class="form-group">
              <label>E-mail</label>
              <input v-model="email" type="email" required placeholder="seu@email.com" />
            </div>
            <p v-if="error" class="error-msg">{{ error }}</p>
            <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
              {{ loading ? 'Enviando...' : 'Enviar link de recuperação' }}
            </button>
          </form>
        </template>

        <template v-else>
          <div class="success-box">
            <div class="success-icon">✉️</div>
            <h1>E-mail enviado!</h1>
            <p>Se o e-mail <strong>{{ email }}</strong> estiver cadastrado, você receberá as instruções em breve.</p>
            <p class="hint">Verifique também sua pasta de spam.</p>
          </div>
        </template>

        <p class="auth-link">
          <RouterLink to="/login">← Voltar para o login</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/services/api'

const email = ref('')
const error = ref('')
const loading = ref(false)
const sent = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await api.post('/auth/forgot-password', { email: email.value })
    sent.value = true
  } catch {
    error.value = 'Erro ao processar solicitação. Tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-wrapper { min-height: 100vh; width: 100%; display: flex; }

.auth-hero { display: none; }
@media (min-width: 768px) {
  .auth-hero {
    display: flex; flex: 1;
    background: linear-gradient(145deg, #1a56db 0%, #1035a8 100%);
    align-items: center; justify-content: center; padding: 3rem; color: white;
  }
}
.auth-hero-content { max-width: 380px; }
.auth-hero-logo {
  width: 56px; height: 56px; background: rgba(255,255,255,.2); border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.6rem; font-weight: 800; margin-bottom: 1.5rem;
}
.auth-hero-content h2 { font-size: 2rem; font-weight: 800; margin-bottom: .75rem; }
.auth-hero-content p { font-size: 1rem; opacity: .85; line-height: 1.6; }

.auth-form-panel {
  display: flex; align-items: center; justify-content: center;
  padding: 2rem 1.5rem; background: #f3f4f6; width: 100%;
}
@media (min-width: 768px) {
  .auth-form-panel { width: 480px; min-width: 480px; flex: none; padding: 3rem 2.5rem; }
}
.auth-card {
  background: white; border-radius: 14px; padding: 2.5rem;
  width: 100%; max-width: 400px; box-shadow: 0 4px 24px rgba(0,0,0,.08);
}
.auth-card h1 { color: #111827; font-size: 1.5rem; margin-bottom: .3rem; }
.subtitle { color: #6b7280; font-size: .875rem; margin-bottom: 2rem; }
.btn-block { width: 100%; padding: .7rem; margin-top: .5rem; font-size: .95rem; }
.auth-link { text-align: center; margin-top: 1.25rem; font-size: .875rem; }
.auth-link a { color: #1a56db; font-weight: 500; }

.success-box { text-align: center; padding: .5rem 0 1.5rem; }
.success-icon { font-size: 3rem; margin-bottom: 1rem; }
.success-box h1 { color: #065f46; font-size: 1.4rem; margin-bottom: .75rem; }
.success-box p { color: #374151; font-size: .9rem; line-height: 1.6; margin-bottom: .5rem; }
.hint { color: #9ca3af; font-size: .8rem; }
</style>
