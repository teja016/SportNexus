import React, { useEffect, useRef } from 'react'
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native'
import { Colors, FontSize, FontWeight } from '../../constants/theme'

const { width } = Dimensions.get('window')

export default function SplashScreen({ navigation }: any) {
  const logoScale    = useRef(new Animated.Value(0.6)).current
  const logoOpacity  = useRef(new Animated.Value(0)).current
  const textOpacity  = useRef(new Animated.Value(0)).current
  const tagOpacity   = useRef(new Animated.Value(0)).current
  const ring1Scale   = useRef(new Animated.Value(0.8)).current
  const ring1Opacity = useRef(new Animated.Value(0.6)).current
  const ring2Scale   = useRef(new Animated.Value(0.8)).current
  const ring2Opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale,  { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ring1Scale,   { toValue: 1.6, duration: 1200, useNativeDriver: true }),
            Animated.timing(ring1Opacity, { toValue: 0,   duration: 1200, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(ring1Scale,   { toValue: 0.8, duration: 0, useNativeDriver: true }),
            Animated.timing(ring1Opacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.delay(400),
          Animated.parallel([
            Animated.timing(ring2Scale,   { toValue: 1.6, duration: 1200, useNativeDriver: true }),
            Animated.timing(ring2Opacity, { toValue: 0,   duration: 1200, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(ring2Scale,   { toValue: 0.8, duration: 0, useNativeDriver: true }),
            Animated.timing(ring2Opacity, { toValue: 0.3, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ),
    ]).start()

    const t1 = setTimeout(() => Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start(), 400)
    const t2 = setTimeout(() => Animated.timing(tagOpacity,  { toValue: 1, duration: 400, useNativeDriver: true }).start(), 700)
    const t3 = setTimeout(() => navigation.replace('Onboarding'), 2600)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <View style={styles.container}>
      {/* Decorative circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Ripple rings */}
      <Animated.View style={[styles.ring, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} />
      <Animated.View style={[styles.ring, styles.ring2, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
        <Text style={styles.logoText}>SN</Text>
      </Animated.View>

      <Animated.Text style={[styles.appName, { opacity: textOpacity }]}>SportNexus</Animated.Text>
      <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
        DISCOVER  ·  ENROLL  ·  TRAIN
      </Animated.Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  bgCircle1: {
    position: 'absolute', top: -80, right: -60,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: Colors.primary, opacity: 0.15,
  },
  bgCircle2: {
    position: 'absolute', bottom: -100, left: -80,
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: Colors.primaryLight, opacity: 0.08,
  },
  ring: {
    position: 'absolute',
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 2, borderColor: Colors.primaryLight,
  },
  ring2: { width: 180, height: 180, borderRadius: 90 },
  logoWrap: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5, shadowRadius: 24, elevation: 16,
  },
  logoText: { fontSize: 32, fontWeight: FontWeight.black, color: '#fff', letterSpacing: -1 },
  appName:  { fontSize: FontSize['3xl'], fontWeight: FontWeight.black, color: '#fff', letterSpacing: -0.5 },
  tagline:  { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.45)', letterSpacing: 3, fontWeight: FontWeight.semibold },
})
