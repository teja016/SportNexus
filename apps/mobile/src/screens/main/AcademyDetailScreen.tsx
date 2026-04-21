import React, { useState, useRef, useCallback } from 'react'
import {
  View, Text, ScrollView, FlatList, Image, TouchableOpacity,
  Linking, StyleSheet, Dimensions, ActivityIndicator, Animated,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { academyAPI } from '../../services/api'
import { useEnrollmentStore } from '../../store/enrollmentStore'
import { useFavoritesStore } from '../../store/favoritesStore'
import { SPORT_ICONS, formatCurrency } from '@sportnexus/utils'
import { Academy, Coach, SportProgram } from '@sportnexus/types'
import { Colors, FontSize, FontWeight, BorderRadius, Shadow, SportColors } from '../../constants/theme'
import CoachDetailModal from '../../components/CoachDetailModal'
import { MOCK_COACHES } from '../../constants/mockData'

const { width } = Dimensions.get('window')
const PHOTO_HEIGHT = 300

export default function AcademyDetailScreen({ route, navigation }: any) {
  const initialAcademy: Academy = route.params?.academy
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null)
  const [photoIndex, setPhotoIndex] = useState(0)
  const scrollY = useRef(new Animated.Value(0)).current
  const { setAcademy } = useEnrollmentStore()
  const { toggleFavorite } = useFavoritesStore()
  const fav = useFavoritesStore((s) => s.favorites.some((a) => a.id === initialAcademy.id))

  const { data, isLoading } = useQuery({
    queryKey: ['academy', initialAcademy.id],
    queryFn:  () => academyAPI.getById(initialAcademy.id),
    placeholderData: initialAcademy,
    staleTime: 0,
  })

  const academy: Academy = data ?? initialAcademy

  const headerOpacity = scrollY.interpolate({
    inputRange: [PHOTO_HEIGHT - 80, PHOTO_HEIGHT - 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  })

  function openDirections() {
    const query = encodeURIComponent(`${academy.name}, ${academy.address}, ${academy.city}`)
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`)
  }

  function handleViewSlots(program: SportProgram) {
    setAcademy(academy)
    navigation.navigate('Slots', { program, academy })
  }

  if (isLoading && !academy.programs) {
    return <View style={styles.loading}><ActivityIndicator color={Colors.primary} size="large" /></View>
  }

  const photos  = academy.photos?.length
    ? academy.photos
    : [{ url: 'https://images.unsplash.com/photo-1546519638492-4827eff40467?w=800' }]
  const coaches  = (academy.coaches?.length ? academy.coaches : MOCK_COACHES.slice(0, 3))
  const programs = academy.programs ?? []
  const sport    = programs[0]?.sportType ?? ''
  const sportColor = SportColors[sport] ?? Colors.primary

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Sticky nav bar (appears on scroll) */}
      <Animated.View style={[styles.navBar, { opacity: headerOpacity }]}>
        <Text style={styles.navTitle} numberOfLines={1}>{academy.name}</Text>
      </Animated.View>

      {/* Back button (always visible) */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
      </TouchableOpacity>

      {/* Favorite button */}
      <TouchableOpacity style={styles.favBtn} onPress={() => toggleFavorite(academy)}>
        <Ionicons name={fav ? 'heart' : 'heart-outline'} size={20} color={fav ? '#EF4444' : Colors.textPrimary} />
      </TouchableOpacity>

      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        {/* ── Photo Carousel ───────────────────────────────── */}
        <View style={{ height: PHOTO_HEIGHT, backgroundColor: Colors.navy }}>
          <FlatList
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            data={photos}
            keyExtractor={(_, i) => String(i)}
            style={{ height: PHOTO_HEIGHT }}
            onMomentumScrollEnd={(e) => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => (
              <Image source={{ uri: (item as any).url }} style={{ width, height: PHOTO_HEIGHT }} resizeMode="cover" />
            )}
          />
          {/* Gradient overlay */}
          <View style={styles.photoGradient} />

          {/* Photo counter */}
          {photos.length > 1 && (
            <View style={styles.photoCounter}>
              <Ionicons name="camera-outline" size={12} color="#fff" />
              <Text style={styles.photoCountText}>{photoIndex + 1}/{photos.length}</Text>
            </View>
          )}

          {/* Dot indicators */}
          {photos.length > 1 && (
            <View style={styles.photoDots}>
              {photos.map((_, i) => (
                <View key={i} style={[styles.photoDot, i === photoIndex && styles.photoDotActive]} />
              ))}
            </View>
          )}
        </View>

        {/* ── Info Card ────────────────────────────────────── */}
        <View style={styles.infoCard}>
          {/* Title row */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.academyName}>{academy.name}</Text>
              <View style={styles.ratingRow}>
                {[1,2,3,4,5].map((i) => (
                  <Ionicons
                    key={i} name={i <= Math.round(academy.rating) ? 'star' : 'star-outline'}
                    size={14} color="#FBBF24"
                  />
                ))}
                <Text style={styles.ratingText}>{academy.rating}</Text>
                <Text style={styles.reviewCount}>({academy.reviewCount} reviews)</Text>
              </View>
            </View>
            {academy.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          {/* Sport tags */}
          <View style={styles.tagsRow}>
            {programs.slice(0, 3).map((p) => {
              const c = SportColors[p.sportType] ?? Colors.primary
              return (
                <View key={p.id} style={[styles.sportTag, { backgroundColor: c + '15' }]}>
                  <Text style={{ fontSize: 12 }}>{SPORT_ICONS[p.sportType] ?? '🏅'}</Text>
                  <Text style={[styles.sportTagText, { color: c }]}>{p.sportType}</Text>
                </View>
              )
            })}
            {academy.transportAvailable && (
              <View style={[styles.sportTag, { backgroundColor: Colors.tealXLight }]}>
                <Ionicons name="bus-outline" size={12} color={Colors.primary} />
                <Text style={[styles.sportTagText, { color: Colors.primary }]}>Transport</Text>
              </View>
            )}
          </View>

          {/* Address */}
          <TouchableOpacity style={styles.addressRow} onPress={openDirections}>
            <View style={styles.addressIcon}>
              <Ionicons name="location" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.addressText} numberOfLines={2}>{academy.address}</Text>
            <View style={styles.directionsBtn}>
              <Ionicons name="navigate-outline" size={14} color={Colors.primary} />
              <Text style={styles.directionsBtnText}>Directions</Text>
            </View>
          </TouchableOpacity>

          {/* Description */}
          {!!academy.description && (
            <Text style={styles.description}>{academy.description}</Text>
          )}
        </View>

        {/* ── Coaches ──────────────────────────────────────── */}
        {coaches.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our Coaches</Text>
            <FlatList
              horizontal showsHorizontalScrollIndicator={false}
              data={coaches}
              keyExtractor={(c) => c.id}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.coachCard} onPress={() => setSelectedCoach(item)} activeOpacity={0.85}>
                  <View style={styles.coachPhotoWrap}>
                    <Image source={{ uri: item.photo ?? `https://i.pravatar.cc/80?u=${item.id}` }} style={styles.coachPhoto} />
                    <View style={[styles.coachExpBadge, { backgroundColor: sportColor }]}>
                      <Text style={styles.coachExpText}>{item.experienceYears}y</Text>
                    </View>
                  </View>
                  <Text style={styles.coachName} numberOfLines={1}>{item.name.split(' ')[0]}</Text>
                  <Text style={styles.coachRole} numberOfLines={1}>{item.sportTags[0] ?? 'Coach'}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* ── Programs ─────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Programs</Text>
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            {programs.map((prog) => {
              const c = SportColors[prog.sportType] ?? Colors.primary
              return (
                <View key={prog.id} style={styles.programCard}>
                  <View style={[styles.programAccent, { backgroundColor: c }]} />
                  <View style={styles.programIcon}>
                    <Text style={{ fontSize: 22 }}>{SPORT_ICONS[prog.sportType] ?? '🏅'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.programName}>{prog.name}</Text>
                    <Text style={styles.programMeta}>
                      Ages {prog.ageGroupMin}–{prog.ageGroupMax} yrs
                    </Text>
                  </View>
                  <View style={styles.programRight}>
                    <Text style={styles.programFee}>{formatCurrency(prog.feeMonthly)}</Text>
                    <Text style={styles.programFeeSub}>/month</Text>
                    <TouchableOpacity style={[styles.slotsBtn, { backgroundColor: c }]} onPress={() => handleViewSlots(prog)}>
                      <Text style={styles.slotsBtnText}>View Slots</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })}
          </View>
        </View>
      </Animated.ScrollView>

      {selectedCoach && (
        <CoachDetailModal coach={selectedCoach} onClose={() => setSelectedCoach(null)} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  navBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    backgroundColor: Colors.surface, paddingTop: 50, paddingBottom: 12,
    paddingHorizontal: 60, alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    ...Shadow.sm,
  },
  navTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  backBtn: {
    position: 'absolute', top: 52, left: 16, zIndex: 30,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  favBtn: {
    position: 'absolute', top: 52, right: 16, zIndex: 30,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },

  photoGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
    backgroundColor: 'transparent',
  },
  photoCounter: {
    position: 'absolute', top: 56, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  photoCountText: { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.semibold },
  photoDots: { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 5 },
  photoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  photoDotActive: { width: 18, backgroundColor: '#fff' },

  infoCard: {
    backgroundColor: Colors.surface, marginHorizontal: 16,
    marginTop: -20, borderRadius: BorderRadius.xl,
    padding: 18, gap: 14, ...Shadow.md,
  },
  titleRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  academyName: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, letterSpacing: -0.5 },
  ratingRow:   { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  ratingText:  { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginLeft: 4 },
  reviewCount: { fontSize: FontSize.sm, color: Colors.textMuted },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.tealXLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full },
  verifiedText:  { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.bold },

  tagsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sportTag:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full },
  sportTagText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },

  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.borderLight, borderRadius: BorderRadius.md, padding: 12 },
  addressIcon:{ width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.tealXLight, alignItems: 'center', justifyContent: 'center' },
  addressText:{ flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 18 },
  directionsBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  directionsBtnText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },

  description: { fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 22 },

  section:      { marginTop: 24 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, paddingHorizontal: 16, marginBottom: 14 },

  coachCard:     { alignItems: 'center', width: 86, gap: 6 },
  coachPhotoWrap:{ position: 'relative' },
  coachPhoto:    { width: 70, height: 70, borderRadius: 35, borderWidth: 2.5, borderColor: Colors.surface },
  coachExpBadge: { position: 'absolute', bottom: -2, right: -2, paddingHorizontal: 5, paddingVertical: 2, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: '#fff' },
  coachExpText:  { fontSize: 9, color: '#fff', fontWeight: FontWeight.extrabold },
  coachName:     { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.bold, textAlign: 'center' },
  coachRole:     { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },

  programCard:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 14, ...Shadow.sm, overflow: 'hidden' },
  programAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderRadius: 4 },
  programIcon:   { width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  programName:   { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  programMeta:   { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 3 },
  programRight:  { alignItems: 'flex-end', gap: 2 },
  programFee:    { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  programFeeSub: { fontSize: FontSize.xs, color: Colors.textMuted },
  slotsBtn:      { marginTop: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: BorderRadius.md },
  slotsBtnText:  { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.bold },
})
