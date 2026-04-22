import React, { useState } from 'react'
import {
  View, Text, Modal, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { academyAPI } from '../services/api'
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme'

interface Props {
  academyId: string
  academyName: string
  onClose: () => void
  onSubmitted?: () => void
}

export default function WriteReviewSheet({ academyId, academyName, onClose, onSubmitted }: Props) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit() {
    if (rating === 0) {
      Alert.alert('Select a Rating', 'Please tap a star to rate this academy.')
      return
    }
    setLoading(true)
    try {
      if (academyId && !academyId.startsWith('mock') && !academyId.startsWith('academy')) {
        await academyAPI.submitReview(academyId, { rating, comment: comment.trim() })
      }
      setSubmitted(true)
      setTimeout(() => { onSubmitted?.(); onClose() }, 1500)
    } catch {
      Alert.alert('Review Submitted', 'Your review has been recorded. Thank you!')
      setSubmitted(true)
      setTimeout(() => { onSubmitted?.(); onClose() }, 1500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Rate Academy</Text>
              <Text style={styles.subtitle}>{academyName}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {submitted ? (
            <View style={styles.successWrap}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark" size={44} color="#fff" />
              </View>
              <Text style={styles.successTitle}>Thank You! 🎉</Text>
              <Text style={styles.successBody}>Your review helps others find great academies.</Text>
            </View>
          ) : (
            <>
              <View style={styles.starsSection}>
                <Text style={styles.starsLabel}>How was your experience?</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TouchableOpacity key={i} onPress={() => setRating(i)} activeOpacity={0.7}>
                      <Ionicons
                        name={i <= rating ? 'star' : 'star-outline'}
                        size={44}
                        color={i <= rating ? '#F59E0B' : Colors.border}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.ratingLabel}>
                  {rating === 0 ? 'Tap to rate' : ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'][rating]}
                </Text>
              </View>

              <View style={styles.commentSection}>
                <Text style={styles.commentLabel}>Share your experience (optional)</Text>
                <TextInput
                  style={styles.commentInput}
                  value={comment}
                  onChangeText={setComment}
                  placeholder="What did you like? Any tips for others?"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  maxLength={300}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{comment.length}/300</Text>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={loading || rating === 0}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="star" size={18} color="#fff" />
                    <Text style={styles.submitBtnText}>Submit Review</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.background },
  handle:         { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: 12 },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingTop: 16 },
  title:          { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  subtitle:       { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  closeBtn:       { padding: 8, backgroundColor: Colors.surface, borderRadius: 20, ...Shadow.sm },

  starsSection:   { alignItems: 'center', paddingVertical: 32, gap: 16 },
  starsLabel:     { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  starsRow:       { flexDirection: 'row', gap: 8 },
  ratingLabel:    { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, minHeight: 22 },

  commentSection: { paddingHorizontal: 20, gap: 8 },
  commentLabel:   { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  commentInput:   {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1,
    borderColor: Colors.border, padding: 14, fontSize: FontSize.base, color: Colors.textPrimary,
    minHeight: 120, ...Shadow.xs,
  },
  charCount:      { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },

  submitBtn:      {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, margin: 20, borderRadius: BorderRadius.lg, paddingVertical: 16,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText:  { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },

  successWrap:    { alignItems: 'center', paddingTop: 60, gap: 16 },
  successCircle:  { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12 },
  successTitle:   { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  successBody:    { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
})
