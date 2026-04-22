import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  Modal, Switch, StyleSheet, Image,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { academyAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { useFavoritesStore } from '../../store/favoritesStore'
import { MOCK_ACADEMIES } from '../../constants/mockData'
import { SPORT_ICONS, SPORT_TYPES } from '@sportnexus/utils'
import { Academy } from '@sportnexus/types'
import { Colors, FontSize, FontWeight, BorderRadius, Shadow, SportColors } from '../../constants/theme'
import { SkeletonSearchCard } from '../../components/SkeletonCard'

const RATING_OPTIONS = [
  { label: 'Any',  value: 0   },
  { label: '3+',   value: 3   },
  { label: '3.5+', value: 3.5 },
  { label: '4+',   value: 4   },
  { label: '4.5+', value: 4.5 },
]
const DISTANCE_OPTIONS = [
  { label: 'Any',   value: 0  },
  { label: '5 km',  value: 5  },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
  { label: '50 km', value: 50 },
]
const SORT_OPTIONS = [
  { key: 'distance', label: 'Nearest',    icon: 'location-outline' },
  { key: 'rating',   label: 'Top Rated',  icon: 'star-outline' },
  { key: 'price',    label: 'Lowest Fee', icon: 'pricetag-outline' },
] as const

const MAX_RECENT = 5

// ─── Result Card ──────────────────────────────────────────────────────────────
const ResultCard = React.memo(function ResultCard({ item, onPress, onFavorite, isFav }: {
  item: Academy; onPress: () => void; onFavorite: () => void; isFav: boolean
}) {
  const photo = item.photos?.[0]?.url
  const sport = item.programs?.[0]?.sportType ?? ''
  const minFee = useMemo(
    () => item.programs?.length ? Math.min(...item.programs.map((p: any) => p.feeMonthly)) : 0,
    [item.programs]
  )
  const sportColor = SportColors[sport] ?? Colors.primary

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* Thumbnail */}
      {photo ? (
        <Image source={{ uri: photo }} style={styles.cardImg} />
      ) : (
        <View style={[styles.cardImg, styles.cardImgPlaceholder, { backgroundColor: sportColor + '15' }]}>
          <Text style={styles.cardImgEmoji}>{SPORT_ICONS[sport] ?? '🏅'}</Text>
        </View>
      )}

      {/* Body */}
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          {item.isVerified && (
            <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
          )}
        </View>

        <View style={[styles.sportTag, { backgroundColor: sportColor + '15' }]}>
          <Text style={[styles.sportTagText, { color: sportColor }]}>
            {SPORT_ICONS[sport]} {sport}
          </Text>
        </View>

        <View style={styles.cardMeta}>
          <Ionicons name="star" size={11} color="#FBBF24" />
          <Text style={styles.metaText}>{item.rating}</Text>
          {item.distance !== undefined && (
            <>
              <View style={styles.metaDot} />
              <Ionicons name="location-outline" size={11} color={Colors.textMuted} />
              <Text style={styles.metaText}>{item.distance} km</Text>
            </>
          )}
          {item.transportAvailable && (
            <>
              <View style={styles.metaDot} />
              <Ionicons name="bus-outline" size={11} color={Colors.primary} />
              <Text style={[styles.metaText, { color: Colors.primary }]}>Transit</Text>
            </>
          )}
        </View>

        {minFee > 0 && (
          <Text style={styles.cardFee}>
            ₹{minFee}<Text style={styles.cardFeeSub}>/mo</Text>
          </Text>
        )}
      </View>

      {/* Right actions */}
      <View style={styles.cardRight}>
        <TouchableOpacity onPress={onFavorite} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={18} color={isFav ? '#EF4444' : Colors.border} />
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={16} color={Colors.border} style={{ marginTop: 8 }} />
      </View>
    </TouchableOpacity>
  )
})

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SearchScreen({ navigation }: any) {
  const { userLat, userLng } = useAuthStore()
  const { toggleFavorite, isFavorite } = useFavoritesStore()

  const [searchText,     setSearchText]     = useState('')
  const [debouncedText,  setDebouncedText]  = useState('')
  const [showFilters,    setShowFilters]    = useState(false)
  const [selectedSports, setSelectedSports] = useState<string[]>([])
  const [minRating,      setMinRating]      = useState(0)
  const [transportOnly,  setTransportOnly]  = useState(false)
  const [radiusKm,       setRadiusKm]       = useState(25)
  const [sortBy,         setSortBy]         = useState<'distance' | 'rating' | 'price'>('distance')
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const inputRef = useRef<TextInput>(null)

  // Debounce search text 300 ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedText(searchText), 300)
    return () => clearTimeout(t)
  }, [searchText])

  const activeFilters = selectedSports.length + (minRating > 0 ? 1 : 0) + (transportOnly ? 1 : 0) + (radiusKm !== 25 ? 1 : 0)

  const { data, isLoading } = useQuery({
    queryKey: ['search', userLat, userLng, debouncedText, selectedSports, minRating, transportOnly, radiusKm],
    queryFn:  () => academyAPI.list({
      lat:       userLat ?? undefined,
      lng:       userLng ?? undefined,
      search:    debouncedText || undefined,
      sport:     selectedSports.length === 1 ? selectedSports[0] : undefined,
      rating:    minRating > 0 ? minRating : undefined,
      transport: transportOnly || undefined,
      radius:    radiusKm > 0 ? radiusKm : 100,
    }),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: true,
  })

  // Only use real API data — no mock fallback in render
  const academies: Academy[] = useMemo(() => {
    const list: Academy[] = data?.data ?? []
    if (sortBy === 'rating') return [...list].sort((a, b) => b.rating - a.rating)
    if (sortBy === 'price') return [...list].sort((a, b) => {
      const aMin = Math.min(...(a.programs ?? [{ feeMonthly: 0 }]).map((p: any) => p.feeMonthly))
      const bMin = Math.min(...(b.programs ?? [{ feeMonthly: 0 }]).map((p: any) => p.feeMonthly))
      return aMin - bMin
    })
    return list
  }, [data, sortBy])

  function saveRecentSearch(text: string) {
    if (!text.trim()) return
    setRecentSearches((prev) => {
      const next = [text, ...prev.filter((s) => s !== text)].slice(0, MAX_RECENT)
      return next
    })
  }

  function handleSearchSubmit() {
    saveRecentSearch(searchText)
  }

  const toggleSport = useCallback((sport: string) => {
    setSelectedSports((prev) => prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport])
  }, [])

  const handleNavAcademy = useCallback((academy: Academy) => {
    saveRecentSearch(academy.name)
    navigation.navigate('AcademyDetail', { academy })
  }, [navigation])

  const handleFavorite = useCallback((academy: Academy) => {
    toggleFavorite(academy)
  }, [toggleFavorite])

  const renderItem = useCallback(({ item }: { item: Academy }) => (
    <ResultCard
      item={item}
      onPress={() => handleNavAcademy(item)}
      onFavorite={() => handleFavorite(item)}
      isFav={isFavorite(item.id)}
    />
  ), [handleNavAcademy, handleFavorite, isFavorite])

  const keyExtractor = useCallback((i: Academy) => i.id, [])

  const showEmpty = !isLoading && !debouncedText && academies.length === 0 && activeFilters === 0

  function clearAllFilters() {
    setSelectedSports([])
    setMinRating(0)
    setTransportOnly(false)
    setRadiusKm(25)
  }

  return (
    <View style={styles.container}>

      {/* ── Compact gradient header strip ─────────────────── */}
      <LinearGradient
        colors={['#0D9488', '#1E3A5F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
            <TextInput
              ref={inputRef}
              autoFocus
              placeholder="Academies, sports, locations…"
              placeholderTextColor={Colors.textMuted}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {!!searchText && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.filterBtn, activeFilters > 0 && styles.filterBtnActive]}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="options-outline" size={20} color={activeFilters > 0 ? '#fff' : 'rgba(255,255,255,0.9)'} />
            {activeFilters > 0 && (
              <View style={styles.filterDot}>
                <Text style={styles.filterDotText}>{activeFilters}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Sort pills */}
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.sortPill, sortBy === s.key && styles.sortPillActive]}
              onPress={() => setSortBy(s.key)}
            >
              <Ionicons name={s.icon} size={13} color={sortBy === s.key ? Colors.primary : 'rgba(255,255,255,0.7)'} />
              <Text style={[styles.sortText, sortBy === s.key && styles.sortTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* ── Recent searches (shown when input empty) ─────── */}
      {!searchText && recentSearches.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent</Text>
            <TouchableOpacity onPress={() => setRecentSearches([])}>
              <Text style={styles.recentClear}>Clear</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.recentChips}>
            {recentSearches.map((r) => (
              <TouchableOpacity
                key={r}
                style={styles.recentChip}
                onPress={() => setSearchText(r)}
              >
                <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.recentChipText}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Result count label */}
      {!isLoading && !!debouncedText && (
        <Text style={styles.resultCount}>{academies.length} academies found</Text>
      )}
      {!isLoading && !debouncedText && academies.length > 0 && (
        <Text style={styles.resultCount}>{academies.length} academies near you</Text>
      )}

      {/* ── Content area ─────────────────────────────────── */}
      {isLoading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(i) => String(i)}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={() => <SkeletonSearchCard />}
        />
      ) : showEmpty ? (
        /* Initial empty — no query yet */
        <View style={styles.emptyStart}>
          <Text style={styles.emptyStartEmoji}>🔍</Text>
          <Text style={styles.emptyStartTitle}>Find Your Sport</Text>
          <Text style={styles.emptyStartSub}>Search for academies, sports, or locations near you</Text>
        </View>
      ) : academies.length === 0 ? (
        /* API returned zero results */
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🏟️</Text>
          <Text style={styles.emptyTitle}>No academies found</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
          {activeFilters > 0 && (
            <TouchableOpacity style={styles.clearFiltersBtn} onPress={clearAllFilters}>
              <Text style={styles.clearFiltersText}>Clear all filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={academies}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          removeClippedSubviews
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={10}
        />
      )}

      {/* ── Filter Bottom Sheet ───────────────────────────── */}
      <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            {activeFilters > 0 && (
              <TouchableOpacity onPress={clearAllFilters}>
                <Text style={styles.clearText}>Clear all</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.filterLabel}>Distance Radius</Text>
          <View style={styles.ratingRow}>
            {DISTANCE_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d.value}
                style={[styles.ratingChip, radiusKm === d.value && styles.ratingChipActive]}
                onPress={() => setRadiusKm(d.value)}
              >
                {d.value > 0 && <Ionicons name="locate-outline" size={11} color={radiusKm === d.value ? '#fff' : Colors.primary} />}
                <Text style={[styles.ratingChipText, radiusKm === d.value && { color: '#fff' }]}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Sport Type</Text>
          <View style={styles.chipWrap}>
            {SPORT_TYPES.map((s) => {
              const c = SportColors[s] ?? Colors.primary
              const isActive = selectedSports.includes(s)
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.filterChip, isActive && { backgroundColor: c, borderColor: c }]}
                  onPress={() => toggleSport(s)}
                >
                  <Text style={styles.filterChipEmoji}>{SPORT_ICONS[s]}</Text>
                  <Text style={[styles.filterChipText, isActive && { color: '#fff' }]}>{s}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <Text style={styles.filterLabel}>Minimum Rating</Text>
          <View style={styles.ratingRow}>
            {RATING_OPTIONS.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.ratingChip, minRating === r.value && styles.ratingChipActive]}
                onPress={() => setMinRating(r.value)}
              >
                {r.value > 0 && <Ionicons name="star" size={11} color={minRating === r.value ? '#fff' : '#FBBF24'} />}
                <Text style={[styles.ratingChipText, minRating === r.value && { color: '#fff' }]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Transport Available</Text>
              <Text style={styles.toggleSub}>Only show academies with pickup & drop</Text>
            </View>
            <Switch
              value={transportOnly}
              onValueChange={setTransportOnly}
              trackColor={{ true: Colors.primary, false: Colors.border }}
              thumbColor="#fff"
            />
          </View>

          <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilters(false)}>
            <LinearGradient
              colors={['#0D9488', '#0A7A6B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.applyBtnGradient}
            >
              <Text style={styles.applyBtnText}>
                Show Results{activeFilters > 0 ? ` (${activeFilters} active)` : ''}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  /* ── Header ── */
  header: { paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 0,
  },
  searchInput:     { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary },
  filterBtn: {
    width: 46, height: 46, borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
  },
  filterBtnActive: { backgroundColor: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.5)' },
  filterDot: {
    position: 'absolute', top: -4, right: -4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.danger,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  filterDotText: { fontSize: 9, color: '#fff', fontWeight: FontWeight.bold },

  sortRow:        { flexDirection: 'row', gap: 8 },
  sortPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 7, borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
  },
  sortPillActive: { backgroundColor: Colors.surface, borderColor: Colors.surface },
  sortText:       { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.75)', fontWeight: FontWeight.semibold },
  sortTextActive: { color: Colors.primary },

  /* ── Recent Searches ── */
  recentSection: { backgroundColor: Colors.surface, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  recentHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  recentTitle:   { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  recentClear:   { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  recentChips:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recentChip:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.borderLight, borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 7 },
  recentChipText:{ fontSize: FontSize.sm, color: Colors.textSecondary },

  resultCount: { fontSize: FontSize.sm, color: Colors.textMuted, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },

  listContent: { padding: 16, gap: 12, paddingBottom: 32 },

  /* ── Empty States ── */
  emptyStart: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyStartEmoji: { fontSize: 56, marginBottom: 4 },
  emptyStartTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyStartSub:   { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  empty:           { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 60 },
  emptyEmoji:      { fontSize: 56, marginBottom: 4 },
  emptyTitle:      { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptySubtitle:   { fontSize: FontSize.base, color: Colors.textSecondary },
  clearFiltersBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.primary },
  clearFiltersText:{ fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },

  /* ── Result Card ── */
  card:             { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadow.sm },
  cardImg:          { width: 96, height: 96 },
  cardImgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardImgEmoji:     { fontSize: 30 },
  cardBody:         { flex: 1, padding: 12, gap: 4 },
  cardTop:          { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardName:         { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, flex: 1 },
  cardRight:        { paddingVertical: 12, paddingRight: 12, alignItems: 'center', justifyContent: 'space-between' },
  sportTag:         { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  sportTagText:     { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  cardMeta:         { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:         { fontSize: FontSize.xs, color: Colors.textSecondary },
  metaDot:          { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.textMuted },
  cardFee:          { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  cardFeeSub:       { fontSize: FontSize.xs, fontWeight: FontWeight.regular, color: Colors.textMuted },

  /* ── Filter Sheet ── */
  modal:        { flex: 1, backgroundColor: Colors.surface, paddingHorizontal: 20 },
  modalHandle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  modalHeader:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 8 },
  modalTitle:   { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, flex: 1 },
  clearText:    { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  closeBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' },

  filterLabel:     { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 10, marginTop: 16 },
  chipWrap:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  filterChipEmoji: { fontSize: 14 },
  filterChipText:  { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },

  ratingRow:        { flexDirection: 'row', gap: 8 },
  ratingChip:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 9, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  ratingChipActive: { backgroundColor: Colors.warning, borderColor: Colors.warning },
  ratingChipText:   { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.semibold },

  toggleRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  toggleLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  toggleSub:   { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  applyBtn:         { marginTop: 24, marginBottom: 8, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  applyBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  applyBtnText:     { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
})
