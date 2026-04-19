import React, { useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../../constants/theme'

export default function AuthLandingScreen({ navigation }: any) {
  const fadeAnim  = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start()
  }, [])

  return (
    <View style={styles.container}>
      {/* Background decoration */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Logo area */}
      <Animated.View style={[styles.logoArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>SN</Text>
        </View>
        <Text style={styles.appName}>SportNexus</Text>
        <Text style={styles.tagline}>Your gateway to sports excellence</Text>
      </Animated.View>

      {/* Auth cards */}
      <Animated.View style={[styles.cardArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Sign In card */}
        <TouchableOpacity
          style={styles.signInCard}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.88}
        >
          <View style={styles.cardIconWrap}>
            <Ionicons name="log-in-outline" size={24} color={Colors.primary} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardSub}>Welcome back! Access your enrollments</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Create Account card */}
        <TouchableOpacity
          style={styles.signUpCard}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.88}
        >
          <View style={styles.cardIconWrapAlt}>
            <Ionicons name="person-add-outline" size={24} color="#fff" />
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: '#fff' }]}>Create Account</Text>
            <Text style={[styles.cardSub, { color: 'rgba(255,255,255,0.7)' }]}>New to SportNexus? Get started free</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.Text style={[styles.footerText, { opacity: fadeAnim }]}>
        By continuing you agree to our Terms & Privacy Policy
      </Animated.Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center', padding: 24 },

  bgCircle1: { position: 'absolute', top: -80,  right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(13,148,136,0.15)' },
  bgCircle2: { position: 'absolute', bottom: 60, left: -80,  width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(30,58,95,0.6)' },

  logoArea: { alignItems: 'center', marginBottom: 56 },
  logoBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5, shadowRadius: 24, elevation: 16,
    marginBottom: 16,
  },
  logoText: { fontSize: 28, fontWeight: FontWeight.black, color: '#fff', letterSpacing: -1 },
  appName:  { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: '#fff', letterSpacing: -0.5 },
  tagline:  { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.5)', marginTop: 6, letterSpacing: 0.3 },

  cardArea: { width: '100%', gap: 0 },

  signInCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl,
    padding: 18, ...Shadow.md,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  cardIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.tealXLight,
    alignItems: 'center', justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  cardSub:   { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 14 },
  dividerLine:{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  dividerText:{ fontSize: FontSize.sm, color: 'rgba(255,255,255,0.4)', fontWeight: FontWeight.medium },

  signUpCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xl,
    padding: 18,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 12,
  },
  cardIconWrapAlt: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  footerText: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.3)', marginTop: 40, textAlign: 'center' },
})
