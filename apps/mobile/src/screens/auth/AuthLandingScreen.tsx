import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native'
import { MotiView } from 'moti'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Colors, FontSize, FontWeight, BorderRadius } from '../../constants/theme'

export default function AuthLandingScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Full-page gradient background */}
      <LinearGradient
        colors={['#0D1B2A', '#1C2E4A', '#1AAFC9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      {/* Logo + Brand */}
      <MotiView
        from={{ opacity: 0, translateY: -30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 16, stiffness: 120, delay: 100 }}
        style={styles.brand}
      >
        <View style={styles.logoWrap}>
          <LinearGradient colors={['#1AAFC9', '#0A8FA8']} style={styles.logo}>
            <Text style={styles.logoText}>SN</Text>
          </LinearGradient>
        </View>
        <Text style={styles.appName}>SportNexus</Text>
        <Text style={styles.tagline}>Your gateway to sports excellence</Text>
      </MotiView>

      {/* Buttons */}
      <View style={styles.actions}>
        <MotiView
          from={{ opacity: 0, translateY: 40 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 300, damping: 18, stiffness: 140 }}
        >
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.88}>
            <Ionicons name="log-in-outline" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Sign In</Text>
            <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 40 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 420, damping: 18, stiffness: 140 }}
        >
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Register')} activeOpacity={0.88}>
            <Ionicons name="person-add-outline" size={20} color={Colors.primary} />
            <Text style={styles.secondaryBtnText}>Create Account</Text>
            <Ionicons name="arrow-forward" size={18} color="rgba(26,175,201,0.6)" />
          </TouchableOpacity>
        </MotiView>
      </View>

      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 600 }}
        style={styles.footer}
      >
        <Text style={styles.footerText}>By continuing you agree to our Terms & Privacy Policy</Text>
      </MotiView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },

  circle1: { position: 'absolute', top: -100, right: -60, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(26,175,201,0.08)' },
  circle2: { position: 'absolute', bottom: 80, left: -80, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.03)' },
  circle3: { position: 'absolute', top: '40%', right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(26,175,201,0.05)' },

  brand: { alignItems: 'center', marginBottom: 64, gap: 10 },
  logoWrap: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 20,
    marginBottom: 8,
  },
  logo: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 32, fontWeight: FontWeight.black, color: '#fff', letterSpacing: -1.5 },
  appName:  { fontSize: FontSize['3xl'], fontWeight: FontWeight.black, color: '#fff', letterSpacing: -1 },
  tagline:  { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.5 },

  actions: { width: '100%', gap: 14 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl, paddingVertical: 18, paddingHorizontal: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 14,
  },
  primaryBtnText: { flex: 1, marginLeft: 14, fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#fff' },

  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.xl, paddingVertical: 18, paddingHorizontal: 24,
    borderWidth: 1.5, borderColor: 'rgba(26,175,201,0.35)',
  },
  secondaryBtnText: { flex: 1, marginLeft: 14, fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#fff' },

  footer: { position: 'absolute', bottom: 36 },
  footerText: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.25)', textAlign: 'center' },
})
