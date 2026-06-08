import React, { useState, useCallback, useMemo } from 'react'
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  RefreshControl, Image, StyleSheet, Dimensions,
  Modal, TextInput, ActivityIndicator, Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MotiView } from 'moti'
import * as Location from 'expo-location'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { academyAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { useFavoritesStore } from '../../store/favoritesStore'
import { useLocalEnrollmentsStore } from '../../store/localEnrollmentsStore'
import { SPORT_ICONS, SPORT_TYPES } from '@sportnexus/utils'
import { Academy } from '@sportnexus/types'
import { Colors, FontSize, FontWeight, BorderRadius, Shadow, SportColors } from '../../constants/theme'
import { SkeletonFeaturedCard, SkeletonAcademyRow } from '../../components/SkeletonCard'

const { width } = Dimensions.get('window')
const CARD_WIDTH = width - 48

// ─── Discipline Card ─────────────────────────────────────────────────────────
const DisciplineCard = React.memo(function DisciplineCard({
  sport, count, active, onPress,
}: { sport: string; count: number; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.discCard, active && styles.discCardActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.discIconWrap, active && styles.discIconWrapActive]}>
        <Text style={styles.discEmoji}>{SPORT_ICONS[sport] ?? '🏅'}</Text>
      </View>
      <Text style={[styles.discName, active && styles.discNameActive]} numberOfLines={1}>{sport}</Text>
      <Text style={[styles.discCount, active && styles.discCountActive]}>{count} Academies</Text>
    </TouchableOpacity>
  )
})

// ─── Featured Card ───────────────────────────────────────────────────────────
const FeaturedCard = React.memo(function FeaturedCard({ academy, onPress, onFavorite, isFav }: {
  academy: Academy; onPress: () => void; onFavorite: () => void; isFav: boolean
}) {
  const photo     = academy.photos?.[0]?.url
  const sport     = academy.programs?.[0]?.sportType ?? ''
  const sportColor = SportColors[sport] ?? Colors.primary
  const minFee    = useMemo(
    () => academy.programs?.length ? Math.min(...academy.programs.map((p: any) => p.feeMonthly)) : 0,
    [academy.programs]
  )

  return (
    <TouchableOpacity style={[styles.featCard, { width: CARD_WIDTH }]} onPress={onPress} activeOpacity={0.92}>
      {photo
        ? <Image source={{ uri: photo }} style={styles.featImg} resizeMode="cover" />
        : <View style={[styles.featImg, { backgroundColor: sportColor + '25', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 56 }}>{SPORT_ICONS[sport] ?? '🏅'}</Text>
          </View>
      }
      {/* dark overlay */}
      <View style={styles.featOverlay} />

      {/* Sport badge */}
      <View style={[styles.featSportBadge, { backgroundColor: sportColor }]}>
        <Text style={styles.featSportEmoji}>{SPORT_ICONS[sport] ?? '🏅'}</Text>
        <Text style={styles.featSportText}>{sport}</Text>
      </View>

      {/* Rating */}
      <View style={styles.featRating}>
        <Ionicons name="star" size={11} color="#FBBF24" />
        <Text style={styles.featRatingText}>{academy.rating}</Text>
      </View>

      {/* Fav */}
      <TouchableOpacity style={styles.favBtn} onPress={onFavorite} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={18} color={isFav ? '#EF4444' : '#fff'} />
      </TouchableOpacity>

      {/* Bottom info */}
      <View style={styles.featContent}>
        {academy.transportAvailable && (
          <View style={styles.transportPill}>
            <Ionicons name="bus-outline" size={11} color="#fff" />
            <Text style={styles.transportPillText}>Transport</Text>
          </View>
        )}
        <Text style={styles.featName} numberOfLines={1}>{academy.name}</Text>
        <View style={styles.featMeta}>
          <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.7)" />
          <Text style={styles.featMetaText} numberOfLines={1}>
            {academy.distance !== undefined ? `${academy.distance} km away` : academy.city}
          </Text>
          {minFee > 0 && <Text style={styles.featFee}>from ₹{minFee}/mo</Text>}
        </View>
      </View>
    </TouchableOpacity>
  )
})

