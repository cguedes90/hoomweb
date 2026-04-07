<template>
  <div class="app-layout" :class="{ 'has-sidebar': auth.isAuthenticated }">
    <!-- Sidebar desktop -->
    <aside v-if="auth.isAuthenticated" class="sidebar">
      <div class="sidebar-brand">
        <span class="sidebar-logo">H</span>
        <span class="sidebar-name">Hoomweb</span>
      </div>
      <nav class="sidebar-nav">
        <RouterLink to="/clients" class="sidebar-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Clientes
        </RouterLink>
        <RouterLink to="/tasks" class="sidebar-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          Tarefas
        </RouterLink>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-avatar">{{ userInitial }}</div>
          <div class="sidebar-user-info">
            <span class="sidebar-user-name">{{ auth.user?.name }}</span>
            <span class="sidebar-user-role">{{ auth.user?.email }}</span>
          </div>
        </div>
        <button @click="logout" class="btn-logout" title="Sair">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    </aside>

    <!-- Top navbar mobile -->
    <header v-if="auth.isAuthenticated" class="topbar">
      <span class="topbar-brand">Hoomweb</span>
      <div class="topbar-links">
        <RouterLink to="/clients">Clientes</RouterLink>
        <RouterLink to="/tasks">Tarefas</RouterLink>
        <button @click="logout" class="btn-logout">Sair</button>
      </div>
    </header>

    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const userInitial = computed(() => auth.user?.name?.charAt(0).toUpperCase() || '?')

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #app { height: 100%; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; color: #111827; }

/* ── Layout shell ──────────────────────────────────────────── */
.app-layout { display: flex; flex-direction: column; min-height: 100vh; }
.app-layout.has-sidebar { flex-direction: row; }

/* ── Sidebar ───────────────────────────────────────────────── */
.sidebar {
  display: none;
}
@media (min-width: 768px) {
  .sidebar {
    display: flex;
    flex-direction: column;
    width: 240px;
    min-width: 240px;
    background: #1a56db;
    color: white;
    height: 100vh;
    position: sticky;
    top: 0;
  }
}
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: 1.5rem 1.25rem 1rem;
  border-bottom: 1px solid rgba(255,255,255,.15);
}
.sidebar-logo {
  width: 36px; height: 36px;
  background: rgba(255,255,255,.2);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 1.1rem;
}
.sidebar-name { font-size: 1.15rem; font-weight: 700; }
.sidebar-nav { flex: 1; padding: 1rem .75rem; display: flex; flex-direction: column; gap: .25rem; }
.sidebar-link {
  display: flex; align-items: center; gap: .75rem;
  padding: .65rem .9rem;
  border-radius: 8px;
  color: rgba(255,255,255,.8);
  text-decoration: none;
  font-size: .9rem;
  transition: background .15s, color .15s;
}
.sidebar-link:hover { background: rgba(255,255,255,.15); color: white; }
.sidebar-link.router-link-active { background: rgba(255,255,255,.2); color: white; font-weight: 600; }
.sidebar-footer {
  padding: 1rem .75rem;
  border-top: 1px solid rgba(255,255,255,.15);
  display: flex; align-items: center; gap: .5rem;
}
.sidebar-user { display: flex; align-items: center; gap: .6rem; flex: 1; min-width: 0; }
.sidebar-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(255,255,255,.25);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: .85rem; flex-shrink: 0;
}
.sidebar-user-info { display: flex; flex-direction: column; min-width: 0; }
.sidebar-user-name { font-size: .82rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sidebar-user-role { font-size: .72rem; opacity: .65; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.btn-logout {
  background: rgba(255,255,255,.15); border: none; color: white;
  padding: .4rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center;
  flex-shrink: 0;
}
.btn-logout:hover { background: rgba(255,255,255,.3); }

/* ── Top navbar (mobile only) ──────────────────────────────── */
.topbar {
  background: #1a56db; color: white;
  padding: 0 1.25rem; height: 52px;
  display: flex; align-items: center; justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0,0,0,.15);
}
.topbar-brand { font-size: 1.15rem; font-weight: 700; }
.topbar-links { display: flex; align-items: center; gap: 1rem; }
.topbar-links a { color: white; text-decoration: none; font-size: .9rem; opacity: .85; }
.topbar-links a.router-link-active { opacity: 1; font-weight: 600; }
@media (min-width: 768px) { .topbar { display: none; } }

/* ── Main content ──────────────────────────────────────────── */
.main-content {
  flex: 1;
  padding: 1.5rem 1.25rem;
  min-width: 0;
  overflow-x: hidden;
}
@media (min-width: 768px) {
  .main-content { padding: 2rem 2.5rem; }
}

/* ── Common components ─────────────────────────────────────── */
.card { background: white; border-radius: 10px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,.08); margin-bottom: 1.5rem; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: .35rem; font-weight: 500; font-size: .875rem; color: #374151; }
.form-group input, .form-group select, .form-group textarea {
  width: 100%; padding: .55rem .75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: .9rem; background: white;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
  outline: none; border-color: #1a56db; box-shadow: 0 0 0 3px rgba(26,86,219,.12);
}
.form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
.btn { padding: .5rem 1.25rem; border: none; border-radius: 6px; cursor: pointer; font-size: .9rem; font-weight: 500; transition: background .15s; }
.btn-primary { background: #1a56db; color: white; }
.btn-primary:hover:not(:disabled) { background: #1648c4; }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.btn-secondary { background: #6b7280; color: white; }
.btn-secondary:hover { background: #4b5563; }
.btn-danger { background: #dc2626; color: white; }
.btn-danger:hover { background: #b91c1c; }
.btn-sm { padding: .3rem .75rem; font-size: .8rem; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: .85rem 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
.table th { font-size: .78rem; text-transform: uppercase; letter-spacing: .04em; color: #6b7280; background: #f9fafb; }
.table th:first-child { border-radius: 6px 0 0 0; }
.table th:last-child { border-radius: 0 6px 0 0; }
.table tr:last-child td { border-bottom: none; }
.table tr:hover td { background: #f9fafb; }
.badge { display: inline-flex; align-items: center; padding: .25rem .65rem; border-radius: 999px; font-size: .75rem; font-weight: 500; }
.badge-pending { background: #fef3c7; color: #92400e; }
.badge-in_progress { background: #dbeafe; color: #1e40af; }
.badge-done { background: #d1fae5; color: #065f46; }
.badge-cancelled { background: #f3f4f6; color: #6b7280; }
.error-msg { color: #dc2626; font-size: .875rem; margin-top: .35rem; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.75rem; flex-wrap: wrap; gap: 1rem; }
.page-header h1 { font-size: 1.6rem; font-weight: 700; color: #111827; }
.filters { display: flex; gap: .75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.filters select, .filters input { padding: .45rem .75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: .875rem; background: white; }
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex;
  align-items: center; justify-content: center; z-index: 1000; padding: 1rem;
}
.modal {
  background: white; border-radius: 12px; padding: 1.75rem;
  width: 100%; max-width: 580px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 25px 60px rgba(0,0,0,.25);
}
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.modal-header h2 { font-size: 1.15rem; font-weight: 700; }
.modal-close { background: none; border: none; font-size: 1.4rem; cursor: pointer; color: #9ca3af; line-height: 1; }
.modal-close:hover { color: #374151; }
.modal-footer { display: flex; justify-content: flex-end; gap: .75rem; margin-top: 1.5rem; }
.empty-state { text-align: center; padding: 4rem 2rem; color: #9ca3af; font-size: .95rem; }
</style>
