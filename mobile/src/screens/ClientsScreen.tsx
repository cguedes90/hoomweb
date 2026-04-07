import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native'
import api from '../services/api'

interface Client {
  id: number
  name: string
  email?: string
  phone?: string
  city?: string
  state?: string
}

export default function ClientsScreen() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/clients')
      setClients(data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

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
      contentContainerStyle={clients.length === 0 ? styles.emptyContainer : styles.listContent}
      data={clients}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>Nenhum cliente</Text>
          <Text style={styles.emptyText}>Cadastre clientes pelo sistema web.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            {item.email ? <Text style={styles.detail}>{item.email}</Text> : null}
            {item.phone ? <Text style={styles.detail}>{item.phone}</Text> : null}
            {item.city ? (
              <Text style={styles.location}>📍 {item.city}{item.state ? `/${item.state}` : ''}</Text>
            ) : null}
          </View>
        </View>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#dbeafe',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#1a56db', fontWeight: '700', fontSize: 18 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  detail: { fontSize: 13, color: '#6b7280', marginBottom: 1 },
  location: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
})
