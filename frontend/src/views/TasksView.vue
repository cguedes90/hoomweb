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
/**
 * @component TasksView
 * @description View responsável pelo gerenciamento completo de tarefas (CRUD) com filtros.
 *
 * Exibe a lista de tarefas do usuário em uma tabela com suporte a filtragem por
 * status e por cliente. O modal de criação/edição é controlado pelo mesmo padrão
 * de `editing` utilizado na `ClientsView`.
 *
 * Na montagem, `load` e `loadClients` são executados em paralelo com `Promise.all`
 * para reduzir o tempo de carregamento inicial — a lista de clientes é necessária
 * tanto para os selects de filtro quanto para o formulário do modal.
 *
 * O campo `client_name` presente em cada tarefa é retornado diretamente pela API
 * via JOIN, evitando lookups adicionais no frontend para exibir o nome do cliente.
 */
import { ref, onMounted } from 'vue'
import api from '@/services/api'

/**
 * Estrutura de dados de uma tarefa conforme retornada pela API.
 * O campo `client_name` é um campo extra adicionado pelo JOIN no backend e
 * não faz parte da tabela `tasks` diretamente.
 */
interface Task {
  id: number
  title: string
  description?: string
  /** Status atual da tarefa. Corresponde ao tipo `TaskStatus` do backend. */
  status: string
  /** Data de vencimento em formato ISO 8601 (ex.: "2025-12-31T00:00:00.000Z"). */
  due_date?: string
  client_id: number
  /** Nome do cliente, obtido via JOIN na query do backend. */
  client_name: string
}

/** Estrutura mínima do cliente, usada nos selects de filtro e do formulário. */
interface Client { id: number; name: string }

/** Lista de tarefas carregada da API, respeitando os filtros ativos. */
const tasks = ref<Task[]>([])
/** Lista de clientes do usuário, usada nos selects de filtro e de associação de tarefas. */
const clients = ref<Client[]>([])
/** Indica se a carga de tarefas está em andamento. */
const loading = ref(true)
/** Controla a visibilidade do modal de criação/edição. */
const showModal = ref(false)
/** Referência à tarefa sendo editada. `null` quando em modo de criação. */
const editing = ref<Task | null>(null)
/** Indica se o formulário está sendo submetido (evita duplo envio). */
const saving = ref(false)
/** Mensagem de erro do formulário exibida acima dos botões de ação. */
const formError = ref('')
/** Filtro de status ativo. String vazia significa "todos os status". */
const filterStatus = ref('')
/** Filtro de cliente ativo. String vazia ('') significa "todos os clientes". */
const filterClient = ref<number | ''>('')

/**
 * Fábrica de formulário vazio para tarefas.
 * O `client_id` pode ser number ou '' para compatibilidade com o select do HTML
 * que usa string vazia como placeholder de "não selecionado".
 */
const defaultForm = () => ({
  title: '', description: '', status: 'pending', due_date: '', client_id: '' as number | '',
})
const form = ref(defaultForm())

/**
 * Carrega as tarefas da API aplicando os filtros ativos.
 *
 * Constrói os query params dinamicamente: apenas inclui `status` e `client_id`
 * se tiverem valores não vazios, evitando que o backend receba filtros vazios
 * que poderiam ser interpretados de forma indesejada.
 *
 * Esta função é chamada na montagem do componente e novamente sempre que um
 * filtro é alterado (via `@change` nos selects do template).
 */
async function load() {
  loading.value = true
  const params: Record<string, unknown> = {}
  // Adiciona apenas os filtros com valor para não enviar parâmetros vazios à API
  if (filterStatus.value) params.status = filterStatus.value
  if (filterClient.value) params.client_id = filterClient.value
  const { data } = await api.get('/tasks', { params })
  tasks.value = data
  loading.value = false
}

/**
 * Carrega todos os clientes do usuário para popular os selects do formulário e dos filtros.
 * Esta chamada é feita uma única vez na montagem do componente, pois a lista de clientes
 * não muda durante a navegação na view de tarefas.
 */
