import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native'
import { useAuth } from '../context/AuthContext'

export default function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
    } catch {
      Alert.alert('Erro', 'E-mail ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>H</Text>
        </View>
        <Text style={styles.title}>Hoomweb</Text>
        <Text style={styles.subtitle}>Sistema de Gestão de Clientes e Tarefas</Text>

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Entrar</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a56db',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  logoBox: {
    width: 52, height: 52,
    backgroundColor: '#1a56db',
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  title: { fontSize: 22, fontWeight: '800', color: '#1a56db', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6b7280', marginBottom: 24, textAlign: 'center' },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    marginBottom: 12,
  },
  btn: {
    backgroundColor: '#1a56db',
    borderRadius: 8,
    padding: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
