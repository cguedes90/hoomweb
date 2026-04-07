import React, { createContext, useContext, useState, useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'
import api from '../services/api'

interface User { id: number; name: string; email: string; role: string }

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    SecureStore.getItemAsync('token').then(async (t) => {
      if (t) {
        setToken(t)
        try {
          const { data } = await api.get('/auth/me')
          setUser(data)
        } catch {
          await SecureStore.deleteItemAsync('token')
        }
      }
      setLoading(false)
    })
  }, [])

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password })
    await SecureStore.setItemAsync('token', data.token)
    setToken(data.token)
    setUser(data.user)
  }

  async function logout() {
    await SecureStore.deleteItemAsync('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
