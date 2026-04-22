import React from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { Colors, FontSize, FontWeight, BorderRadius } from '../constants/theme'
import { useLocalEnrollmentsStore } from '../store/localEnrollmentsStore'
import { useNotificationsStore } from '../store/notificationsStore'

import HomeScreen from '../screens/main/HomeScreen'
import NotificationsScreen from '../screens/main/NotificationsScreen'
import EnrollmentsScreen from '../screens/main/EnrollmentsScreen'
import ProfileScreen from '../screens/main/ProfileScreen'

const Tab = createBottomTabNavigator()

function EnrollmentsBadge({ count, color }: { count: number; color: string }) {
  if (count === 0) return null
  return (
    <View style={[styles.badge, { borderColor: Colors.surface }]}>
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  )
}

export default function MainTabNavigator() {
  const { enrollments } = useLocalEnrollmentsStore()
  const { notifications } = useNotificationsStore()
  const activeCount = enrollments.filter((e) => ['PENDING', 'CONFIRMED', 'ACTIVE'].includes(e.status)).length
  const unreadNotifs = notifications.filter((n) => !n.read).length

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Home:          ['home',          'home-outline'],
            Notifications: ['notifications', 'notifications-outline'],
            Enrollments:   ['calendar',      'calendar-outline'],
            Profile:       ['person',        'person-outline'],
          }
          const [activeIcon, inactiveIcon] = icons[route.name] ?? ['ellipse', 'ellipse-outline']
          return (
            <View>
              <Ionicons name={(focused ? activeIcon : inactiveIcon) as any} size={size} color={color} />
              {route.name === 'Enrollments' && (
                <EnrollmentsBadge count={activeCount} color={color} />
              )}
              {route.name === 'Notifications' && unreadNotifs > 0 && (
                <EnrollmentsBadge count={unreadNotifs} color={color} />
              )}
            </View>
          )
        },
      })}
    >
      <Tab.Screen name="Home"          component={HomeScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Enrollments"   component={EnrollmentsScreen} />
      <Tab.Screen name="Profile"       component={ProfileScreen} />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopColor: 'rgba(14,116,144,0.12)',
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    height: Platform.OS === 'ios' ? 88 : 66,
    elevation: 20,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    marginTop: -2,
  },
  tabItem: {
    paddingTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 2,
  },
  badgeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: FontWeight.extrabold,
  },
})
