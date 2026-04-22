import React, { useRef, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native'
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
    glow: '#0D9488',
    bubbles: ['#0D9488', '#14B8A6', '#0A7A6B'],
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
    subtitle: 'Real-time GPS tracking for your pickup vehicle so you\'re never late for training.',
    bg: '#0C1A2E',
    accent: '#0EA5E9',
    glow: '#0EA5E9',
    bubbles: ['#0EA5E9', '#38BDF8', '#0284C7'],
  },
]

export default function OnboardingScreen({ navigation }: any) {
  const [activeIndex, setActiveIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)
  const slideAnim   = useRef(new Animated.Value(0)).current
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
    <View style={[styles.container, { backgroundColor: current.bg }]}>
      {/* Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        onMomentumScrollEnd={(e) => {
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { backgroundColor: item.bg }]}>
            {/* Decorative bubbles */}
            <View style={[styles.bubble, styles.bubble1, { backgroundColor: item.bubbles[0] + '30' }]} />
            <View style={[styles.bubble, styles.bubble2, { backgroundColor: item.bubbles[1] + '20' }]} />
            <View style={[styles.bubble, styles.bubble3, { backgroundColor: item.bubbles[2] + '15' }]} />

            {/* Floating emoji decorations */}
            {item.emojiArt.map((e: string, i: number) => {
              const positions = [
                { top: 80,  left: 24 },  { top: 110, right: 30 },
                { top: 200, left: 14 },  { top: 240, right: 20 },
                { top: 320, left: 40 },  { top: 300, right: 10 },
              ]
              const pos = positions[i] ?? { top: 100, left: 20 }
              return (
                <Text key={i} style={{ position: 'absolute', fontSize: 28, opacity: 0.2, ...pos } as any}>{e}</Text>
              )
            })}

            {/* Hero emoji with glow */}
            <View style={styles.iconArea}>
              <View style={[styles.glowRing, { borderColor: item.glow + '35' }]} />
              <View style={[styles.glowRing, styles.glowRing2, { borderColor: item.glow + '20' }]} />
              <LinearGradient
                colors={[item.glow, item.glow + 'AA']}
                style={[styles.iconWrap, { shadowColor: item.glow }]}
              >
                <Text style={{ fontSize: 56 }}>{item.emoji}</Text>
              </LinearGradient>
            </View>

            {/* Text */}
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Footer */}
      <View style={styles.footer}>
        {/* Dots */}
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

        {/* Next / Get Started */}
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: current.accent }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextText}>
            {activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
          <Ionicons
            name={activeIndex === SLIDES.length - 1 ? 'checkmark-circle' : 'arrow-forward'}
            size={20} color="#fff"
          />
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
  container: { flex: 1 },
  skipBtn: {
    position: 'absolute', top: 56, right: 24, zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.full,
  },
  skipText: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  slide: {
    width, flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 36, paddingTop: 60, paddingBottom: 20, gap: 24,
  },
  bubble:  { position: 'absolute', borderRadius: 999 },
  bubble1: { width: 220, height: 220, top: -40, right: -60 },
  bubble2: { width: 180, height: 180, bottom: 80, left: -50 },
  bubble3: { width: 120, height: 120, top: '40%', right: -20 },

  iconArea:   { alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  glowRing:   { position: 'absolute', width: 168, height: 168, borderRadius: 56, borderWidth: 1.5 },
  glowRing2:  { width: 200, height: 200, borderRadius: 68 },
  iconWrap: {
    width: 128, height: 128, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.55, shadowRadius: 36, elevation: 24,
  },

  title: {
    fontSize: FontSize['3xl'], fontWeight: FontWeight.black, color: '#fff',
    textAlign: 'center', lineHeight: 40, letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.base, color: 'rgba(255,255,255,0.70)',
    textAlign: 'center', lineHeight: 24,
  },

  footer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingTop: 24, paddingBottom: 40, paddingHorizontal: 24,
    gap: 16, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { width: 28, borderRadius: 4 },

  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 16, paddingHorizontal: 36,
    borderRadius: BorderRadius.full, width: '100%', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 8,
  },
  nextText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  skipFooter: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.45)', textDecorationLine: 'underline' },
})
