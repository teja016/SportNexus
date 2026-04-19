import React, { useState, useCallback, useMemo } from 'react'
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  RefreshControl, Image, StyleSheet, Dimensions,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { academyAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { useFavoritesStore } from '../../store/favoritesStore'
import { useLocalEnrollmentsStore } from '../../store/localEnrollmentsStore'
import { MOCK_ACADEMIES } from '../../constants/mockData'
import { SPORT_ICONS, SPORT_TYPES } from '@sportnexus/utils'
import { Academy } from '@sportnexus/types'
import { Colors, FontSize, FontWeight, BorderRadius, Shadow, SportColors } from '../../constants/theme'
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
      style={[styles.chip, active && { backgroundColor: color, borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {sport !== 'All' && <Text style={styles.chipEmoji}>{SPORT_ICONS[sport] ?? '🏅'}</Text>}
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
      {photo ? (
        <Image source={{ uri: photo }} style={styles.featImg} />
      ) : (
        <View style={[styles.featImg, styles.featImgPlaceholder]}>
          <Text style={styles.featEmoji}>{SPORT_ICONS[sport] ?? '🏅'}</Text>
        </View>
      )}
      <View style={styles.featOverlay} />

      {/* Favorite button */}
      <TouchableOpacity style={styles.favBtn} onPress={onFavorite} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={18} color={isFav ? '#EF4444' : '#fff'} />
      </TouchableOpacity>

      <View style={styles.featRating}>
        <Ionicons name="star" size={11} color="#FBBF24" />
        <Text style={styles.featRatingText}>{academy.rating}</Text>
      </View>

      <View style={styles.featContent}>
        <View style={styles.featRow}>
          <View style={[styles.sportPill, { backgroundColor: sportColor }]}>
            <Text style={styles.sportPillText}>{sport}</Text>
          </View>
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
      {photo ? (
        <Image source={{ uri: photo }} style={styles.rowThumb} />
      ) : (
        <View style={[styles.rowThumb, { backgroundColor: sportColor + '20', alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: 26 }}>{SPORT_ICONS[sport] ?? '🏅'}</Text>
        </View>
      )}

      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowName} numberOfLines={1}>{academy.name}</Text>
          {academy.isVerified && <Ionicons name="checkmark-circle" size={15} color={Colors.primary} />}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <View style={[styles.sportTag, { backgroundColor: sportColor + '15' }]}>
            <Text style={[styles.sportTagText, { color: sportColor }]}>{sport}</Text>
          </View>
        </View>
        <View style={styles.rowMeta}>
          <View style={styles.rowMetaItem}>
            <Ionicons name="star" size={11} color="#FBBF24" />
            <Text style={styles.rowMetaText}>{academy.rating} ({academy.reviewCount})</Text>
          </View>
          {academy.distance !== undefined && (
            <View style={styles.rowMetaItem}>
              <Ionicons name="location-outline" size={11} color={Colors.textMuted} />
              <Text style={styles.rowMetaText}>{academy.distance} km</Text>
            </View>
          )}
        </View>
      </View>

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

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }: any) {
  const { user, userLat, userLng, homeAddress } = useAuthStore()
  const { toggleFavorite, isFavorite } = useFavoritesStore()
  const { enrollments: localEnrollments } = useLocalEnrollmentsStore()
  const [selectedSport, setSelectedSport] = useState<string | null>(null)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['academies', userLat, userLng, selectedSport],
    queryFn:  () => academyAPI.list({ lat: userLat ?? undefined, lng: userLng ?? undefined, sport: selectedSport ?? undefined }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const academies: Academy[] = data?.data ?? MOCK_ACADEMIES
  const featured  = useMemo(() => academies.filter((a) => a.rating >= 4.7), [academies])
  const firstName = user?.name?.split(' ')[0] ?? 'there'

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
      contentContainerStyle={{ paddingBottom: 32 }}
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
      {/* ── Header ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerBg} />
        <View style={styles.headerContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Good {getGreeting()}, {firstName} 👋</Text>
            <TouchableOpacity style={styles.locationRow}>
              <Ionicons name="location" size={14} color={Colors.primaryLight} />
              <Text style={styles.locationText} numberOfLines={1}>{homeAddress ?? 'Hyderabad'}</Text>
              <Ionicons name="chevron-down" size={13} color={Colors.primaryLight} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Enrollments')}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            {localEnrollments.filter((e) => e.status === 'PENDING').length > 0 && (
              <View style={styles.bellDot} />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Search')} activeOpacity={0.9}>
          <Ionicons name="search-outline" size={17} color={Colors.textSecondary} />
          <Text style={styles.searchText}>Search academies, sports...</Text>
          <View style={styles.searchFilter}>
            <Ionicons name="options-outline" size={16} color={Colors.primary} />
          </View>
        </TouchableOpacity>
      </View>

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
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 12 }}
        renderItem={renderChipItem}
        removeClippedSubviews
        initialNumToRender={8}
      />

      {/* ── Featured ───────────────────────────────────────── */}
      {(isLoading ? true : featured.length > 0) && (
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
          <Text style={styles.sectionCount}>{isLoading ? '...' : `${academies.length} academies`}</Text>
        </View>

        {isLoading ? (
          <View style={styles.rowList}>
            {[1, 2, 3].map((i) => <SkeletonAcademyRow key={i} />)}
          </View>
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
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: { paddingBottom: 20 },
  headerBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.navy,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerContent: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
  },
  greeting:    { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: '#fff', letterSpacing: -0.3 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationText:{ fontSize: FontSize.sm, color: 'rgba(255,255,255,0.6)', maxWidth: 200 },
  bellBtn:     { marginTop: 4, padding: 4, position: 'relative' },
  bellDot:     { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: Colors.navy },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, backgroundColor: '#fff',
    borderRadius: BorderRadius.xl, paddingHorizontal: 16, paddingVertical: 13,
    ...Shadow.md,
  },
  searchText:   { flex: 1, color: Colors.textMuted, fontSize: FontSize.base },
  searchFilter: { backgroundColor: Colors.tealXLight, padding: 6, borderRadius: BorderRadius.sm },

  upcomingBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: 14, borderLeftWidth: 4, borderLeftColor: Colors.primary,
    ...Shadow.sm,
  },
  upcomingLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  upcomingDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  upcomingLabel:  { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary, letterSpacing: 0.8 },
  upcomingAcademy:{ fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 1 },
  upcomingProgram:{ fontSize: FontSize.xs, color: Colors.textSecondary },
  upcomingRight:  { alignItems: 'flex-end', gap: 4 },
  upcomingTime:   { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },

  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: BorderRadius.full, backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border,
    ...Shadow.xs,
  },
  chipEmoji:     { fontSize: 13 },
  chipText:      { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  chipTextActive:{ color: '#fff' },

  section:      { marginTop: 4 },
  sectionHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  sectionCount: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  seeAll:       { flexDirection: 'row', alignItems: 'center', gap: 3 },
  seeAllText:   { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },

  featCard: {
    height: 220, borderRadius: BorderRadius.xl, overflow: 'hidden',
    ...Shadow.md,
  },
  featImg:  { width: '100%', height: '100%', position: 'absolute' },
  featImgPlaceholder: { backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center' },
  featEmoji:{ fontSize: 56 },
  featOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,15,30,0.55)' },

  favBtn: {
    position: 'absolute', top: 12, left: 12,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
  },
  featRating: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  featRatingText: { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.bold },
  featContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, gap: 6 },
  featRow:    { flexDirection: 'row', gap: 6 },
  sportPill:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  sportPillText: { fontSize: 10, color: '#fff', fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  transportPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: BorderRadius.full },
  transportPillText: { fontSize: 10, color: '#fff', fontWeight: FontWeight.semibold },
  featName: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: '#fff', letterSpacing: -0.3 },
  featMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featMetaText: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)', flex: 1 },
  featFee: { fontSize: FontSize.xs, color: Colors.primaryLight, fontWeight: FontWeight.bold },

  rowList:  { paddingHorizontal: 16, gap: 10 },
  rowCard:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 12, ...Shadow.sm },
  rowThumb: { width: 72, height: 72, borderRadius: BorderRadius.md },
  rowBody:  { flex: 1, gap: 4 },
  rowTop:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowName:  { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, flex: 1 },
  sportTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
  sportTagText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  rowMeta:  { flexDirection: 'row', gap: 10, marginTop: 2 },
  rowMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rowMetaText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  rowRight: { alignItems: 'flex-end' },
  rowFee:   { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  rowFeeSub:{ fontSize: FontSize.xs, color: Colors.textMuted },
})
