<template>
  <div id="app">
    <nav v-if="auth.isAuthenticated" class="navbar">
      <div class="nav-brand">Hoomweb</div>
      <div class="nav-links">
        <RouterLink to="/clients">Clientes</RouterLink>
        <RouterLink to="/tasks">Tarefas</RouterLink>
        <span class="nav-user">{{ auth.user?.name }}</span>
        <button @click="logout" class="btn-logout">Sair</button>
      </div>
    </nav>
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #333; }
.navbar {
  background: #1a56db;
  color: white;
  padding: 0 1.5rem;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0,0,0,.15);
}
.nav-brand { font-size: 1.25rem; font-weight: 700; }
.nav-links { display: flex; align-items: center; gap: 1.25rem; }
.nav-links a { color: white; text-decoration: none; opacity: .85; }
.nav-links a.router-link-active { opacity: 1; font-weight: 600; border-bottom: 2px solid white; }
.nav-user { font-size: .875rem; opacity: .75; }
.btn-logout { background: rgba(255,255,255,.2); border: none; color: white; padding: .35rem .75rem; border-radius: 4px; cursor: pointer; }
.btn-logout:hover { background: rgba(255,255,255,.35); }
.main-content { padding: 2rem; max-width: 1100px; margin: 0 auto; }
.card { background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,.1); margin-bottom: 1.5rem; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: .35rem; font-weight: 500; font-size: .875rem; }
.form-group input, .form-group select, .form-group textarea {
  width: 100%; padding: .5rem .75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: .9rem;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
  outline: none; border-color: #1a56db; box-shadow: 0 0 0 3px rgba(26,86,219,.15);
}
.form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
.btn { padding: .5rem 1.25rem; border: none; border-radius: 6px; cursor: pointer; font-size: .9rem; font-weight: 500; }
.btn-primary { background: #1a56db; color: white; }
.btn-primary:hover { background: #1648c4; }
.btn-secondary { background: #6b7280; color: white; }
.btn-secondary:hover { background: #4b5563; }
.btn-danger { background: #dc2626; color: white; }
.btn-danger:hover { background: #b91c1c; }
.btn-sm { padding: .3rem .75rem; font-size: .8rem; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: .75rem 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
.table th { font-size: .8rem; text-transform: uppercase; color: #6b7280; }
.table tr:hover td { background: #f9fafb; }
.badge { display: inline-block; padding: .2rem .6rem; border-radius: 999px; font-size: .75rem; font-weight: 500; }
.badge-pending { background: #fef3c7; color: #92400e; }
.badge-in_progress { background: #dbeafe; color: #1e40af; }
.badge-done { background: #d1fae5; color: #065f46; }
.badge-cancelled { background: #f3f4f6; color: #6b7280; }
.error-msg { color: #dc2626; font-size: .875rem; margin-top: .35rem; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.page-header h1 { font-size: 1.5rem; }
.filters { display: flex; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.filters select, .filters input { padding: .4rem .75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: .875rem; }
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex;
  align-items: center; justify-content: center; z-index: 1000;
}
.modal {
  background: white; border-radius: 10px; padding: 1.5rem;
  width: 100%; max-width: 540px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,.3);
}
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
.modal-header h2 { font-size: 1.1rem; }
.modal-close { background: none; border: none; font-size: 1.25rem; cursor: pointer; color: #6b7280; }
.modal-footer { display: flex; justify-content: flex-end; gap: .75rem; margin-top: 1.25rem; }
.empty-state { text-align: center; padding: 3rem; color: #9ca3af; }
</style>
