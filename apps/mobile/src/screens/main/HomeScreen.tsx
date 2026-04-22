import React, { useState, useCallback, useMemo } from 'react'
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  RefreshControl, Image, StyleSheet, Dimensions,
  Modal, TextInput, ActivityIndicator, Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import * as Location from 'expo-location'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { academyAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { useFavoritesStore } from '../../store/favoritesStore'
import { useLocalEnrollmentsStore } from '../../store/localEnrollmentsStore'
import { SPORT_ICONS, SPORT_TYPES } from '@sportnexus/utils'
import { Academy } from '@sportnexus/types'
import { Colors, FontSize, FontWeight, BorderRadius, Shadow, SportColors, Gradients } from '../../constants/theme'
import { SkeletonFeaturedCard, SkeletonAcademyRow } from '../../components/SkeletonCard'

const { width } = Dimensions.get('window')
const CARD_WIDTH = width - 48

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

// ─── Sport Chip ──────────────────────────────────────────────────────────────
const SportChip = React.memo(function SportChip({ sport, active, onPress }: { sport: string; active: boolean; onPress: () => void }) {
  const color = SportColors[sport] ?? Colors.primary
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        active
          ? { backgroundColor: color, borderColor: color }
          : { backgroundColor: Colors.surface, borderColor: Colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {sport !== 'All' && <Text style={styles.chipEmoji}>{SPORT_ICONS[sport] ?? '🏅'}</Text>}
      {sport === 'All' && <Text style={styles.chipEmoji}>🏆</Text>}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{sport}</Text>
    </TouchableOpacity>
  )
})

// ─── Featured Card ────────────────────────────────────────────────────────────
const FeaturedCard = React.memo(function FeaturedCard({ academy, onPress, onFavorite, isFav }: {
  academy: Academy; onPress: () => void; onFavorite: () => void; isFav: boolean
}) {
  const photo = academy.photos?.[0]?.url
  const sport = academy.programs?.[0]?.sportType ?? ''
  const minFee = useMemo(
    () => academy.programs?.length ? Math.min(...academy.programs.map((p: any) => p.feeMonthly)) : 0,
    [academy.programs]
  )
  const sportColor = SportColors[sport] ?? Colors.primary

  return (
    <TouchableOpacity style={[styles.featCard, { width: CARD_WIDTH }]} onPress={onPress} activeOpacity={0.92}>
      {/* Photo */}
      {photo ? (
        <Image source={{ uri: photo }} style={styles.featImg} resizeMode="cover" />
      ) : (
        <View style={[styles.featImg, styles.featImgPlaceholder]}>
          <Text style={styles.featEmoji}>{SPORT_ICONS[sport] ?? '🏅'}</Text>
        </View>
      )}

      {/* Bottom gradient overlay for text legibility */}
      <LinearGradient
        colors={['transparent', 'rgba(15,23,42,0.55)', 'rgba(15,23,42,0.92)']}
        locations={[0.35, 0.65, 1]}
        style={styles.featGradient}
      />

      {/* Sport badge — top left */}
      <View style={[styles.featSportBadge, { backgroundColor: sportColor }]}>
        <Text style={styles.featSportBadgeEmoji}>{SPORT_ICONS[sport] ?? '🏅'}</Text>
        <Text style={styles.featSportBadgeText}>{sport}</Text>
      </View>

      {/* Rating badge — top right */}
      <View style={styles.featRating}>
        <Ionicons name="star" size={11} color="#FBBF24" />
        <Text style={styles.featRatingText}>{academy.rating}</Text>
      </View>

      {/* Favorite button — top right, below rating badge */}
      <TouchableOpacity style={styles.favBtn} onPress={onFavorite} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={18} color={isFav ? '#EF4444' : '#fff'} />
      </TouchableOpacity>

      {/* Bottom content */}
      <View style={styles.featContent}>
        <View style={styles.featBadgeRow}>
          {academy.transportAvailable && (
            <View style={styles.transportPill}>
              <Ionicons name="bus-outline" size={11} color="#fff" />
              <Text style={styles.transportPillText}>Transport</Text>
            </View>
          )}
        </View>
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

// ─── Academy Row ─────────────────────────────────────────────────────────────
const AcademyRow = React.memo(function AcademyRow({ academy, onPress }: { academy: Academy; onPress: () => void }) {
  const photo = academy.photos?.[0]?.url
  const sport = academy.programs?.[0]?.sportType ?? ''
  const minFee = useMemo(
    () => academy.programs?.length ? Math.min(...academy.programs.map((p: any) => p.feeMonthly)) : 0,
    [academy.programs]
  )
  const sportColor = SportColors[sport] ?? Colors.primary

  return (
    <TouchableOpacity style={styles.rowCard} onPress={onPress} activeOpacity={0.88}>
      {/* Photo thumbnail */}
      {photo ? (
        <Image source={{ uri: photo }} style={styles.rowThumb} resizeMode="cover" />
      ) : (
        <View style={[styles.rowThumb, styles.rowThumbPlaceholder, { backgroundColor: sportColor + '20' }]}>
          <Text style={{ fontSize: 26 }}>{SPORT_ICONS[sport] ?? '🏅'}</Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowName} numberOfLines={1}>{academy.name}</Text>
          {academy.isVerified && <Ionicons name="checkmark-circle" size={15} color={Colors.primary} />}
        </View>

        {/* Sport dot + label */}
        <View style={styles.rowSportRow}>
          <View style={[styles.sportDot, { backgroundColor: sportColor }]} />
          <Text style={[styles.sportDotLabel, { color: sportColor }]}>{sport}</Text>
        </View>

        <View style={styles.rowMeta}>
          <View style={styles.rowMetaItem}>
            <Ionicons name="star" size={11} color="#FBBF24" />
            <Text style={styles.rowMetaText}>{academy.rating} ({academy.reviewCount})</Text>
          </View>
          {academy.distance !== undefined && (
            <View style={styles.distanceChip}>
              <Ionicons name="location-outline" size={10} color={Colors.primary} />
              <Text style={styles.distanceChipText}>{academy.distance} km</Text>
            </View>
          )}
        </View>
      </View>

      {/* Fee + chevron */}
      <View style={styles.rowRight}>
        {minFee > 0 && (
          <>
            <Text style={styles.rowFee}>₹{minFee}</Text>
            <Text style={styles.rowFeeSub}>/month</Text>
          </>
        )}
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginTop: 6 }} />
      </View>
    </TouchableOpacity>
  )
})

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.icon}>🔍</Text>
      <Text style={emptyStyles.title}>No academies found</Text>
      <Text style={emptyStyles.sub}>Try changing your location or adjusting the sport filter.</Text>
      <TouchableOpacity style={emptyStyles.btn} onPress={onRefresh} activeOpacity={0.85}>
        <Ionicons name="refresh-outline" size={16} color="#fff" />
        <Text style={emptyStyles.btnText}>Retry</Text>
      </TouchableOpacity>
    </View>
  )
}

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
        setLoading(false)
        return
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      })
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
    // Use Hyderabad coords as base; in production you'd geocode the address
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
            : <>
                <Ionicons name="navigate" size={18} color="#fff" />
                <Text style={locStyles.gpsBtnText}>Use Current Location</Text>
              </>
          }
        </TouchableOpacity>

        <View style={locStyles.divRow}>
          <View style={locStyles.div} /><Text style={locStyles.or}>or enter manually</Text><View style={locStyles.div} />
        </View>

        <TextInput
          style={locStyles.input}
          placeholder="Area, locality or city  (e.g. Banjara Hills)"
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
  const { user, userLat, userLng, homeAddress } = useAuthStore()
  const { toggleFavorite, isFavorite } = useFavoritesStore()
  const { enrollments: localEnrollments } = useLocalEnrollmentsStore()
  const [selectedSport, setSelectedSport] = useState<string | null>(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['academies', userLat, userLng, selectedSport],
    queryFn:  () => academyAPI.list({ lat: userLat ?? undefined, lng: userLng ?? undefined, sport: selectedSport ?? undefined }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  // Only show real API data — no mock fallback
  const academies: Academy[] = data?.data ?? []
  const featured  = useMemo(() => academies.filter((a) => a.rating >= 4.7), [academies])
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  // Stats derived from real data
  const nearestDistance = useMemo(() => {
    const withDist = academies.filter((a) => a.distance !== undefined)
    if (!withDist.length) return null
    return Math.min(...withDist.map((a) => a.distance as number))
  }, [academies])
  const filtersActive = selectedSport ? 1 : 0

  // Active enrollments for "Next Session" banner
  const activeEnrollment = useMemo(
    () => localEnrollments.find((e) => ['CONFIRMED', 'ACTIVE'].includes(e.status)),
    [localEnrollments]
  )
  const nextAcademy  = (activeEnrollment as any)?.slot?.program?.academy
  const nextProgram  = (activeEnrollment as any)?.slot?.program
  const nextSlot     = (activeEnrollment as any)?.slot

  const handleNavAcademy = useCallback((academy: Academy) => {
    navigation.navigate('AcademyDetail', { academy })
  }, [navigation])

  const handleFavorite = useCallback((academy: Academy) => {
    toggleFavorite(academy)
  }, [toggleFavorite])

  const handleSportSelect = useCallback((sport: string) => {
    setSelectedSport(sport === 'All' ? null : sport)
  }, [])

  const renderFeaturedItem = useCallback(({ item }: { item: Academy }) => (
    <FeaturedCard
      academy={item}
      onPress={() => handleNavAcademy(item)}
      onFavorite={() => handleFavorite(item)}
      isFav={isFavorite(item.id)}
    />
  ), [handleNavAcademy, handleFavorite, isFavorite])

  const renderChipItem = useCallback(({ item }: { item: string }) => (
    <SportChip
      sport={item}
      active={(item === 'All' && !selectedSport) || item === selectedSport}
      onPress={() => handleSportSelect(item)}
    />
  ), [selectedSport, handleSportSelect])

  const sportData = useMemo(() => ['All', ...SPORT_TYPES], [])

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
    >
      {/* ── Gradient Header Strip ────────────────────────────── */}
      <LinearGradient
        colors={['#0D9488', '#1E3A5F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Greeting row */}
        <View style={styles.headerContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingSmall}>Good {getGreeting()}</Text>
            <Text style={styles.greeting}>{firstName} 👋</Text>
            <TouchableOpacity style={styles.locationRow} onPress={() => setShowLocationPicker(true)}>
              <Ionicons name="location" size={13} color="rgba(255,255,255,0.6)" />
              <Text style={styles.locationText} numberOfLines={1}>{homeAddress ?? 'Hyderabad'}</Text>
              <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            {localEnrollments.filter((e) => e.status === 'PENDING').length > 0 && (
              <View style={styles.bellDot} />
            )}
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Search')} activeOpacity={0.9}>
          <Ionicons name="search-outline" size={17} color={Colors.textMuted} />
          <Text style={styles.searchText}>Search academies, sports...</Text>
          <View style={styles.searchFilter}>
            <Ionicons name="options-outline" size={16} color={Colors.primary} />
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {/* ── Stats Row ──────────────────────────────────────────── */}
      {!isLoading && academies.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{academies.length}</Text>
            <Text style={styles.statLabel}>Academies</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {nearestDistance !== null ? `${nearestDistance} km` : '—'}
            </Text>
            <Text style={styles.statLabel}>Nearest</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, filtersActive > 0 && { color: Colors.primary }]}>
              {filtersActive}
            </Text>
            <Text style={styles.statLabel}>Filters</Text>
          </View>
        </View>
      )}

      {/* ── Upcoming Session Banner ─────────────────────────── */}
      {activeEnrollment && nextAcademy && (
        <TouchableOpacity
          style={styles.upcomingBanner}
          onPress={() => navigation.navigate('Enrollments')}
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

      {/* ── Sport Chips ────────────────────────────────────── */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={sportData}
        keyExtractor={(i) => i}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 14 }}
        renderItem={renderChipItem}
        removeClippedSubviews
        initialNumToRender={8}
      />

      {/* ── Featured ───────────────────────────────────────── */}
      {(isLoading || featured.length > 0) && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured</Text>
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
              renderItem={renderFeaturedItem}
              removeClippedSubviews
              initialNumToRender={3}
              maxToRenderPerBatch={3}
            />
          )}
        </View>
      )}

      {/* ── Near You ───────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Near You</Text>
          <Text style={styles.sectionCount}>
            {isLoading ? '...' : academies.length > 0 ? `${academies.length} academies` : ''}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.rowList}>
            {[1, 2, 3].map((i) => <SkeletonAcademyRow key={i} />)}
          </View>
        ) : academies.length === 0 ? (
          <EmptyState onRefresh={refetch} />
        ) : (
          <View style={styles.rowList}>
            {academies.map((a) => (
              <AcademyRow
                key={a.id}
                academy={a}
                onPress={() => handleNavAcademy(a)}
              />
            ))}
          </View>
        )}
      </View>

      <LocationPickerModal
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
      />
    </ScrollView>
  )
}

// ─── Empty State Styles ───────────────────────────────────────────────────────
const emptyStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32 },
  icon:      { fontSize: 48, marginBottom: 12 },
  title:     { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, marginBottom: 6 },
  sub:       { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  btn:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 11, borderRadius: BorderRadius.full },
  btnText:   { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
})

// ─── Location Modal Styles ────────────────────────────────────────────────────
const locStyles = StyleSheet.create({
  overlay:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:         { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12 },
  handle:        { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 8 },
  title:         { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  sub:           { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4 },
  gpsBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 15, borderRadius: BorderRadius.lg },
  gpsBtnText:    { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
  divRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  div:           { flex: 1, height: 1, backgroundColor: Colors.border },
  or:            { fontSize: FontSize.sm, color: Colors.textMuted },
  input:         { backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: FontSize.base, color: Colors.textPrimary },
  confirmBtn:    { backgroundColor: Colors.navy, paddingVertical: 14, borderRadius: BorderRadius.lg, alignItems: 'center' },
  confirmBtnText:{ color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
  cancelBtn:     { alignItems: 'center', paddingVertical: 8 },
  cancelBtnText: { fontSize: FontSize.base, color: Colors.textSecondary },
})

// ─── Main Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Screen
  container: { flex: 1, backgroundColor: Colors.background },

  // ── Header strip ──────────────────────────────────────────────────────────
  header: {
    paddingTop: 52,
    paddingBottom: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  greetingSmall: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.65)', fontWeight: FontWeight.medium },
  greeting:      { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: '#fff', letterSpacing: -0.5, marginTop: 1 },
  locationRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  locationText:  { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.55)', maxWidth: 200 },
  bellBtn:       { marginTop: 4, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bellDot:       { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: Colors.navyMid },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 16, paddingVertical: 13,
    ...Shadow.md,
  },
  searchText:   { flex: 1, color: Colors.textMuted, fontSize: FontSize.base },
  searchFilter: { backgroundColor: Colors.tealXLight, padding: 6, borderRadius: BorderRadius.sm },

  // ── Stats row ─────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 20,
    ...Shadow.sm,
  },
  statItem:    { flex: 1, alignItems: 'center' },
  statValue:   { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  statLabel:   { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, fontWeight: FontWeight.medium },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border },

  // ── Upcoming banner ───────────────────────────────────────────────────────
  upcomingBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginTop: 12,
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

  // ── Sport chips ───────────────────────────────────────────────────────────
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    ...Shadow.xs,
  },
  chipEmoji:      { fontSize: 13 },
  chipText:       { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  chipTextActive: { color: '#fff' },

  // ── Section chrome ────────────────────────────────────────────────────────
  section:       { marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle:  { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  sectionCount:  { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  seeAll:        { flexDirection: 'row', alignItems: 'center', gap: 3 },
  seeAllText:    { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },

  // ── Featured card ─────────────────────────────────────────────────────────
  featCard: {
    height: 230,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.md,
  },
  featImg:            { width: '100%', height: '100%', position: 'absolute' },
  featImgPlaceholder: { backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center' },
  featEmoji:          { fontSize: 56 },

  // Gradient sits on top of photo, below badges/content
  featGradient: { ...StyleSheet.absoluteFillObject },

  // Sport badge — top left
  featSportBadge: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  featSportBadgeEmoji: { fontSize: 11 },
  featSportBadgeText:  { fontSize: 10, color: '#fff', fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Rating badge — top right
  featRating: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  featRatingText: { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.bold },

  // Favorite button — top right, below the rating badge
  favBtn: {
    position: 'absolute', top: 48, right: 12,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },

  featContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, gap: 4 },
  featBadgeRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  transportPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  transportPillText: { fontSize: 10, color: '#fff', fontWeight: FontWeight.semibold },
  featName:    { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: '#fff', letterSpacing: -0.3 },
  featMeta:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featMetaText:{ fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', flex: 1 },
  featFee:     { fontSize: FontSize.xs, color: Colors.primaryLight, fontWeight: FontWeight.bold },

  // ── Academy row card ──────────────────────────────────────────────────────
  rowList:  { paddingHorizontal: 16, gap: 10 },
  rowCard:  {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 12,
    ...Shadow.sm,
  },
  rowThumb:            { width: 76, height: 76, borderRadius: BorderRadius.md },
  rowThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  rowBody:  { flex: 1, gap: 3 },
  rowTop:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowName:  { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, flex: 1 },

  // Colored sport dot + label
  rowSportRow:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sportDot:      { width: 7, height: 7, borderRadius: 3.5 },
  sportDotLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },

  rowMeta:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  rowMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rowMetaText: { fontSize: FontSize.xs, color: Colors.textSecondary },

  // Distance chip
  distanceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.tealXLight,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  distanceChipText: { fontSize: 10, color: Colors.primary, fontWeight: FontWeight.semibold },

  rowRight:  { alignItems: 'flex-end' },
  rowFee:    { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  rowFeeSub: { fontSize: FontSize.xs, color: Colors.textMuted },
})
