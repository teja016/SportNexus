import React from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { Colors, FontSize, FontWeight, BorderRadius } from '../constants/theme'
import { useLocalEnrollmentsStore } from '../store/localEnrollmentsStore'

import HomeScreen from '../screens/main/HomeScreen'
import SearchScreen from '../screens/main/SearchScreen'
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
  const activeCount = enrollments.filter((e) => ['PENDING', 'CONFIRMED', 'ACTIVE'].includes(e.status)).length

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
            Home:        ['home',     'home-outline'],
            Search:      ['search',   'search-outline'],
            Enrollments: ['calendar', 'calendar-outline'],
            Profile:     ['person',   'person-outline'],
          }
          const [activeIcon, inactiveIcon] = icons[route.name] ?? ['ellipse', 'ellipse-outline']
          return (
            <View>
              <Ionicons name={(focused ? activeIcon : inactiveIcon) as any} size={size} color={color} />
              {route.name === 'Enrollments' && (
                <EnrollmentsBadge count={activeCount} color={color} />
              )}
            </View>
          )
        },
      })}
    >
      <Tab.Screen name="Home"        component={HomeScreen} />
      <Tab.Screen name="Search"      component={SearchScreen} />
      <Tab.Screen name="Enrollments" component={EnrollmentsScreen} />
      <Tab.Screen name="Profile"     component={ProfileScreen} />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.borderLight,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 6,
    paddingTop: 6,
    height: Platform.OS === 'ios' ? 84 : 62,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
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
