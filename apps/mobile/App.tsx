import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import RootNavigator from './src/navigation/RootNavigator'
import { useFCMToken } from './src/hooks/useFCMToken'
import { useAuthStore } from './src/store/authStore'
import { userAPI } from './src/services/api'

// Bump this string on every APK release — version change triggers a full fresh-install reset
const APP_BUILD = '1.0.1'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    const { error } = this.state
    if (error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 }}>
          <Text style={{ color: 'red', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            App Crashed
          </Text>
          <Text style={{ color: '#333', fontSize: 14 }}>
            {(error as any).message}
          </Text>
          <Text style={{ color: '#666', fontSize: 12, marginTop: 10 }}>
            {(error as any).stack}
          </Text>
        </ScrollView>
      )
    }
    return this.props.children
  }
}

function AppInner() {
  useFCMToken()
  const [ready, setReady] = useState(false)
  const clearDevToken  = useAuthStore((s) => s.clearDevToken)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const resetAll = useAuthStore((s) => s.resetAll)
  const logout   = useAuthStore((s) => s.logout)

  useEffect(() => {
    async function init() {
      // ── Fresh-install / new-build detection ──────────────────
      // Whenever APP_BUILD changes (new APK), wipe all state so the
      // user sees onboarding as if it's a brand-new install.
      try {
        const stored = await AsyncStorage.getItem('@sn_build')
        if (stored !== APP_BUILD) {
          resetAll()
          await AsyncStorage.setItem('@sn_build', APP_BUILD)
        }
      } catch { /* AsyncStorage unavailable — continue */ }

      clearDevToken()

      // ── Token validation ───────────────────────────────────────
      // If token is stale/invalid, silently log out.
      if (useAuthStore.getState().isAuthenticated) {
        userAPI.getProfile().catch((err) => {
          const status = err?.response?.status
          if (status === 401 || status === 403) logout()
        })
      }

      setReady(true)
    }
    init()
  }, [])

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D9488' }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    )
  }

  return <RootNavigator />
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <StatusBar style="dark" />
            <AppInner />
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  )
}
