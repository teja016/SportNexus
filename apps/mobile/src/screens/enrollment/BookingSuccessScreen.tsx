import React, { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, Share, ScrollView } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { Ionicons } from '@expo/vector-icons'
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../../constants/theme'

export default function BookingSuccessScreen({ route, navigation }: any) {
  const { enrollmentId } = route.params ?? {}
  const bookingRef = (enrollmentId ?? 'UNKNOWN').slice(-8).toUpperCase()

  const checkScale   = useRef(new Animated.Value(0)).current
  const checkOpacity = useRef(new Animated.Value(0)).current
  const cardSlide    = useRef(new Animated.Value(40)).current
  const cardOpacity  = useRef(new Animated.Value(0)).current
  const ring1Scale   = useRef(new Animated.Value(1)).current
  const ring1Opacity = useRef(new Animated.Value(0.5)).current
  const ring2Scale   = useRef(new Animated.Value(1)).current
  const ring2Opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    // Check animation
    Animated.sequence([
      Animated.spring(checkScale, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
      Animated.timing(checkOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start()

    // Card slide up
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(cardSlide,   { toValue: 0,   duration: 500, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1,   duration: 500, useNativeDriver: true }),
      ]).start()
    }, 300)

    // Ripple rings
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ring1Scale,   { toValue: 1.8, duration: 1000, useNativeDriver: true }),
          Animated.timing(ring1Opacity, { toValue: 0,   duration: 1000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(ring1Scale,   { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(ring1Opacity, { toValue: 0.4, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start()
    Animated.loop(
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(ring2Scale,   { toValue: 1.8, duration: 1000, useNativeDriver: true }),
          Animated.timing(ring2Opacity, { toValue: 0,   duration: 1000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(ring2Scale,   { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(ring2Opacity, { toValue: 0.3, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start()
  }, [])

  async function handleShare() {
    await Share.share({
      message: `I just enrolled at a SportNexus academy! 🎉\nBooking ID: #${bookingRef}\nDownload SportNexus to book your spot!`,
    })
  }

  function handleDone() {
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Success Icon ─────────────────────────────────── */}
      <View style={styles.iconArea}>
        {/* Ripples */}
        <Animated.View style={[styles.ring, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} />
        <Animated.View style={[styles.ring, styles.ring2, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />

        <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}>
          <Ionicons name="checkmark" size={52} color="#fff" />
        </Animated.View>
      </View>

      {/* ── Title ─────────────────────────────────────────── */}
      <Animated.View style={{ alignItems: 'center', opacity: cardOpacity, transform: [{ translateY: cardSlide }] }}>
        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.subtitle}>Your enrollment is confirmed and payment received. See you at the academy!</Text>
      </Animated.View>

      {/* ── Booking Card ─────────────────────────────────── */}
      <Animated.View style={[styles.bookingCard, { opacity: cardOpacity, transform: [{ translateY: cardSlide }] }]}>
        {/* Dashed top */}
        <View style={styles.ticketTop}>
          <Text style={styles.ticketLabel}>BOOKING REFERENCE</Text>
          <Text style={styles.ticketRef}>#{bookingRef}</Text>
        </View>

        <View style={styles.ticketDivider}>
          <View style={styles.ticketDot} />
          <View style={styles.ticketLine} />
          <View style={styles.ticketDot} />
        </View>

        {/* QR section */}
        <View style={styles.qrSection}>
          <Text style={styles.qrLabel}>Show this QR at the academy entrance</Text>
          <View style={styles.qrWrap}>
            <QRCode
              value={`sportnexus://enrollment/${enrollmentId}`}
              size={140}
              color={Colors.navy}
              backgroundColor="#fff"
            />
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>CONFIRMED & PAID</Text>
          </View>
        </View>
      </Animated.View>

      {/* ── Actions ───────────────────────────────────────── */}
      <Animated.View style={[styles.actions, { opacity: cardOpacity, transform: [{ translateY: cardSlide }] }]}>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={18} color={Colors.primary} />
          <Text style={styles.shareBtnText}>Share Booking</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
          <Text style={styles.doneBtnText}>Done</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.Text style={[styles.hint, { opacity: cardOpacity }]}>
        You can view your enrollment in the My Enrollments tab
      </Animated.Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content:   { alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 48, gap: 24 },

  iconArea:   { alignItems: 'center', justifyContent: 'center', height: 140, width: 140 },
  ring:       { position: 'absolute', width: 110, height: 110, borderRadius: 55, borderWidth: 2, borderColor: Colors.accent },
  ring2:      { width: 140, height: 140, borderRadius: 70, borderColor: Colors.primary },
  checkCircle:{
    width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45, shadowRadius: 20, elevation: 16,
  },

  title:    { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.textPrimary, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginTop: 6, paddingHorizontal: 8 },

  bookingCard: {
    width: '100%', backgroundColor: Colors.surface, borderRadius: BorderRadius.xl,
    overflow: 'hidden', ...Shadow.md,
  },
  ticketTop:    { padding: 20, alignItems: 'center', gap: 4 },
  ticketLabel:  { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold, letterSpacing: 2 },
  ticketRef:    { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, color: Colors.textPrimary, letterSpacing: 3 },
  ticketDivider:{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  ticketDot:    { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.background },
  ticketLine:   { flex: 1, height: 1.5, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.border },

  qrSection:  { padding: 20, alignItems: 'center', gap: 12 },
  qrLabel:    { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  qrWrap:     { padding: 12, backgroundColor: '#fff', borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.borderLight },
  statusBadge:{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.tealXLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  statusDot:  { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.accent },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, color: Colors.primary, letterSpacing: 1 },

  actions:  { flexDirection: 'row', gap: 10, width: '100%' },
  shareBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: BorderRadius.lg,
    borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.tealXLight,
  },
  shareBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  doneBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  doneBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#fff' },

  hint: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
})
