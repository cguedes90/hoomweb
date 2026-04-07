<template>
  <div>
    <div class="page-header">
      <h1>Clientes</h1>
      <button class="btn btn-primary" @click="openCreate">+ Novo Cliente</button>
    </div>

    <div class="card">
      <div v-if="loading" class="empty-state">Carregando...</div>
      <div v-else-if="clients.length === 0" class="empty-state">Nenhum cliente cadastrado.</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Telefone</th>
            <th>Cidade/UF</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in clients" :key="c.id">
            <td>{{ c.name }}</td>
            <td>{{ c.email || '—' }}</td>
            <td>{{ c.phone || '—' }}</td>
            <td>{{ c.city ? `${c.city}/${c.state}` : '—' }}</td>
            <td>
              <button class="btn btn-secondary btn-sm" @click="openEdit(c)">Editar</button>
              &nbsp;
              <button class="btn btn-danger btn-sm" @click="removeClient(c.id)">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editing ? 'Editar Cliente' : 'Novo Cliente' }}</h2>
          <button class="modal-close" @click="closeModal">×</button>
        </div>

        <form @submit.prevent="save">
          <div class="form-group">
            <label>Nome *</label>
            <input v-model="form.name" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>E-mail</label>
              <input v-model="form.email" type="email" />
            </div>
            <div class="form-group">
              <label>Telefone</label>
              <input v-model="form.phone" />
            </div>
          </div>
          <div class="form-group">
            <label>CPF/CNPJ</label>
            <input v-model="form.document" />
          </div>

          <hr style="margin: 1rem 0; border-color: #e5e7eb;" />
          <p style="font-size:.8rem;color:#6b7280;margin-bottom:.75rem;">Endereço</p>

          <div class="form-row">
            <div class="form-group">
              <label>CEP</label>
              <div style="display:flex;gap:.5rem;">
                <input v-model="form.zipcode" @blur="lookupCep" placeholder="00000-000" />
                <button type="button" class="btn btn-secondary btn-sm" @click="lookupCep" :disabled="cepLoading">
                  {{ cepLoading ? '...' : 'Buscar' }}
                </button>
              </div>
            </div>
            <div class="form-group">
              <label>Estado</label>
              <input v-model="form.state" maxlength="2" />
            </div>
          </div>
          <div class="form-group">
            <label>Rua</label>
            <input v-model="form.street" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Número</label>
              <input v-model="form.number" />
            </div>
            <div class="form-group">
              <label>Complemento</label>
              <input v-model="form.complement" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Bairro</label>
              <input v-model="form.neighborhood" />
            </div>
            <div class="form-group">
              <label>Cidade</label>
              <input v-model="form.city" />
            </div>
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
 * @component ClientsView
 * @description View responsável pelo gerenciamento completo de clientes (CRUD).
 *
 * Exibe a lista de clientes do usuário autenticado em uma tabela e oferece um
 * modal para criação e edição. Inclui funcionalidade de preenchimento automático
 * de endereço via consulta de CEP ao backend, que por sua vez chama a API ViaCEP.
 *
 * O estado do modal é controlado pelo par `showModal`/`editing`: quando `editing`
 * é `null`, o modal está no modo de criação; quando possui um cliente, está em
 * modo de edição. Isso elimina a necessidade de componentes de modal separados.
 */
import { ref, onMounted } from 'vue'
import api from '@/services/api'

/**
 * Estrutura de dados de um cliente conforme retornado pela API.
 * Todos os campos, exceto `id` e `name`, são opcionais para permitir
 * cadastros parciais que podem ser completados posteriormente.
 */
interface Client {
  id: number
  name: string
  email?: string
  phone?: string
  /** CPF ou CNPJ sem formatação obrigatória. */
  document?: string
  zipcode?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  /** Sigla do estado (UF). */
  state?: string
}

/** Lista de clientes carregada da API. */
const clients = ref<Client[]>([])
/** Indica se a carga inicial de clientes está em andamento (exibe estado de carregamento). */
const loading = ref(true)
/** Controla a visibilidade do modal de criação/edição. */
const showModal = ref(false)
/** Referência ao cliente sendo editado. `null` quando o modal está em modo de criação. */
const editing = ref<Client | null>(null)
/** Indica se o formulário está sendo submetido (desabilita o botão para evitar duplo envio). */
const saving = ref(false)
/** Mensagem de erro do formulário, exibida acima dos botões do modal. */
const formError = ref('')
/** Indica se a consulta de CEP está em andamento (desabilita o botão "Buscar" do CEP). */
const cepLoading = ref(false)

/**
 * Fábrica de formulário vazio.
 * Utilizada como função (e não objeto literal) para garantir que cada abertura
 * do modal receba uma cópia independente do estado inicial, evitando referências
 * compartilhadas entre aberturas consecutivas.
 */
const defaultForm = () => ({
  name: '', email: '', phone: '', document: '',
  zipcode: '', street: '', number: '', complement: '',
  neighborhood: '', city: '', state: '',
})
const form = ref(defaultForm())

