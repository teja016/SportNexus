import React, { useRef, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../store/authStore'
import { Colors, FontSize, FontWeight, BorderRadius } from '../../constants/theme'

const { width } = Dimensions.get('window')

const SLIDES = [
  {
    id: '1',
    icon: 'trophy-outline' as const,
    iconBg: Colors.primary,
    title: 'Find Your\nPerfect Academy',
    subtitle: 'Discover top-rated sports academies near you with verified coaches and world-class facilities.',
    bg: Colors.navy,
    accent: Colors.primary,
    bubbles: ['#0D9488', '#14B8A6', '#0A7A6B'],
  },
  {
    id: '2',
    icon: 'calendar-outline' as const,
    iconBg: '#6366F1',
    title: 'Enroll in\nSeconds',
    subtitle: 'Book your preferred training slots, choose duration, and confirm payment — all in one flow.',
    bg: '#1E1B4B',
    accent: '#6366F1',
    bubbles: ['#6366F1', '#818CF8', '#4F46E5'],
  },
  {
    id: '3',
    icon: 'navigate-outline' as const,
    iconBg: '#0EA5E9',
    title: 'Track Your\nCommute Live',
    subtitle: 'Real-time GPS tracking for your pickup vehicle so you\'re never late for training.',
    bg: '#0C1A2E',
    accent: '#0EA5E9',
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

            {/* Icon */}
            <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
              <View style={[styles.iconRing, { borderColor: item.iconBg + '40' }]} />
              <Ionicons name={item.icon} size={52} color="#fff" />
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

  iconWrap: {
    width: 120, height: 120, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4, shadowRadius: 30, elevation: 20,
  },
  iconRing: {
    position: 'absolute', width: 148, height: 148, borderRadius: 48,
    borderWidth: 2,
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
