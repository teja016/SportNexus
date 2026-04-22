import React, { useEffect } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as Notifications from 'expo-notifications'
import RootNavigator from './src/navigation/RootNavigator'
import { useFCMToken } from './src/hooks/useFCMToken'
import { useAuthStore } from './src/store/authStore'

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
  const clearDevToken = useAuthStore((s) => s.clearDevToken)

  useEffect(() => {
    clearDevToken()
  }, [])

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
