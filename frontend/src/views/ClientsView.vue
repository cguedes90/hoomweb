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
              <input
                v-model="form.phone"
                @input="onPhoneInput"
                placeholder="(11) 99999-9999"
                maxlength="15"
                inputmode="numeric"
              />
            </div>
          </div>
          <div class="form-group">
            <label>CPF/CNPJ</label>
            <input
              v-model="form.document"
              @input="onDocumentInput"
              :placeholder="documentPlaceholder"
              :maxlength="documentMaxLength"
              inputmode="numeric"
              :class="{ 'input-error': documentError }"
            />
            <span v-if="documentError" class="field-error">{{ documentError }}</span>
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
            <button type="submit" class="btn btn-primary" :disabled="saving || !!documentError">
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
 * Inclui máscaras automáticas de formatação para telefone e CPF/CNPJ,
 * com validação de dígitos verificadores em tempo real.
 */
import { ref, computed, onMounted } from 'vue'
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

// ─── Máscara de Telefone ──────────────────────────────────────────────────────

/**
 * Aplica máscara de telefone ao digitar.
 * Suporta celular (11 dígitos): (11) 99999-9999
 * e fixo (10 dígitos): (11) 3333-3333
 */
function onPhoneInput() {
  const digits = form.value.phone.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    // Telefone fixo: (XX) XXXX-XXXX
    form.value.phone = digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  } else {
    // Celular: (XX) XXXXX-XXXX
    form.value.phone = digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }
}

// ─── Máscara e Validação de CPF/CNPJ ─────────────────────────────────────────

/**
 * Placeholder e maxlength dinâmicos baseados na quantidade de dígitos digitados.
 * Até 11 dígitos numéricos → CPF; 12 ou mais → CNPJ.
 */
const documentPlaceholder = computed(() => {
  const digits = form.value.document.replace(/\D/g, '')
  return digits.length <= 11 ? '000.000.000-00' : '00.000.000/0000-00'
})

const documentMaxLength = computed(() => {
  const digits = form.value.document.replace(/\D/g, '')
  return digits.length <= 11 ? 14 : 18 // CPF formatado tem 14 chars, CNPJ tem 18
})

/**
 * Aplica máscara de CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00)
 * dinamicamente conforme o usuário digita.
 */
function onDocumentInput() {
  const digits = form.value.document.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 11) {
    form.value.document = digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2')
  } else {
    form.value.document = digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/\/(\d{4})(\d)/, '/$1-$2')
  }
}

/**
 * Valida CPF usando o algoritmo oficial dos dígitos verificadores.
 */
function validateCpf(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += +d[i] * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== +d[9]) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += +d[i] * (11 - i)
  r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === +d[10]
}

/**
 * Valida CNPJ usando o algoritmo oficial dos dígitos verificadores.
 */
function validateCnpj(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, '')
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false
  const calc = (d: string, n: number) => {
    let sum = 0
    let pos = n - 7
    for (let i = n; i >= 1; i--) {
      sum += +d[n - i] * pos--
      if (pos < 2) pos = 9
    }
    const r = sum % 11
    return r < 2 ? 0 : 11 - r
  }
  return calc(d, 12) === +d[12] && calc(d, 13) === +d[13]
}

/**
 * Mensagem de erro de validação do documento.
 * Vazio quando o campo está em branco ou é válido.
 */
const documentError = computed(() => {
  const digits = form.value.document.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length <= 11 && digits.length === 11) {
    return validateCpf(digits) ? '' : 'CPF inválido'
  }
  if (digits.length === 14) {
    return validateCnpj(digits) ? '' : 'CNPJ inválido'
  }
  // Digitação incompleta: sem erro ainda
  return ''
})

// ─── CRUD ─────────────────────────────────────────────────────────────────────

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
    // CEP não encontrado — usuário preenche manualmente
  } finally {
    cepLoading.value = false
  }
}

async function save() {
  if (documentError.value) return
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

<style scoped>
.input-error {
  border-color: #dc2626 !important;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, .15) !important;
}
.field-error {
  display: block;
  color: #dc2626;
  font-size: .78rem;
  margin-top: .25rem;
}
</style>
