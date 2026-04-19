import React, { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet } from 'react-native'
import { Colors, BorderRadius } from '../constants/theme'

function Shimmer({ style }: { style: any }) {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return <Animated.View style={[style, { opacity }]} />
}

export function SkeletonAcademyRow() {
  return (
    <View style={styles.rowCard}>
      <Shimmer style={styles.rowThumb} />
      <View style={styles.rowBody}>
        <Shimmer style={styles.line1} />
        <Shimmer style={styles.line2} />
        <Shimmer style={styles.line3} />
      </View>
    </View>
  )
}

export function SkeletonFeaturedCard() {
  return <Shimmer style={styles.featCard} />
}

export function SkeletonSearchCard() {
  return (
    <View style={styles.searchCard}>
      <Shimmer style={styles.searchImg} />
      <View style={styles.searchBody}>
        <Shimmer style={styles.sLine1} />
        <Shimmer style={styles.sLine2} />
        <Shimmer style={styles.sLine3} />
      </View>
    </View>
  )
}

const bg = Colors.border

const styles = StyleSheet.create({
  rowCard:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 12 },
  rowThumb: { width: 72, height: 72, borderRadius: BorderRadius.md, backgroundColor: bg },
  rowBody:  { flex: 1, gap: 8 },
  line1:    { height: 14, borderRadius: 7, backgroundColor: bg, width: '70%' },
  line2:    { height: 10, borderRadius: 5, backgroundColor: bg, width: '45%' },
  line3:    { height: 10, borderRadius: 5, backgroundColor: bg, width: '55%' },

  featCard: { width: 280, height: 220, borderRadius: BorderRadius.xl, backgroundColor: bg },

  searchCard: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  searchImg:  { width: 96, height: 96, backgroundColor: bg },
  searchBody: { flex: 1, padding: 12, gap: 8 },
  sLine1:     { height: 14, borderRadius: 7, backgroundColor: bg, width: '65%' },
  sLine2:     { height: 10, borderRadius: 5, backgroundColor: bg, width: '40%' },
  sLine3:     { height: 10, borderRadius: 5, backgroundColor: bg, width: '50%' },
})