/**
 * Carrega (ou recarrega) a lista de clientes da API.
 *
 * Ativa o estado de `loading` antes da chamada e o desativa ao final,
 * independentemente do resultado. Erros não são tratados aqui pois o
 * interceptor global do Axios já lida com 401; outros erros são silenciados
 * (a tabela ficará vazia, o que é aceitável para a UX atual).
 */
async function load() {
  loading.value = true
  const { data } = await api.get('/clients')
  clients.value = data
  loading.value = false
}

/**
 * Abre o modal no modo de criação de novo cliente.
 * Reseta o formulário e limpa qualquer erro anterior antes de exibir o modal.
 */
function openCreate() {
  editing.value = null
  form.value = defaultForm()
  formError.value = ''
  showModal.value = true
}

/**
 * Abre o modal no modo de edição de um cliente existente.
 *
 * O spread `{ ...defaultForm(), ...c }` garante que todos os campos do formulário
 * tenham valores iniciais (strings vazias), mesmo que o cliente não possua todos
 * os campos preenchidos, evitando que inputs fiquem com `undefined` como valor.
 *
 * @param c - Objeto do cliente a ser editado.
 */
function openEdit(c: Client) {
  editing.value = c
  // defaultForm() fornece os valores padrão; c sobrescreve apenas os campos existentes
  form.value = { ...defaultForm(), ...c }
  formError.value = ''
  showModal.value = true
}

/**
 * Fecha o modal sem salvar alterações.
 * O estado do formulário é descartado ao fechar; na próxima abertura, `openCreate`
 * ou `openEdit` reinicializarão o formulário com os valores apropriados.
 */
function closeModal() {
  showModal.value = false
}

/**
 * Consulta o endereço correspondente ao CEP preenchido no formulário.
 *
 * Remove formatação do CEP antes de enviar e valida o tamanho mínimo de 8 dígitos
 * para evitar chamadas desnecessárias à API. Em caso de sucesso, preenche
 * automaticamente os campos de endereço do formulário.
 *
 * Erros (CEP não encontrado ou falha de rede) são silenciados propositalmente:
 * o usuário simplesmente não terá os campos preenchidos e poderá digitá-los manualmente.
 */
async function lookupCep() {
  const cep = form.value.zipcode?.replace(/\D/g, '')
  // Valida localmente para não consumir a API com CEPs incompletos
  if (!cep || cep.length !== 8) return
  cepLoading.value = true
  try {
    const { data } = await api.get(`/clients/cep/${cep}`)
    // Preenche os campos de endereço com os dados retornados pelo ViaCEP via backend
    form.value.street = data.street
    form.value.neighborhood = data.neighborhood
    form.value.city = data.city
    form.value.state = data.state
    form.value.complement = data.complement
    form.value.zipcode = data.zipcode
  } catch {
    // CEP não encontrado, mantém campos
    // O usuário pode preencher os campos manualmente sem mensagem de erro
  } finally {
    cepLoading.value = false
  }
}

/**
 * Salva o cliente (criação ou atualização) e atualiza a lista local.
 *
 * Em modo de edição: faz PUT e atualiza o item na posição correta da lista usando
 * `findIndex`, evitando recarregar todos os clientes da API (otimistic update parcial).
 *
 * Em modo de criação: faz POST e adiciona o novo cliente ao final da lista local,
 * mantendo a consistência sem recarregamento completo.
 *
 * O erro da API é tipado manualmente pois o Axios retorna `unknown` no catch
 * ao usar TypeScript estrito.
 */
async function save() {
  formError.value = ''
  saving.value = true
  try {
    if (editing.value) {
      // Modo de edição: atualiza o registro existente e reflete a mudança na lista local
      const { data } = await api.put(`/clients/${editing.value.id}`, form.value)
      const idx = clients.value.findIndex(c => c.id === editing.value!.id)
      clients.value[idx] = data
    } else {
      // Modo de criação: adiciona o novo cliente retornado pela API ao final da lista
      const { data } = await api.post('/clients', form.value)
      clients.value.push(data)
    }
    closeModal()
  } catch (e: unknown) {
    // Tipagem manual do erro do Axios para acessar a mensagem do backend com segurança
    const err = e as { response?: { data?: { error?: string } } }
    formError.value = err.response?.data?.error || 'Erro ao salvar'
  } finally {
    saving.value = false
  }
}

/**
 * Remove um cliente após confirmação do usuário.
 *
 * O aviso de confirmação menciona explicitamente que as tarefas vinculadas também
 * serão removidas, evitando perda acidental de dados. A remoção da lista local
 * é feita via `filter`, sem recarregar todos os clientes da API.
 *
 * @param id - ID do cliente a ser removido.
 */
async function removeClient(id: number) {
  if (!confirm('Excluir este cliente? As tarefas vinculadas também serão removidas.')) return
  await api.delete(`/clients/${id}`)
  // Remove o cliente da lista local para refletir imediatamente a deleção na UI
  clients.value = clients.value.filter(c => c.id !== id)
}

// Carrega os clientes assim que o componente é montado no DOM
onMounted(load)
</script>
