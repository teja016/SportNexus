import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Platform, Image } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { userAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { useLocalEnrollmentsStore } from '../../store/localEnrollmentsStore'
import { useFavoritesStore } from '../../store/favoritesStore'
import { Colors, FontSize, FontWeight, BorderRadius, Shadow, SportColors } from '../../constants/theme'
import { SPORT_ICONS } from '@sportnexus/utils'

const MENU_SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: 'person-outline' as const,        label: 'Edit Profile',      sub: 'Update your details',     screen: 'EditProfile', enabled: true },
      { icon: 'location-outline' as const,      label: 'Saved Addresses',   sub: 'Pickup & home locations', screen: null,          enabled: false },
      { icon: 'notifications-outline' as const, label: 'Notifications',     sub: 'Push & email alerts',     screen: null,          enabled: false },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle-outline' as const,   label: 'Help & FAQ',      sub: 'Common questions',  screen: null, enabled: false },
      { icon: 'chatbubble-outline' as const,    label: 'Contact Support', sub: 'Chat with our team', screen: null, enabled: false },
      { icon: 'document-text-outline' as const, label: 'Terms & Privacy', sub: 'Legal information',  screen: null, enabled: false },
    ],
  },
]

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuthStore()
  const { enrollments: localEnrollments } = useLocalEnrollmentsStore()
  const { favorites, toggleFavorite } = useFavoritesStore()
  const [showLogout, setShowLogout] = useState(false)

  const { data } = useQuery({
    queryKey: ['user-me'],
    queryFn:  () => userAPI.getProfile(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const { data: enrollmentsData } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn:  () => {
      const { enrollmentAPI } = require('../../services/api')
      return enrollmentAPI.getMyEnrollments()
    },
    staleTime: 60 * 1000,
    retry: 1,
  })

  const profile  = data ?? user
  const initials = profile?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'

  const allEnrollments: any[] = enrollmentsData ?? localEnrollments
  const total    = allEnrollments.length || localEnrollments.length
  const active   = allEnrollments.filter((e: any) => ['PENDING', 'CONFIRMED', 'ACTIVE'].includes(e.status)).length || localEnrollments.filter((e) => ['PENDING', 'CONFIRMED', 'ACTIVE'].includes(e.status)).length
  const academyIds = new Set([
    ...allEnrollments.map((e: any) => e.slot?.program?.academy?.id ?? e.slot?.program?.academyId).filter(Boolean),
    ...localEnrollments.map((e) => (e as any).slot?.program?.academyId).filter(Boolean),
  ])
  const academies = academyIds.size

  function confirmLogout() {
    if (Platform.OS !== 'web') {
      const { Alert } = require('react-native')
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ])
    } else {
      setShowLogout(true)
    }
  }

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* ── Compact gradient header strip ─────────────────── */}
        <LinearGradient
          colors={['#0D9488', '#1E3A5F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            {/* Avatar */}
            <TouchableOpacity style={styles.avatarWrap} onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.85}>
              {profile?.profilePhoto ? (
                <Image source={{ uri: profile.profilePhoto }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              )}
              <View style={styles.cameraBtn}>
                <Ionicons name="camera-outline" size={11} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* Name + contact */}
            <View style={styles.headerInfo}>
              <Text style={styles.headerName} numberOfLines={1}>{profile?.name ?? '—'}</Text>
              <Text style={styles.headerContact}>{profile?.phone ?? profile?.email ?? '—'}</Text>
              {profile?.role && profile.role !== 'USER' && (
                <View style={styles.roleBadge}>
                  <Ionicons name="shield-checkmark" size={10} color="#fff" />
                  <Text style={styles.roleText}>{profile.role.replace('_', ' ')}</Text>
                </View>
              )}
            </View>

            {/* Edit shortcut */}
            <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
              <Ionicons name="pencil-outline" size={16} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ── Stats row card ────────────────────────────────── */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{total}</Text>
            <Text style={styles.statLabel}>Enrollments</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.accent }]}>{active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.purple }]}>{academies}</Text>
            <Text style={styles.statLabel}>Academies</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{favorites.length}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>

        {/* ── Menu Sections ────────────────────────────────── */}
        <View style={styles.menuArea}>
          {MENU_SECTIONS.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.menuCard}>
                {section.items.map((item, idx) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.menuItem, idx < section.items.length - 1 && styles.menuItemBorder]}
                    onPress={() => item.screen ? navigation.navigate(item.screen) : null}
                    activeOpacity={item.enabled ? 0.7 : 1}
                  >
                    <View style={[styles.menuIcon, !item.enabled && styles.menuIconDim]}>
                      <Ionicons name={item.icon} size={18} color={item.enabled ? Colors.primary : Colors.textMuted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.menuLabel, !item.enabled && styles.menuLabelDim]}>{item.label}</Text>
                      <Text style={styles.menuSub}>{item.sub}</Text>
                    </View>
                    {!item.enabled && (
                      <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>Soon</Text>
                      </View>
                    )}
                    <Ionicons
                      name="chevron-forward"
                      size={15}
                      color={item.enabled ? Colors.textMuted : Colors.border}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* ── Saved Academies ──────────────────────────────── */}
          {favorites.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Saved Academies</Text>
              <View style={styles.menuCard}>
                {favorites.slice(0, 3).map((academy, idx) => {
                  const sport = academy.programs?.[0]?.sportType ?? ''
                  const sportColor = SportColors[sport] ?? Colors.primary
                  return (
                    <TouchableOpacity
                      key={academy.id}
                      style={[styles.menuItem, idx < Math.min(favorites.length, 3) - 1 && styles.menuItemBorder]}
                      onPress={() => navigation.navigate('AcademyDetail', { academy })}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.menuIcon, { backgroundColor: sportColor + '15' }]}>
                        <Text style={{ fontSize: 16 }}>{SPORT_ICONS[sport] ?? '🏅'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.menuLabel} numberOfLines={1}>{academy.name}</Text>
                        <Text style={styles.menuSub}>{sport} · {academy.city}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => toggleFavorite(academy)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="heart" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  )
                })}
                {favorites.length > 3 && (
                  <TouchableOpacity
                    style={[styles.menuItem, { justifyContent: 'center' }]}
                    onPress={() => navigation.navigate('Search')}
                  >
                    <Text style={styles.moreText}>+{favorites.length - 3} more saved academies</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ── Sign Out ─────────────────────────────────────── */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout} activeOpacity={0.8}>
              <View style={styles.logoutIcon}>
                <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
              </View>
              <Text style={styles.logoutText}>Sign Out</Text>
              <Ionicons name="chevron-forward" size={15} color={Colors.danger} />
            </TouchableOpacity>
          </View>

          <Text style={styles.version}>SportNexus v2.0.0</Text>
        </View>
      </ScrollView>

      {/* ── Web confirm dialog ───────────────────────────── */}
      {showLogout && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowLogout(false)}>
          <View style={styles.overlay}>
            <View style={styles.dialog}>
              <View style={styles.dialogIcon}>
                <Ionicons name="log-out-outline" size={28} color={Colors.danger} />
              </View>
              <Text style={styles.dialogTitle}>Sign Out?</Text>
              <Text style={styles.dialogMsg}>You'll need to sign in again to access your enrollments.</Text>
              <View style={styles.dialogBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowLogout(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmLogoutBtn} onPress={() => { setShowLogout(false); logout() }}>
                  <Text style={styles.confirmLogoutText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  /* ── Compact Header ── */
  header: { paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },

  avatarWrap:  { position: 'relative' },
  avatar:      {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.25)',
  },
  avatarImg:   { width: 68, height: 68, borderRadius: 34, borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.25)' },
  avatarText:  { fontSize: 24, fontWeight: FontWeight.extrabold, color: '#fff' },
  cameraBtn: {
    position: 'absolute', bottom: -2, right: -4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },

  headerInfo:   { flex: 1 },
  headerName:   { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: '#fff', letterSpacing: -0.3 },
  headerContact:{ fontSize: FontSize.sm, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full,
  },
  roleText:   { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5 },

  editBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  /* ── Stats Card ── */
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: -1,
    borderRadius: BorderRadius.xl,
    ...Shadow.sm,
    paddingVertical: 4,
  },
  statItem:    { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statValue:   { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  statLabel:   { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, fontWeight: FontWeight.medium },
  statDivider: { width: 1, backgroundColor: Colors.borderLight, marginVertical: 10 },

  /* ── Menu ── */
  menuArea:      { paddingHorizontal: 16, marginTop: 20 },
  section:       { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    paddingLeft: 4,
  },
  menuCard:       { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadow.sm },
  menuItem:       { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  menuIcon:       { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.tealXLight, alignItems: 'center', justifyContent: 'center' },
  menuIconDim:    { backgroundColor: Colors.borderLight },
  menuLabel:      { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  menuLabelDim:   { color: Colors.textMuted },
  menuSub:        { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },

  comingSoonBadge: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: BorderRadius.full, marginRight: 4,
  },
  comingSoonText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold },

  moreText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },

  /* ── Logout ── */
  logoutBtn:  {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FEF2F2', borderRadius: BorderRadius.xl, padding: 16,
    borderWidth: 1, borderColor: '#FECACA',
  },
  logoutIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  logoutText: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.danger },

  version: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 8, marginBottom: 4 },

  /* ── Web Logout Dialog ── */
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog:   { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: 24, width: '100%', maxWidth: 320, alignItems: 'center', gap: 8, ...Shadow.md },
  dialogIcon:  { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  dialogTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  dialogMsg:   { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  dialogBtns:  { flexDirection: 'row', gap: 10, marginTop: 8, width: '100%' },
  cancelBtn:   { flex: 1, paddingVertical: 13, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  cancelBtnText:      { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  confirmLogoutBtn:   { flex: 1, paddingVertical: 13, borderRadius: BorderRadius.lg, backgroundColor: Colors.danger, alignItems: 'center' },
  confirmLogoutText:  { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#fff' },
})
