import React, { useRef, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { MotiView } from 'moti'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../store/authStore'
import { Colors, FontSize, FontWeight, BorderRadius } from '../../constants/theme'

const { width } = Dimensions.get('window')

const SLIDES = [
  {
    id: '1',
    emoji: '🏆',
    emojiArt: ['🏏', '⚽', '🎾', '🏊', '🏀', '🥊'],
    title: 'Find Your\nPerfect Academy',
    subtitle: 'Discover top-rated sports academies near you with verified coaches and world-class facilities.',
    bg: Colors.navy,
    accent: Colors.primary,
    glow: '#1AAFC9',
    bubbles: ['#1AAFC9', '#29C5DA', '#1592AA'],
  },
  {
    id: '2',
    emoji: '⚡',
    emojiArt: ['📅', '💳', '✅', '🎯', '🔥', '💪'],
    title: 'Enroll in\nSeconds',
    subtitle: 'Book your preferred training slots, choose duration, and confirm payment — all in one flow.',
    bg: '#1E1B4B',
    accent: '#6366F1',
    glow: '#6366F1',
    bubbles: ['#6366F1', '#818CF8', '#4F46E5'],
  },
  {
    id: '3',
    emoji: '📍',
    emojiArt: ['🚌', '📡', '🛣️', '🗺️', '⏱️', '🔔'],
    title: 'Track Your\nCommute Live',
    subtitle: "Real-time GPS tracking for your pickup vehicle so you're never late for training.",
    bg: '#0C1A2E',
    accent: '#0EA5E9',
    glow: '#0EA5E9',
    bubbles: ['#0EA5E9', '#38BDF8', '#0284C7'],
  },
]

export default function OnboardingScreen({ navigation }: any) {
  const [activeIndex, setActiveIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)
  const { setOnboarded } = useAuthStore()

  function handleNext() {
    if (activeIndex < SLIDES.length - 1) {
      const next = activeIndex + 1
      flatListRef.current?.scrollToOffset({ offset: next * width, animated: true })
      setActiveIndex(next)
    } else {
      setOnboarded()
      navigation.replace('Register')
    }
  }

  function handleSkip() {
    setOnboarded()
    navigation.replace('Register')
  }

  const current = SLIDES[activeIndex]

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        onMomentumScrollEnd={(e) => {
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {item.emojiArt.map((e: string, i: number) => {
              const positions = [
                { top: 90,  left: 20 },  { top: 120, right: 24 },
                { top: 210, left: 10 },  { top: 250, right: 18 },
                { top: 330, left: 36 },  { top: 310, right: 8 },
              ]
              const pos = positions[i] ?? { top: 100, left: 20 }
              return (
                <Text key={i} style={{ position: 'absolute', fontSize: 30, opacity: 0.08, color: '#000', ...pos } as any}>{e}</Text>
              )
            })}

            <MotiView
              from={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 140 }}
              style={styles.iconArea}
            >
              <View style={[styles.glowRing, { borderColor: item.glow + '28' }]} />
              <View style={[styles.glowRing, styles.glowRing2, { borderColor: item.glow + '16' }]} />
              <LinearGradient
                colors={[item.glow, item.glow + 'CC']}
                style={[styles.iconWrap, { shadowColor: item.glow }]}
              >
                <Text style={{ fontSize: 52 }}>{item.emoji}</Text>
              </LinearGradient>
            </MotiView>

            <MotiView from={{ opacity: 0, translateY: 24 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', delay: 150, damping: 18, stiffness: 150 }}>
              <Text style={styles.title}>{item.title}</Text>
            </MotiView>
            <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', delay: 260, duration: 400 }}>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </MotiView>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex && [styles.dotActive, { backgroundColor: current.accent }],
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.nextBtnWrap}
          onPress={handleNext}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={[current.accent, current.glow]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextBtn}
          >
            <Text style={styles.nextText}>
              {activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
            </Text>
            <Ionicons
              name={activeIndex === SLIDES.length - 1 ? 'checkmark-circle' : 'arrow-forward'}
              size={20}
              color="#fff"
            />
          </LinearGradient>
        </TouchableOpacity>

        {activeIndex < SLIDES.length - 1 && (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipFooter}>I'll explore on my own</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  skipBtn: {
    position: 'absolute', top: 56, right: 24, zIndex: 10,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  skipText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  slide: {
    width, flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 36, paddingTop: 60, paddingBottom: 20, gap: 24,
  },

  iconArea:  { alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  glowRing:  { position: 'absolute', width: 168, height: 168, borderRadius: 84, borderWidth: 1.5 },
  glowRing2: { width: 204, height: 204, borderRadius: 102 },
  iconWrap:  {
    width: 128, height: 128, borderRadius: 64,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35, shadowRadius: 28, elevation: 20,
  },

  title: {
    fontSize: FontSize['3xl'], fontWeight: FontWeight.black, color: Colors.textPrimary,
    textAlign: 'center', lineHeight: 40, letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.base, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 24,
  },

  footer: {
    backgroundColor: Colors.background,
    paddingTop: 24, paddingBottom: 40, paddingHorizontal: 24,
    gap: 16, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  dots:      { flexDirection: 'row', gap: 8 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.borderLight },
  dotActive: { width: 28, borderRadius: 4 },

  nextBtnWrap: {
    width: '100%', borderRadius: BorderRadius.full, overflow: 'hidden',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 8,
  },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16,
  },
  nextText:   { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  skipFooter: { fontSize: FontSize.sm, color: Colors.textMuted, textDecorationLine: 'underline' },
})
