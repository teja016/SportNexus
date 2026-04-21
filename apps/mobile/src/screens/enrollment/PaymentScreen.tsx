import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, AppState, AppStateStatus, Linking, Modal, Alert,
} from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { Ionicons } from '@expo/vector-icons'
import { enrollmentAPI, paymentAPI } from '../../services/api'
import { useEnrollmentStore } from '../../store/enrollmentStore'
import { useAuthStore } from '../../store/authStore'
import { useLocalEnrollmentsStore } from '../../store/localEnrollmentsStore'
import { formatCurrency, calculateTrainingFee, calculateTransportFee, calculateProratedTransportFee } from '@sportnexus/utils'
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../../constants/theme'

const MERCHANT_UPI_ID = '6303253214icic@ybl'
const MERCHANT_NAME   = 'SportNexus'

const PAYMENT_METHODS = [
  { id: 'upi',        label: 'UPI',                  icon: 'phone-portrait-outline', desc: 'Scan QR · GPay · PhonePe · Paytm' },
  { id: 'card',       label: 'Credit / Debit Card',  icon: 'card-outline',           desc: 'Visa, Mastercard, Rupay' },
  { id: 'netbanking', label: 'Net Banking',           icon: 'business-outline',       desc: 'All major banks' },
]

export default function PaymentScreen({ navigation }: any) {
  const { selectedAcademy, selectedProgram, selectedSlots, durationMonths,
          transportOpted, pickupDistance, startDate, reset } = useEnrollmentStore()
  const { addEnrollment } = useLocalEnrollmentsStore()

  const [selectedMethod, setSelectedMethod]   = useState('upi')
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState('')
  const [showQR, setShowQR]                   = useState(false)
  const [showConfirm, setShowConfirm]         = useState(false)
  const [pendingEnrollId, setPendingEnrollId] = useState<string | null>(null)
  const [pendingPayId, setPendingPayId]       = useState<string | null>(null)
  const [upiString, setUpiString]             = useState('')
  const waitingForUPI = useRef(false)

  const trainingFee  = selectedProgram
    ? calculateTrainingFee(selectedProgram.feeMonthly, selectedSlots.length || 1, durationMonths)
    : 0
  const transportFee = transportOpted && pickupDistance > 0
    ? startDate
      ? calculateProratedTransportFee(startDate, durationMonths, pickupDistance).total
      : calculateTransportFee(pickupDistance, durationMonths)
    : 0
  const totalFee = trainingFee + transportFee

  // Detect when user returns from UPI app
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active' && waitingForUPI.current) {
        waitingForUPI.current = false
        setShowQR(false)
        setShowConfirm(true)
      }
    })
    return () => sub.remove()
  }, [])

  async function handlePay() {
    if (!selectedProgram || !selectedSlots.length) return
    const slot = selectedSlots[0]

    if (selectedMethod !== 'upi') {
      Alert.alert(
        'Coming Soon',
        `${selectedMethod === 'card' ? 'Card' : 'Net Banking'} payments via Razorpay are coming soon. Please use UPI for now.`
      )
      return
    }

    const isMockSlot = !slot?.id || ['slot1','slot2','slot3','slot4'].some(p => slot.id.startsWith(p))
    setLoading(true)
    setError('')

    try {
      const state = useEnrollmentStore.getState()
      let enrollmentId = `demo_${Date.now()}`
      let orderId: string | undefined

      const isDevToken = (useAuthStore.getState().accessToken ?? '').startsWith('dev-')

      if (!isMockSlot && !isDevToken) {
        const enrollRes = await enrollmentAPI.create({
          slotId:         slot.id,
          durationMonths,
          transportOpted,
          pickupAddress:  state.pickupAddress ?? undefined,
          pickupLat:      state.pickupLat ?? undefined,
          pickupLng:      state.pickupLng ?? undefined,
          pickupDistance: state.pickupDistance || undefined,
          startDate:      state.startDate ? state.startDate.toISOString() : undefined,
        })
        if (enrollRes?.id) {
          enrollmentId = enrollRes.id
          const payRes = await paymentAPI.initiate(enrollmentId)
          orderId = payRes?.orderId
        }
      }

      setPendingEnrollId(enrollmentId)
      setPendingPayId(orderId ?? null)

      // Build UPI string for QR code — no amount in the QR so bank always treats it as standard scan
      // User manually types the amount in their UPI app (avoids "collect" security block)
      const note = `SportNexus-${enrollmentId.slice(-8).toUpperCase()}`
      const qrUpiString =
        `upi://pay?pa=${MERCHANT_UPI_ID}` +
        `&pn=${encodeURIComponent(MERCHANT_NAME)}` +
        `&cu=INR` +
        `&tn=${encodeURIComponent(note)}`

      setUpiString(qrUpiString)
      setLoading(false)
      setShowQR(true)
    } catch (err: any) {
      setLoading(false)
      setError(err.response?.data?.error?.message ?? err.message ?? 'Payment failed. Please try again.')
    }
  }

  async function handleOpenUpiApp() {
    if (!upiString) return
    // Deep link with amount for convenience — may or may not work depending on UPI app
    const upiWithAmount = upiString + `&am=${totalFee.toFixed(2)}`
    waitingForUPI.current = true
    try {
      await Linking.openURL(upiWithAmount)
    } catch {
      waitingForUPI.current = false
      Alert.alert('Could not open UPI app', 'Please scan the QR code from your UPI app instead.')
    }
  }

  function handleQRPaid() {
    setShowQR(false)
    setShowConfirm(true)
  }

  async function handleConfirmPaid() {
    if (!pendingEnrollId) return
    setShowConfirm(false)
    setLoading(true)

    try {
      if (!pendingEnrollId.startsWith('demo_')) {
        await paymentAPI.confirm({
          enrollmentId: pendingEnrollId,
          gatewayOrderId: pendingPayId ?? undefined,
        })
      }

      const slot = selectedSlots[0]
      addEnrollment({
        id: pendingEnrollId,
        userId: useAuthStore.getState().user?.id ?? 'dev',
        slotId: slot?.id ?? '',
        transportOpted,
        durationMonths,
        status: 'CONFIRMED',
        enrolledAt: new Date().toISOString(),
        updatedAt:  new Date().toISOString(),
        slot: {
          ...slot,
          program: { ...selectedProgram!, academy: selectedAcademy ?? undefined },
        } as any,
        payment: {
          id: `pay_${pendingEnrollId}`,
          userId: useAuthStore.getState().user?.id ?? 'dev',
          enrollmentId: pendingEnrollId,
          amount: trainingFee,
          transportFee,
          totalAmount: totalFee,
          currency: 'INR',
          gateway: 'upi',
          status: 'SUCCESS',
          webhookVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      } as any)

      reset()
      navigation.reset({
        index: 1,
        routes: [
          { name: 'MainTabs' },
          { name: 'BookingSuccess', params: { enrollmentId: pendingEnrollId } },
        ],
      })
    } catch (err: any) {
      setLoading(false)
      setError(err.response?.data?.error?.message ?? 'Could not confirm payment. Please contact support.')
    }
  }

  function handleNotPaid() {
    setShowConfirm(false)
    setShowQR(false)
    setPendingEnrollId(null)
    setPendingPayId(null)
    setError('Payment not completed. Please try again.')
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
        <Text style={styles.heading}>Payment</Text>

        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>{selectedAcademy?.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Program</Text>
            <Text style={styles.summaryVal}>{selectedProgram?.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Duration</Text>
            <Text style={styles.summaryVal}>{durationMonths} month{durationMonths > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Slots</Text>
            <Text style={styles.summaryVal}>{selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Training Fee</Text>
            <Text style={styles.summaryVal}>{formatCurrency(trainingFee)}</Text>
          </View>
          {transportFee > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Transport Fee</Text>
              <Text style={styles.summaryVal}>{formatCurrency(transportFee)}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryKey, styles.totalKey]}>Total Amount</Text>
            <Text style={styles.totalVal}>{formatCurrency(totalFee)}</Text>
          </View>
        </View>

        {/* UPI Merchant Info */}
        {selectedMethod === 'upi' && (
          <View style={styles.upiCard}>
            <View style={styles.upiIconWrap}>
              <Ionicons name="qr-code-outline" size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.upiTitle}>Pay to SportNexus</Text>
              <Text style={styles.upiId}>{MERCHANT_UPI_ID}</Text>
            </View>
            <View style={styles.upiVerified}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.accent} />
              <Text style={styles.upiVerifiedText}>Verified</Text>
            </View>
          </View>
        )}

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Payment Methods */}
        <Text style={styles.sectionTitle}>Payment Method</Text>
        {PAYMENT_METHODS.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[styles.methodCard, selectedMethod === method.id && styles.methodCardActive]}
            onPress={() => setSelectedMethod(method.id)}
          >
            <View style={[styles.radio, selectedMethod === method.id && styles.radioActive]}>
              {selectedMethod === method.id && <View style={styles.radioDot} />}
            </View>
            <View style={[styles.methodIcon, selectedMethod === method.id && { backgroundColor: Colors.tealLight }]}>
              <Ionicons name={method.icon as any} size={20} color={selectedMethod === method.id ? Colors.primary : Colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.methodLabel, selectedMethod === method.id && styles.methodLabelActive]}>{method.label}</Text>
              <Text style={styles.methodDesc}>{method.desc}</Text>
            </View>
            {method.id !== 'upi' && (
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Soon</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.secureNote}>
          <Ionicons name="shield-checkmark-outline" size={14} color={Colors.accent} />
          <Text style={styles.secureText}>100% secure · Scan QR from any UPI app</Text>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.payLabel}>Amount to Pay</Text>
          <Text style={styles.payAmount}>{formatCurrency(totalFee)}</Text>
        </View>
        <TouchableOpacity style={styles.payBtn} onPress={handlePay} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="qr-code-outline" size={16} color="#fff" />
                <Text style={styles.payBtnText}>Pay via UPI</Text>
              </>
          }
        </TouchableOpacity>
      </View>

      {/* QR Code Modal */}
      <Modal visible={showQR} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.qrCard}>
            <View style={styles.qrHeader}>
              <Text style={styles.qrTitle}>Scan & Pay</Text>
              <TouchableOpacity onPress={handleNotPaid} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.qrAmountLabel}>Amount to pay</Text>
            <Text style={styles.qrAmount}>{formatCurrency(totalFee)}</Text>

            <View style={styles.qrWrap}>
              {upiString ? (
                <QRCode
                  value={upiString}
                  size={200}
                  color={Colors.navy}
                  backgroundColor="#fff"
                />
              ) : null}
            </View>

            <Text style={styles.qrInstructions}>
              Open GPay, PhonePe, Paytm or any UPI app → Scan QR → Enter amount {formatCurrency(totalFee)}
            </Text>

            <View style={styles.qrUpiRow}>
              <Ionicons name="person-circle-outline" size={16} color={Colors.primary} />
              <Text style={styles.qrUpiId}>{MERCHANT_UPI_ID}</Text>
            </View>

            {/* Open UPI app button — secondary option */}
            <TouchableOpacity style={styles.openUpiBtn} onPress={handleOpenUpiApp}>
              <Ionicons name="phone-portrait-outline" size={16} color={Colors.primary} />
              <Text style={styles.openUpiBtnText}>Open UPI App Instead</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.paidBtn} onPress={handleQRPaid}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.paidBtnText}>I've Paid</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Payment Confirmation Modal */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="help-circle" size={40} color={Colors.warning} />
            </View>
            <Text style={styles.modalTitle}>Payment Completed?</Text>
            <Text style={styles.modalSub}>
              Did you successfully pay {formatCurrency(totalFee)} to {MERCHANT_UPI_ID}?
            </Text>
            <View style={styles.upiRefRow}>
              <Ionicons name="receipt-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.upiRefText}>Ref: SportNexus-{(pendingEnrollId ?? '').slice(-8).toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmPaid}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.confirmBtnText}>Yes, I've Paid</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleNotPaid}>
              <Text style={styles.cancelBtnText}>No, Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  heading:      { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, marginBottom: 16 },

  card:         { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 16, marginBottom: 16, ...Shadow.sm, gap: 8 },
  cardTitle:    { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 4 },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryKey:   { fontSize: FontSize.sm, color: Colors.textSecondary },
  summaryVal:   { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.semibold },
  divider:      { height: 1, backgroundColor: Colors.borderLight },
  totalKey:     { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  totalVal:     { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.navy },

  upiCard:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.tealXLight, borderRadius: BorderRadius.lg, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.tealLight },
  upiIconWrap:  { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', ...Shadow.xs },
  upiTitle:     { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  upiId:        { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold, marginTop: 2 },
  upiVerified:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  upiVerifiedText: { fontSize: FontSize.xs, color: Colors.accent, fontWeight: FontWeight.semibold },

  sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 10 },
  methodCard:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 14, marginBottom: 10, borderWidth: 2, borderColor: 'transparent', ...Shadow.sm },
  methodCardActive: { borderColor: Colors.primary, backgroundColor: Colors.tealXLight },
  radio:        { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive:  { borderColor: Colors.primary },
  radioDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  methodIcon:   { width: 40, height: 40, borderRadius: BorderRadius.sm, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  methodLabel:  { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  methodLabelActive: { color: Colors.primary },
  methodDesc:   { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  comingSoonBadge: { backgroundColor: Colors.borderLight, borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  comingSoonText:  { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold },

  secureNote:   { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 8 },
  secureText:   { fontSize: FontSize.xs, color: Colors.textMuted },
  errorBox:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FEF2F2', borderRadius: BorderRadius.md, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorText:    { flex: 1, fontSize: FontSize.sm, color: Colors.danger },

  bottomBar:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 8 },
  payLabel:     { fontSize: FontSize.sm, color: Colors.textSecondary },
  payAmount:    { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.navy },
  payBtn:       { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: BorderRadius.lg, justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  payBtnText:   { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.extrabold },

  // QR Modal
  qrCard:       { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: 24, width: '100%', alignItems: 'center', ...Shadow.lg },
  qrHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 12 },
  qrTitle:      { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  qrAmountLabel:{ fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 2 },
  qrAmount:     { fontSize: 28, fontWeight: FontWeight.extrabold, color: Colors.navy, marginBottom: 16 },
  qrWrap:       { backgroundColor: '#fff', padding: 16, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.borderLight, marginBottom: 16, ...Shadow.sm },
  qrInstructions: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 10, paddingHorizontal: 8 },
  qrUpiRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.tealXLight, borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 16 },
  qrUpiId:      { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold },
  openUpiBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 12, paddingHorizontal: 20, marginBottom: 10, width: '100%', justifyContent: 'center' },
  openUpiBtnText: { fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.semibold },
  paidBtn:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 14, width: '100%', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  paidBtnText:  { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },

  // Confirmation Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'flex-end', padding: 16, paddingBottom: 24 },
  modalCard:    { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: 28, width: '100%', alignItems: 'center', ...Shadow.lg },
  modalIconWrap:{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalTitle:   { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, marginBottom: 8 },
  modalSub:     { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  upiRefRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.borderLight, borderRadius: BorderRadius.md, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 20 },
  upiRefText:   { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  confirmBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 14, width: '100%', justifyContent: 'center', marginBottom: 10, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  confirmBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
  cancelBtn:    { paddingVertical: 10, width: '100%', alignItems: 'center' },
  cancelBtnText:{ fontSize: FontSize.base, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
})
