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
import { ref, onMounted } from 'vue'
import api from '@/services/api'

interface Client {
  id: number
  name: string
  email?: string
  phone?: string
  document?: string
  zipcode?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
}

const clients = ref<Client[]>([])
const loading = ref(true)
const showModal = ref(false)
const editing = ref<Client | null>(null)
const saving = ref(false)
const formError = ref('')
const cepLoading = ref(false)

const defaultForm = () => ({
  name: '', email: '', phone: '', document: '',
  zipcode: '', street: '', number: '', complement: '',
  neighborhood: '', city: '', state: '',
})
const form = ref(defaultForm())

async function load() {
  loading.value = true
  const { data } = await api.get('/clients')
  clients.value = data
  loading.value = false
}

function openCreate() {
  editing.value = null
  form.value = defaultForm()
  formError.value = ''
  showModal.value = true
}

function openEdit(c: Client) {
  editing.value = c
  form.value = { ...defaultForm(), ...c }
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function lookupCep() {
  const cep = form.value.zipcode?.replace(/\D/g, '')
  if (!cep || cep.length !== 8) return
  cepLoading.value = true
  try {
    const { data } = await api.get(`/clients/cep/${cep}`)
    form.value.street = data.street
    form.value.neighborhood = data.neighborhood
    form.value.city = data.city
    form.value.state = data.state
    form.value.complement = data.complement
    form.value.zipcode = data.zipcode
  } catch {
    // CEP não encontrado, mantém campos
  } finally {
    cepLoading.value = false
  }
}

async function save() {
  formError.value = ''
  saving.value = true
  try {
    if (editing.value) {
      const { data } = await api.put(`/clients/${editing.value.id}`, form.value)
      const idx = clients.value.findIndex(c => c.id === editing.value!.id)
      clients.value[idx] = data
    } else {
      const { data } = await api.post('/clients', form.value)
      clients.value.push(data)
    }
    closeModal()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    formError.value = err.response?.data?.error || 'Erro ao salvar'
  } finally {
    saving.value = false
  }
}

async function removeClient(id: number) {
  if (!confirm('Excluir este cliente? As tarefas vinculadas também serão removidas.')) return
  await api.delete(`/clients/${id}`)
  clients.value = clients.value.filter(c => c.id !== id)
}

onMounted(load)
</script>
