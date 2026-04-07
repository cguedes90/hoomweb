<template>
  <div>
    <div class="page-header">
      <h1>Tarefas</h1>
      <button class="btn btn-primary" @click="openCreate">+ Nova Tarefa</button>
    </div>

    <div class="filters">
      <select v-model="filterStatus" @change="load">
        <option value="">Todos os status</option>
        <option value="pending">Pendente</option>
        <option value="in_progress">Em andamento</option>
        <option value="done">Concluído</option>
        <option value="cancelled">Cancelado</option>
      </select>
      <select v-model="filterClient" @change="load">
        <option value="">Todos os clientes</option>
        <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>

    <div class="card">
      <div v-if="loading" class="empty-state">Carregando...</div>
      <div v-else-if="tasks.length === 0" class="empty-state">Nenhuma tarefa encontrada.</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Cliente</th>
            <th>Status</th>
            <th>Vencimento</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in tasks" :key="t.id">
            <td>{{ t.title }}</td>
            <td>{{ t.client_name }}</td>
            <td><span :class="`badge badge-${t.status}`">{{ statusLabel(t.status) }}</span></td>
            <td>{{ t.due_date ? formatDate(t.due_date) : '—' }}</td>
            <td>
              <button class="btn btn-secondary btn-sm" @click="openEdit(t)">Editar</button>
              &nbsp;
              <button class="btn btn-danger btn-sm" @click="removeTask(t.id)">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editing ? 'Editar Tarefa' : 'Nova Tarefa' }}</h2>
          <button class="modal-close" @click="closeModal">×</button>
        </div>

        <form @submit.prevent="save">
          <div class="form-group">
            <label>Título *</label>
            <input v-model="form.title" required />
          </div>
          <div class="form-group">
            <label>Descrição</label>
            <textarea v-model="form.description" rows="3"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Cliente *</label>
              <select v-model="form.client_id" required>
                <option value="">Selecione...</option>
                <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Status</label>
              <select v-model="form.status">
                <option value="pending">Pendente</option>
                <option value="in_progress">Em andamento</option>
                <option value="done">Concluído</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Data de vencimento</label>
            <input v-model="form.due_date" type="date" />
          </div>

          <p v-if="formError" class="error-msg">{{ formError }}</p>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'

interface Task {
  id: number
  title: string
  description?: string
  status: string
  due_date?: string
  client_id: number
  client_name: string
}

interface Client { id: number; name: string }

const tasks = ref<Task[]>([])
const clients = ref<Client[]>([])
const loading = ref(true)
const showModal = ref(false)
const editing = ref<Task | null>(null)
const saving = ref(false)
const formError = ref('')
const filterStatus = ref('')
const filterClient = ref<number | ''>('')

const defaultForm = () => ({
  title: '', description: '', status: 'pending', due_date: '', client_id: '' as number | '',
})
const form = ref(defaultForm())

async function load() {
  loading.value = true
  const params: Record<string, unknown> = {}
  if (filterStatus.value) params.status = filterStatus.value
  if (filterClient.value) params.client_id = filterClient.value
  const { data } = await api.get('/tasks', { params })
  tasks.value = data
  loading.value = false
}

async function loadClients() {
  const { data } = await api.get('/clients')
  clients.value = data
}

function openCreate() {
  editing.value = null
  form.value = defaultForm()
  formError.value = ''
  showModal.value = true
}

function openEdit(t: Task) {
  editing.value = t
  form.value = {
    title: t.title,
    description: t.description || '',
    status: t.status,
    due_date: t.due_date ? t.due_date.slice(0, 10) : '',
    client_id: t.client_id,
  }
  formError.value = ''
  showModal.value = true
}

function closeModal() { showModal.value = false }

async function save() {
  formError.value = ''
  saving.value = true
  try {
    if (editing.value) {
      const { data } = await api.put(`/tasks/${editing.value.id}`, form.value)
      const idx = tasks.value.findIndex(t => t.id === editing.value!.id)
      tasks.value[idx] = { ...tasks.value[idx], ...data }
    } else {
      const { data } = await api.post('/tasks', form.value)
      const client = clients.value.find(c => c.id === data.client_id)
      tasks.value.unshift({ ...data, client_name: client?.name || '' })
    }
    closeModal()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    formError.value = err.response?.data?.error || 'Erro ao salvar'
  } finally {
    saving.value = false
  }
}

async function removeTask(id: number) {
  if (!confirm('Excluir esta tarefa?')) return
  await api.delete(`/tasks/${id}`)
  tasks.value = tasks.value.filter(t => t.id !== id)
}

function statusLabel(s: string) {
  return { pending: 'Pendente', in_progress: 'Em andamento', done: 'Concluído', cancelled: 'Cancelado' }[s] || s
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

onMounted(async () => {
  await Promise.all([load(), loadClients()])
})
</script>