// ─── Nearby Center Card ──────────────────────────────────────────────────────
const NearbyCenterCard = React.memo(function NearbyCenterCard({
  academy, onPress,
}: { academy: Academy; onPress: () => void }) {
  const photo      = academy.photos?.[0]?.url
  const sport      = academy.programs?.[0]?.sportType ?? ''
  const sportColor = SportColors[sport] ?? Colors.primary
  const sports     = useMemo(
    () => [...new Set((academy.programs ?? []).map((p: any) => p.sportType))].slice(0, 2),
    [academy.programs]
  )

  return (
    <View style={styles.nearCard}>
      {/* Image */}
      <View style={styles.nearImgWrap}>
        {photo
          ? <Image source={{ uri: photo }} style={styles.nearImg} resizeMode="cover" />
          : <View style={[styles.nearImg, { backgroundColor: sportColor + '20', alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: 36 }}>{SPORT_ICONS[sport] ?? '🏅'}</Text>
            </View>
        }
      </View>

      {/* Info */}
      <TouchableOpacity style={styles.nearInfo} onPress={onPress} activeOpacity={0.88}>
        <View style={styles.nearInfoTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.nearName} numberOfLines={1}>{academy.name}</Text>
            <View style={styles.nearDistRow}>
              <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.nearDist}>
                {academy.distance !== undefined ? `${academy.distance} miles away` : academy.city}
              </Text>
            </View>
          </View>
          {academy.rating > 0 && (
            <View style={styles.nearRating}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.nearRatingText}>{academy.rating}</Text>
            </View>
          )}
        </View>

        {/* Tags */}
        <View style={styles.nearTags}>
          {sports.map((s) => (
            <View key={s} style={styles.nearTag}>
              <Text style={styles.nearTagText}>{String(s).toUpperCase()}</Text>
            </View>
          ))}
          {academy.isVerified && (
            <View style={[styles.nearTag, styles.nearTagSafety]}>
              <Text style={[styles.nearTagText, styles.nearTagSafetyText]}>SAFETY+</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* + button */}
      <TouchableOpacity style={styles.plusBtn} onPress={onPress} activeOpacity={0.85}>
        <Ionicons name="add" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  )
})

