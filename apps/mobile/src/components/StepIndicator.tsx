import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, FontSize, FontWeight, BorderRadius } from '../constants/theme'

interface Props {
  steps: string[]
  current: number  // 0-indexed
}

export default function StepIndicator({ steps, current }: Props) {
  return (
    <View style={styles.container}>
      {steps.map((label, idx) => {
        const done    = idx < current
        const active  = idx === current
        const last    = idx === steps.length - 1
        return (
          <React.Fragment key={label}>
            <View style={styles.step}>
              <View style={[
                styles.circle,
                done   && styles.circleDone,
                active && styles.circleActive,
              ]}>
                {done
                  ? <Ionicons name="checkmark" size={13} color="#fff" />
                  : <Text style={[styles.num, (done || active) && styles.numActive]}>{idx + 1}</Text>
                }
              </View>
              <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
            </View>
            {!last && (
              <View style={[styles.line, done && styles.lineDone]} />
            )}
          </React.Fragment>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
  },
  step: { alignItems: 'center', gap: 6 },
  circle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  circleDone:   { backgroundColor: Colors.primary },
  circleActive: { backgroundColor: Colors.primary },
  num:          { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textMuted },
  numActive:    { color: '#fff' },
  label:        { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  labelActive:  { color: Colors.primary, fontWeight: FontWeight.bold },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginTop: 15,
    marginHorizontal: 4,
  },
  lineDone: { backgroundColor: Colors.primary },
})
