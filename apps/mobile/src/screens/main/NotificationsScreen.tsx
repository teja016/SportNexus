import React, { useRef } from 'react'
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Animated, Alert,
} from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useNotificationsStore, AppNotification } from '../../store/notificationsStore'
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../../constants/theme'

const TYPE_CONFIG: Record<AppNotification['type'], { icon: string; iconColor: string; iconBg: string }> = {
  ENROLLED:        { icon: 'checkmark-circle',   iconColor: Colors.primary,   iconBg: Colors.tealXLight },
  PAYMENT_PENDING: { icon: 'time-outline',        iconColor: '#D97706',        iconBg: '#FEF3C7' },
  TRANSPORT:       { icon: 'bus-outline',         iconColor: Colors.accent,    iconBg: '#D1FAE5' },
  STARTING_SOON:   { icon: 'flag-outline',        iconColor: Colors.primary,   iconBg: Colors.tealLight },
  GENERAL:         { icon: 'notifications-outline', iconColor: Colors.purple,  iconBg: '#EDE9FE' },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (days > 0)  return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0)  return `${mins}m ago`
  return 'Just now'
}

function NotifCard({ item, navigation, onDelete }: {
  item: AppNotification
  navigation: any
  onDelete: (id: string) => void
}) {
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.GENERAL
  const swipeRef = useRef<Swipeable>(null)

  function handlePress() {
    if (item.enrollmentId) {
      navigation.navigate('EnrollmentDetail', { enrollmentId: item.enrollmentId })
    }
  }

  function handleDelete() {
    swipeRef.current?.close()
    onDelete(item.id)
  }

  function renderRightActions(_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) {
    const scale = dragX.interpolate({ inputRange: [-80, 0], outputRange: [1, 0.7], extrapolate: 'clamp' })
    return (
      <TouchableOpacity style={styles.deleteAction} onPress={handleDelete} activeOpacity={0.85}>
        <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text style={styles.deleteActionText}>Delete</Text>
        </Animated.View>
      </TouchableOpacity>
    )
  }

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false} friction={2}>
      <TouchableOpacity
        style={[styles.card, !item.read && styles.cardUnread]}
        onPress={handlePress}
        activeOpacity={item.enrollmentId ? 0.8 : 1}
      >
        <View style={[styles.iconWrap, { backgroundColor: config.iconBg }]}>
          <Ionicons name={config.icon as any} size={22} color={config.iconColor} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.cardText} numberOfLines={3}>{item.body}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
            {item.enrollmentId && (
              <View style={styles.tapHint}>
                <Ionicons name="chevron-forward" size={12} color={Colors.primary} />
                <Text style={styles.tapHintText}>View details</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.swipeHint}>
          <Ionicons name="chevron-back-outline" size={12} color={Colors.textMuted} />
          <Ionicons name="chevron-back-outline" size={12} color={Colors.border} />
        </View>
      </TouchableOpacity>
    </Swipeable>
  )
}

export default function NotificationsScreen({ navigation }: any) {
  const { notifications, removeNotification, markAllRead, clearAll } = useNotificationsStore()
  const unreadCount = notifications.filter((n) => !n.read).length

  function handleClearAll() {
    Alert.alert('Clear All', 'Remove all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: clearAll },
    ])
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D9488', '#1E3A5F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSub}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.headerBtn} onPress={markAllRead}>
              <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity style={styles.headerBtn} onPress={handleClearAll}>
              <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <NotifCard item={item} navigation={navigation} onDelete={removeNotification} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="notifications-outline" size={40} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>
              Enrollment confirmations, payment updates, and session reminders will appear here.
            </Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.background },
  header:        { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerTitle:   { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: '#fff', letterSpacing: -0.5 },
  headerSub:     { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.65)', marginTop: 3 },
  headerActions: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  headerBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  deleteAction:     { width: 76, backgroundColor: Colors.danger, justifyContent: 'center', alignItems: 'center', borderRadius: BorderRadius.lg, marginLeft: 8 },
  deleteActionText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold, marginTop: 4 },
  swipeHint:        { justifyContent: 'center', alignItems: 'center', paddingLeft: 4, gap: -2 },
  card:          { flexDirection: 'row', gap: 12, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 14, ...Shadow.sm, alignItems: 'flex-start' },
  cardUnread:    { borderLeftWidth: 3, borderLeftColor: Colors.primary },
  iconWrap:      { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  cardBody:      { flex: 1, gap: 3 },
  cardTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'space-between' },
  cardTitle:     { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, flex: 1 },
  unreadDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, flexShrink: 0 },
  cardText:      { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  cardMeta:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  cardTime:      { fontSize: FontSize.xs, color: Colors.textMuted },
  tapHint:       { flexDirection: 'row', alignItems: 'center', gap: 2 },
  tapHintText:   { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },
  deleteBtn:     { padding: 4, marginTop: 2 },

  empty:         { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle:    { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
})
