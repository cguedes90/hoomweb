import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native'
import api from '../services/api'

interface Task {
  id: number
  title: string
  description?: string
  status: string
  due_date?: string
  client_name: string
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  done: 'Concluído',
  cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:     { bg: '#fef3c7', text: '#92400e' },
  in_progress: { bg: '#dbeafe', text: '#1e40af' },
  done:        { bg: '#d1fae5', text: '#065f46' },
  cancelled:   { bg: '#f3f4f6', text: '#6b7280' },
}

const NEXT_STATUS: Record<string, string | null> = {
  pending: 'in_progress',
  in_progress: 'done',
  done: null,
  cancelled: null,
}

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updating, setUpdating] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/tasks')
      setTasks(data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function advanceStatus(task: Task) {
    const next = NEXT_STATUS[task.status]
    if (!next) return
    const label = STATUS_LABELS[next]
    Alert.alert(
      'Atualizar status',
      `Mover "${task.title}" para "${label}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setUpdating(task.id)
            try {
              const { data } = await api.put(`/tasks/${task.id}`, { status: next })
              setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...data } : t))
            } catch {
              Alert.alert('Erro', 'Não foi possível atualizar.')
            } finally {
              setUpdating(null)
            }
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a56db" />
      </View>
    )
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={tasks.length === 0 ? styles.emptyContainer : styles.listContent}
      data={tasks}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>Nenhuma tarefa</Text>
          <Text style={styles.emptyText}>Crie tarefas pelo sistema web.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const colors = STATUS_COLORS[item.status] || STATUS_COLORS.cancelled
        const next = NEXT_STATUS[item.status]
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                <Text style={[styles.badgeText, { color: colors.text }]}>
                  {STATUS_LABELS[item.status] || item.status}
                </Text>
              </View>
            </View>

            {item.description ? (
              <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
            ) : null}

            <View style={styles.meta}>
              <Text style={styles.client}>👤 {item.client_name}</Text>
              {item.due_date ? (
                <Text style={styles.dueDate}>
                  📅 {new Date(item.due_date).toLocaleDateString('pt-BR')}
                </Text>
              ) : null}
            </View>

            {next && (
              <TouchableOpacity
                style={[styles.advanceBtn, updating === item.id && styles.advanceBtnDisabled]}
                onPress={() => advanceStatus(item)}
                disabled={updating === item.id}
              >
                {updating === item.id
                  ? <ActivityIndicator size="small" color="#1a56db" />
                  : <Text style={styles.advanceBtnText}>→ Mover para {STATUS_LABELS[next]}</Text>
                }
              </TouchableOpacity>
            )}
          </View>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f3f4f6' },
  listContent: { padding: 16, gap: 10 },
  emptyContainer: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  title: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  description: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  meta: { flexDirection: 'row', gap: 12 },
  client: { fontSize: 12, color: '#6b7280' },
  dueDate: { fontSize: 12, color: '#6b7280' },
  advanceBtn: {
    borderWidth: 1, borderColor: '#1a56db',
    borderRadius: 8, padding: 8,
    alignItems: 'center', marginTop: 4,
  },
  advanceBtnDisabled: { opacity: 0.5 },
  advanceBtnText: { color: '#1a56db', fontSize: 13, fontWeight: '600' },
})
