import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useAuth } from '../context/AuthContext'
import LoginScreen from '../screens/LoginScreen'
import ClientsScreen from '../screens/ClientsScreen'
import TasksScreen from '../screens/TasksScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function TabIcon({ label, active }: { label: string; active: boolean }) {
  const icons: Record<string, string> = { Clientes: '👥', Tarefas: '✅' }
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>{icons[label]}</Text>
    </View>
  )
}

function HomeTabs() {
  const { user, logout } = useAuth()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} active={focused} />,
        tabBarActiveTintColor: '#1a56db',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { paddingBottom: 4 },
        headerStyle: { backgroundColor: '#1a56db' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        headerRight: () => (
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen name="Clientes" component={ClientsScreen} />
      <Tab.Screen name="Tarefas" component={TasksScreen} />
    </Tab.Navigator>
  )
}

export default function AppNavigator() {
  const { token, loading } = useAuth()

  if (loading) {
    return (
      <View style={styles.splash}>
        <View style={styles.splashLogo}>
          <Text style={styles.splashLogoText}>H</Text>
        </View>
        <ActivityIndicator color="#1a56db" style={{ marginTop: 24 }} />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token
          ? <Stack.Screen name="Home" component={HomeTabs} />
          : <Stack.Screen name="Login" component={LoginScreen} />
        }
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  splash: {
    flex: 1, backgroundColor: '#f3f4f6',
    alignItems: 'center', justifyContent: 'center',
  },
  splashLogo: {
    width: 64, height: 64, backgroundColor: '#1a56db', borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  splashLogoText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  logoutBtn: { marginRight: 16, paddingVertical: 4, paddingHorizontal: 8 },
  logoutText: { color: '#fff', fontSize: 14, fontWeight: '600', opacity: 0.9 },
})