async function loadClients() {
  const { data } = await api.get('/clients')
  clients.value = data
}

/**
 * Abre o modal no modo de criação de nova tarefa.
 */
function openCreate() {
  editing.value = null
  form.value = defaultForm()
  formError.value = ''
  showModal.value = true
}

/**
 * Abre o modal no modo de edição de uma tarefa existente.
 *
 * A data de vencimento é truncada para `YYYY-MM-DD` (primeiros 10 caracteres do ISO 8601)
 * para compatibilidade com o input type="date" do HTML, que não aceita o formato completo
 * com horário e fuso horário retornado pela API.
 *
 * @param t - Objeto da tarefa a ser editada.
 */
function openEdit(t: Task) {
  editing.value = t
  form.value = {
    title: t.title,
    description: t.description || '',
    status: t.status,
    // Trunca para "YYYY-MM-DD" — input[type=date] não aceita timestamp completo
    due_date: t.due_date ? t.due_date.slice(0, 10) : '',
    client_id: t.client_id,
  }
  formError.value = ''
  showModal.value = true
}

/** Fecha o modal sem salvar. */
function closeModal() { showModal.value = false }

/**
 * Salva a tarefa (criação ou atualização) e atualiza a lista local.
 *
 * Em modo de edição: faz PUT e mescla a resposta com os dados existentes via spread,
 * preservando `client_name` que a API de update não retorna no RETURNING básico.
 *
 * Em modo de criação: faz POST, busca o nome do cliente localmente na lista em memória
 * (evita outro GET /clients) e adiciona a tarefa no início da lista (unshift) para
 * simular a ordenação por `created_at DESC` usada pelo backend.
 */
async function save() {
  formError.value = ''
  saving.value = true
  try {
    if (editing.value) {
      const { data } = await api.put(`/tasks/${editing.value.id}`, form.value)
      const idx = tasks.value.findIndex(t => t.id === editing.value!.id)
      // Spread preserva client_name e outros campos não retornados pelo endpoint de update
      tasks.value[idx] = { ...tasks.value[idx], ...data }
    } else {
      const { data } = await api.post('/tasks', form.value)
      // Busca o nome do cliente na lista em memória para não fazer outro GET /clients
      const client = clients.value.find(c => c.id === data.client_id)
      // unshift adiciona no início para respeitar a ordenação DESC da lista existente
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

/**
 * Remove uma tarefa após confirmação do usuário.
 *
 * @param id - ID da tarefa a ser removida.
 */
async function removeTask(id: number) {
  if (!confirm('Excluir esta tarefa?')) return
  await api.delete(`/tasks/${id}`)
  // Atualiza a lista local sem recarregar do servidor
  tasks.value = tasks.value.filter(t => t.id !== id)
}

/**
 * Converte o valor interno do status para o rótulo exibido na interface.
 *
 * Utiliza acesso por chave em um objeto literal em vez de switch/case,
 * produzindo código mais conciso. O fallback `|| s` retorna o próprio valor
 * caso um status desconhecido seja recebido, evitando exibir undefined.
 *
 * @param s - Valor interno do status (ex.: 'in_progress').
 * @returns Rótulo legível em português (ex.: 'Em andamento').
 */
function statusLabel(s: string) {
  return { pending: 'Pendente', in_progress: 'Em andamento', done: 'Concluído', cancelled: 'Cancelado' }[s] || s
}

/**
 * Formata uma string de data ISO 8601 para o padrão brasileiro (DD/MM/AAAA).
 *
 * @param d - Data em formato ISO 8601 ou compatível com `new Date()`.
 * @returns Data formatada no padrão pt-BR.
 */
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

// Carrega tarefas e clientes em paralelo na montagem para minimizar o tempo de carregamento inicial
onMounted(async () => {
  await Promise.all([load(), loadClients()])
})
</script>
