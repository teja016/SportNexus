import React from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { Colors, FontSize, FontWeight } from '../constants/theme'
import { useLocalEnrollmentsStore } from '../store/localEnrollmentsStore'

import HomeScreen          from '../screens/main/HomeScreen'
import EnrollmentsScreen   from '../screens/main/EnrollmentsScreen'
import ProfileScreen       from '../screens/main/ProfileScreen'

const Tab = createBottomTabNavigator()

function Badge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <View style={styles.badge}>
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
        tabBarIcon: ({ focused, color }) => {
          const icons: Record<string, [string, string]> = {
            Discover:    ['compass',  'compass-outline'],
            Enrollments: ['calendar', 'calendar-outline'],
            Profile:     ['person',   'person-outline'],
          }
          const [activeIcon, inactiveIcon] = icons[route.name] ?? ['ellipse', 'ellipse-outline']
          return (
            <View style={styles.tabIconWrap}>
              {focused && <View style={styles.tabActivePill} />}
              <Ionicons
                name={(focused ? activeIcon : inactiveIcon) as any}
                size={focused ? 24 : 22}
                color={color}
              />
              {route.name === 'Enrollments' && (
                <Badge count={activeCount} />
              )}
            </View>
          )
        },
      })}
    >
      <Tab.Screen name="Discover"    component={HomeScreen} />
      <Tab.Screen name="Enrollments" component={EnrollmentsScreen} />
      <Tab.Screen name="Profile"     component={ProfileScreen} />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopColor: 'rgba(26,175,201,0.12)',
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    height: Platform.OS === 'ios' ? 88 : 66,
    elevation: 20,
    shadowColor: '#1AAFC9',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    marginTop: -2,
  },
  tabItem: { paddingTop: 2 },
  tabIconWrap: { alignItems: 'center', paddingTop: 4 },
  tabActivePill: {
    position: 'absolute', top: -6,
    width: 20, height: 3, borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  badge: {
    position: 'absolute', top: -4, right: -8,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.surface,
    paddingHorizontal: 2,
  },
  badgeText: {
    fontSize: 9, color: '#fff', fontWeight: FontWeight.extrabold,
  },
})
