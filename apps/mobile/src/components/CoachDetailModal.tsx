import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Coach } from '@sportnexus/types'
import { SPORT_ICONS } from '@sportnexus/utils'
import { Colors, FontSize, BorderRadius, Shadow } from '../constants/theme'

interface Props {
  coach: Coach
  onClose: () => void
}

export default function CoachDetailModal({ coach, onClose }: Props) {
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Close */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 8 }}>
          {/* Avatar + Name */}
          <View style={styles.header}>
            <Image
              source={{ uri: coach.photo ?? 'https://i.pravatar.cc/120' }}
              style={styles.photo}
            />
            <Text style={styles.name}>{coach.name}</Text>
            <Text style={styles.experience}>{coach.experienceYears} years experience</Text>

            {/* Sport Tags */}
            {coach.sportTags && coach.sportTags.length > 0 && (
              <View style={styles.tagsRow}>
                {coach.sportTags.map((sport) => (
                  <View key={sport} style={styles.tag}>
                    <Text>{SPORT_ICONS[sport] ?? '🏅'}</Text>
                    <Text style={styles.tagText}>{sport}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Bio */}
          {coach.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bio}>{coach.bio}</Text>
            </View>
          )}

          {/* Certifications */}
          {coach.certifications && coach.certifications.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Certifications</Text>
              {coach.certifications.map((cert, i) => (
                <View key={i} style={styles.certRow}>
                  <Ionicons name="ribbon-outline" size={16} color={Colors.accent} />
                  <Text style={styles.certText}>{cert}</Text>
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  handle:       { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: 12 },
  closeBtn:     { position: 'absolute', top: 16, right: 16, padding: 8, backgroundColor: Colors.surface, borderRadius: 20, ...Shadow.sm, zIndex: 10 },
  header:       { alignItems: 'center', gap: 8, marginBottom: 24, marginTop: 16 },
  photo:        { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.tealLight },
  name:         { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  experience:   { fontSize: FontSize.base, color: Colors.primary, fontWeight: '600' },
  tagsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 },
  tag:          { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.tealLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  tagText:      { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  bio:          { fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 22 },
  certRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  certText:     { fontSize: FontSize.base, color: Colors.textSecondary },
  callBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 14, marginTop: 8 },
  callBtnText:  { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
})