// ─── Location Picker Modal ────────────────────────────────────────────────────
function LocationPickerModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { setLocation } = useAuthStore()
  const [manual, setManual]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGPS() {
    setLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to find academies near you.')
        return
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const [geo] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
      const address = [geo.name, geo.district, geo.city].filter(Boolean).join(', ') || 'Current Location'
      setLocation(loc.coords.latitude, loc.coords.longitude, address)
      onClose()
    } catch {
      Alert.alert('Error', 'Could not get your location. Please try entering it manually.')
    } finally {
      setLoading(false)
    }
  }

  function handleManual() {
    if (!manual.trim()) { Alert.alert('Please enter your area'); return }
    setLocation(17.385044, 78.486671, manual.trim())
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={locStyles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={locStyles.sheet}>
        <View style={locStyles.handle} />
        <Text style={locStyles.title}>Change Location</Text>
        <Text style={locStyles.sub}>Update your location to find academies near you</Text>

        <TouchableOpacity style={locStyles.gpsBtn} onPress={handleGPS} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <><Ionicons name="navigate" size={18} color="#fff" /><Text style={locStyles.gpsBtnText}>Use Current Location</Text></>
          }
        </TouchableOpacity>

        <View style={locStyles.divRow}>
          <View style={locStyles.div} /><Text style={locStyles.or}>or enter manually</Text><View style={locStyles.div} />
        </View>

        <TextInput
          style={locStyles.input}
          placeholder="Area, locality or city (e.g. Banjara Hills)"
          value={manual}
          onChangeText={setManual}
          placeholderTextColor={Colors.textMuted}
          returnKeyType="done"
          onSubmitEditing={handleManual}
        />
        <TouchableOpacity style={locStyles.confirmBtn} onPress={handleManual}>
          <Text style={locStyles.confirmBtnText}>Confirm Location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={locStyles.cancelBtn} onPress={onClose}>
          <Text style={locStyles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }: any) {
  const { user, userLat, userLng, homeAddress, setLocation, locationSetup } = useAuthStore()
  const { toggleFavorite, isFavorite } = useFavoritesStore()
  const { enrollments: localEnrollments } = useLocalEnrollmentsStore()
  const [selectedSport, setSelectedSport]       = useState<string | null>(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['academies', userLat, userLng, selectedSport],
    queryFn:  () => academyAPI.list({ lat: userLat ?? undefined, lng: userLng ?? undefined, sport: selectedSport ?? undefined }),
    staleTime: 5 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
    placeholderData: (prev: any) => prev,
  })

  // Auto-request location silently on first open
  React.useEffect(() => {
    if (locationSetup) return
    ;(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
          const [geo] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
          const address = [geo.name, geo.district, geo.city].filter(Boolean).join(', ') || 'Current Location'
          setLocation(loc.coords.latitude, loc.coords.longitude, address)
        } else {
          setLocation(17.385044, 78.486671, 'Hyderabad')
        }
      } catch {
        setLocation(17.385044, 78.486671, 'Hyderabad')
      }
    })()
  }, [])

  const academies: Academy[] = data?.data ?? []
  const featured = useMemo(() => academies.filter((a) => a.rating >= 4.7), [academies])
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  // Discipline counts derived from real data
  const disciplineData = useMemo(() => {
    const counts: Record<string, number> = {}
    academies.forEach((a) => {
      const sports = [...new Set((a.programs ?? []).map((p: any) => p.sportType as string))]
      sports.forEach((s) => { counts[s] = (counts[s] ?? 0) + 1 })
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [academies])

  const activeEnrollment = useMemo(
    () => localEnrollments.find((e) => ['CONFIRMED', 'ACTIVE'].includes(e.status)),
    [localEnrollments]
  )
  const nextAcademy = (activeEnrollment as any)?.slot?.program?.academy
  const nextProgram = (activeEnrollment as any)?.slot?.program
  const nextSlot    = (activeEnrollment as any)?.slot

  const handleNavAcademy = useCallback((academy: Academy) => {
    navigation.navigate('AcademyDetail', { academy })
  }, [navigation])

  const handleSportSelect = useCallback((sport: string | null) => {
    setSelectedSport(sport)
  }, [])

  const unreadNotifs = localEnrollments.filter((e) => e.status === 'PENDING').length

  return (
    <View style={styles.container}>

      {/* ── Gradient top header ──────────────────────────────── */}
      <LinearGradient
        colors={['#1AAFC9', '#1C2E4A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topHeader}
      >
        <View style={styles.topHeaderLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowLocationPicker(true)}>
            <Text style={styles.appName}>SportNexus</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.65)" />
              <Text style={styles.locationText} numberOfLines={1}>{homeAddress ?? 'Hyderabad'}</Text>
              <Ionicons name="chevron-down" size={11} color="rgba(255,255,255,0.65)" />
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={22} color="rgba(255,255,255,0.9)" />
          {unreadNotifs > 0 && <View style={styles.bellDot} />}
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
      >

        {/* ── Hero text ──────────────────────────────────────── */}
        <MotiView from={{ opacity: 0, translateY: -16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', damping: 18, stiffness: 160 }}>
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Explore Talent</Text>
            <Text style={styles.heroSub}>Find the perfect arena for your star.</Text>
          </View>
        </MotiView>

        {/* ── Search bar ─────────────────────────────────────── */}
        <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', delay: 80, damping: 18, stiffness: 160 }}>
          <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Search')} activeOpacity={0.85}>
            <Ionicons name="search-outline" size={17} color={Colors.textMuted} />
            <Text style={styles.searchText}>Search sports or academies...</Text>
          </TouchableOpacity>
        </MotiView>

        {/* ── Active enrollment banner ──────────────────────── */}
        {activeEnrollment && nextAcademy && (
          <TouchableOpacity
            style={styles.upcomingBanner}
            onPress={() => navigation.navigate('EnrollmentDetail', { enrollment: activeEnrollment })}
            activeOpacity={0.88}
          >
            <View style={styles.upcomingLeft}>
              <View style={styles.upcomingDot} />
              <View>
                <Text style={styles.upcomingLabel}>ACTIVE ENROLLMENT</Text>
                <Text style={styles.upcomingAcademy} numberOfLines={1}>{nextAcademy.name}</Text>
                {nextProgram && <Text style={styles.upcomingProgram}>{nextProgram.name}</Text>}
              </View>
            </View>
            <View style={styles.upcomingRight}>
              {nextSlot && <Text style={styles.upcomingTime}>{nextSlot.timeStart}</Text>}
              <Ionicons name="arrow-forward-circle" size={20} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        )}

        {/* ── Disciplines ────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Disciplines</Text>
            <TouchableOpacity onPress={() => handleSportSelect(null)}>
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <FlatList
              horizontal showsHorizontalScrollIndicator={false}
              data={[1, 2, 3]}
              keyExtractor={(i) => String(i)}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
              renderItem={() => <View style={[styles.discCard, { opacity: 0.4 }]}><View style={styles.discIconWrap} /></View>}
            />
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={disciplineData}
              keyExtractor={([sport]) => sport}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingVertical: 4 }}
              renderItem={({ item: [sport, count], index }) => (
                <MotiView
                  from={{ opacity: 0, scale: 0.75, translateY: 16 }}
                  animate={{ opacity: 1, scale: 1, translateY: 0 }}
                  transition={{ type: 'spring', delay: 80 + index * 60, damping: 14, stiffness: 160 }}
                >
                  <DisciplineCard
                    sport={sport}
                    count={count}
                    active={selectedSport === sport}
                    onPress={() => handleSportSelect(selectedSport === sport ? null : sport)}
                  />
                </MotiView>
              )}
              initialNumToRender={6}
            />
          )}
        </View>

        {/* ── Top Picks (Featured) ───────────────────────────── */}
        {(isLoading || featured.length > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Picks</Text>
              <TouchableOpacity style={styles.seeAll} onPress={() => navigation.navigate('Search')}>
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            {isLoading ? (
              <FlatList
                horizontal showsHorizontalScrollIndicator={false}
                data={[1, 2]}
                keyExtractor={(i) => String(i)}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                renderItem={() => <SkeletonFeaturedCard />}
              />
            ) : (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={featured}
                keyExtractor={(i) => i.id}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                snapToInterval={CARD_WIDTH + 12}
                decelerationRate="fast"
                renderItem={({ item }) => (
                  <FeaturedCard
                    academy={item}
                    onPress={() => handleNavAcademy(item)}
                    onFavorite={() => toggleFavorite(item)}
                    isFav={isFavorite(item.id)}
                  />
                )}
                initialNumToRender={3}
              />
            )}
          </View>
        )}

        {/* ── Nearby Centers ─────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Centers</Text>
            <Text style={styles.sectionCount}>
              {isLoading ? '...' : academies.length > 0 ? `${academies.length} found` : ''}
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.nearList}>
              {[1, 2, 3].map((i) => <SkeletonAcademyRow key={i} />)}
            </View>
          ) : academies.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No academies found</Text>
              <Text style={styles.emptySub}>Try changing your location or sport filter.</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.nearList}>
              {academies.map((a, idx) => (
                <MotiView
                  key={a.id}
                  from={{ opacity: 0, translateX: -24 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'spring', delay: idx * 70, damping: 18, stiffness: 160 }}
                >
                  <NearbyCenterCard academy={a} onPress={() => handleNavAcademy(a)} />
                </MotiView>
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      <LocationPickerModal
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
      />
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const locStyles = StyleSheet.create({
  overlay:        { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:          { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12 },
  handle:         { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 8 },
  title:          { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  sub:            { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4 },
  gpsBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 15, borderRadius: BorderRadius.lg },
  gpsBtnText:     { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
  divRow:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  div:            { flex: 1, height: 1, backgroundColor: Colors.border },
  or:             { fontSize: FontSize.sm, color: Colors.textMuted },
  input:          { backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: FontSize.base, color: Colors.textPrimary },
  confirmBtn:     { backgroundColor: Colors.navyMid, paddingVertical: 14, borderRadius: BorderRadius.lg, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
  cancelBtn:      { alignItems: 'center', paddingVertical: 8 },
  cancelBtnText:  { fontSize: FontSize.base, color: Colors.textSecondary },
})

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // ── Top header ────────────────────────────────────────────────────────────
  topHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16,
  },
  topHeaderLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:     { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: '#fff' },
  appName:        { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, color: '#fff' },
  locationRow:    { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  locationText:   { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', maxWidth: 160 },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  bellDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },

  // ── Search bar ────────────────────────────────────────────────────────────
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 16, marginBottom: 4,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 16, paddingVertical: 13,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.xs,
  },
  searchText: { flex: 1, color: Colors.textMuted, fontSize: FontSize.base },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  heroTitle:   { fontSize: FontSize['3xl'], fontWeight: FontWeight.black, color: Colors.textPrimary, letterSpacing: -0.8 },
  heroSub:     { fontSize: FontSize.base, color: Colors.textSecondary, marginTop: 4 },

  // ── Active enrollment banner ──────────────────────────────────────────────
  upcomingBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: 14, borderLeftWidth: 4, borderLeftColor: Colors.primary,
    ...Shadow.sm,
  },
  upcomingLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  upcomingDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  upcomingLabel:   { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary, letterSpacing: 0.8 },
  upcomingAcademy: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 1 },
  upcomingProgram: { fontSize: FontSize.xs, color: Colors.textSecondary },
  upcomingRight:   { alignItems: 'flex-end', gap: 4 },
  upcomingTime:    { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },

  // ── Section chrome ────────────────────────────────────────────────────────
  section:       { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle:  { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  sectionCount:  { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  viewAll:       { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  seeAll:        { flexDirection: 'row', alignItems: 'center', gap: 3 },
  seeAllText:    { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },

  // ── Discipline cards ──────────────────────────────────────────────────────
  discCard: {
    width: 100,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.xs,
  },
  discCardActive: {
    backgroundColor: Colors.navyMid,
    borderColor: Colors.navyMid,
  },
  discIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.tealXLight,
    alignItems: 'center', justifyContent: 'center',
  },
  discIconWrapActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  discEmoji:          { fontSize: 24 },
  discName:           { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  discNameActive:     { color: '#fff' },
  discCount:          { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  discCountActive:    { color: 'rgba(255,255,255,0.65)' },

  // ── Featured card ─────────────────────────────────────────────────────────
  featCard: {
    height: 220, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadow.md,
  },
  featImg:       { width: '100%', height: '100%', position: 'absolute' },
  featOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,22,40,0.45)' },
  featSportBadge:{ position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: BorderRadius.full },
  featSportEmoji:{ fontSize: 11 },
  featSportText: { fontSize: 10, color: '#fff', fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  featRating:    { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 4 },
  featRatingText:{ fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.bold },
  favBtn:        { position: 'absolute', top: 44, right: 12, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  featContent:   { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, gap: 6 },
  transportPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(26,175,201,0.8)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: BorderRadius.full, alignSelf: 'flex-start' },
  transportPillText: { fontSize: 10, color: '#fff', fontWeight: FontWeight.semibold },
  featName:      { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: '#fff', letterSpacing: -0.3 },
  featMeta:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featMetaText:  { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', flex: 1 },
  featFee:       { fontSize: FontSize.xs, color: Colors.primaryLight, fontWeight: FontWeight.bold },

  // ── Nearby Centers cards ──────────────────────────────────────────────────
  nearList: { paddingHorizontal: 16, gap: 12 },
  nearCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  nearImgWrap: { width: 90, height: 90 },
  nearImg:     { width: '100%', height: '100%' },
  nearInfo:    { flex: 1, padding: 12, gap: 6 },
  nearInfoTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  nearName:    { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, flex: 1 },
  nearDistRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  nearDist:    { fontSize: FontSize.xs, color: Colors.textMuted },
  nearRating:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  nearRatingText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  nearTags:    { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  nearTag:     { backgroundColor: Colors.tealLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  nearTagText: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.primary, letterSpacing: 0.3 },
  nearTagSafety: { backgroundColor: '#E0F2FE' },
  nearTagSafetyText: { color: '#0284C7' },

  // + FAB button on cards
  plusBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
    ...Shadow.sm,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyState:   { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32 },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyTitle:   { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, marginBottom: 6 },
  emptySub:     { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn:     { marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: BorderRadius.full },
  retryBtnText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.sm },
})
