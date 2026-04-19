import { useEffect } from 'react'
import { Platform } from 'react-native'
import { userAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'

// expo-notifications is not supported on web
if (Platform.OS !== 'web') {
  const Notifications = require('expo-notifications')
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  })
}

export function useFCMToken() {
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated || Platform.OS === 'web') return

    async function registerForPushNotifications() {
      try {
        const Notifications = require('expo-notifications')
        const { status: existingStatus } = await Notifications.getPermissionsAsync()
        let finalStatus = existingStatus

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync()
          finalStatus = status
        }

        if (finalStatus !== 'granted') return

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'SportNexus',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
          })
        }

        const token = (await Notifications.getExpoPushTokenAsync()).data
        await userAPI.updateProfile({ fcmToken: token })
      } catch (err) {
        console.warn('[FCM] Failed to register push token:', err)
      }
    }

    registerForPushNotifications()
  }, [isAuthenticated])
}
