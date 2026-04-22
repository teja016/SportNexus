import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme'
import WriteReviewSheet from './WriteReviewSheet'

interface Review {
  id: string
  authorName: string
  rating: number
  comment: string
  date: string
}

interface Props {
  reviews: Review[]
  academyName: string
  academyId?: string
  overallRating: number
  onClose: () => void
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color={i <= Math.round(rating) ? '#F59E0B' : Colors.border}
        />
      ))}
    </View>
  )
}

export default function ReviewsModal({ reviews, academyName, academyId, overallRating, onClose }: Props) {
  const [showWrite, setShowWrite] = useState(false)
  const initials = (name: string) => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Reviews</Text>
            <Text style={styles.subtitle}>{academyName}</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Rating Summary */}
        <View style={styles.ratingSummary}>
          <Text style={styles.ratingBig}>{overallRating.toFixed(1)}</Text>
          <View style={{ flex: 1 }}>
            <StarRating rating={overallRating} size={20} />
            <Text style={styles.reviewCount}>{reviews.length} reviews</Text>
          </View>
          <TouchableOpacity style={styles.writeBtn} onPress={() => setShowWrite(true)}>
            <Ionicons name="pencil-outline" size={14} color={Colors.primary} />
            <Text style={styles.writeBtnText}>Write Review</Text>
          </TouchableOpacity>
        </View>

        {showWrite && (
          <WriteReviewSheet
            academyId={academyId ?? ''}
            academyName={academyName}
            onClose={() => setShowWrite(false)}
          />
        )}

        <FlatList
          data={reviews}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 40 }}>💬</Text>
              <Text style={styles.emptyText}>No reviews yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(item.authorName)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.authorName}>{item.authorName}</Text>
                  <View style={styles.ratingRow}>
                    <StarRating rating={item.rating} />
                    <Text style={styles.date}>{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                  </View>
                </View>
              </View>
              {item.comment && <Text style={styles.comment}>{item.comment}</Text>}
            </View>
          )}
        />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.background },
  handle:         { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: 12 },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingTop: 16 },
  title:          { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle:       { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  closeBtn:       { padding: 8, backgroundColor: Colors.surface, borderRadius: 20, ...Shadow.sm },
  ratingSummary:  { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  ratingBig:      { fontSize: 48, fontWeight: '800', color: Colors.textPrimary },
  reviewCount:    { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  writeBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.tealXLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.tealLight },
  writeBtnText:   { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary },
  reviewCard:     { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 14, ...Shadow.sm, gap: 10 },
  reviewHeader:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:         { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { fontSize: FontSize.sm, fontWeight: '800', color: '#fff' },
  authorName:     { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  ratingRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  date:           { fontSize: FontSize.xs, color: Colors.textMuted },
  comment:        { fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 22 },
  empty:          { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyText:      { fontSize: FontSize.lg, color: Colors.textSecondary },
})
