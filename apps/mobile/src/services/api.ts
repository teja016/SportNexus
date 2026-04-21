import axios from 'axios'
import { Platform } from 'react-native'
import { useAuthStore } from '../store/authStore'

const LAN_API = process.env.EXPO_PUBLIC_API_URL   // set in apps/mobile/.env for real-device builds

const API_BASE = LAN_API
  ?? (Platform.OS === 'web'
    ? 'http://localhost:3000/api'
    : __DEV__
      ? 'http://10.0.2.2:3000/api'
      : 'https://sportnexus-api.onrender.com/api')

export const SOCKET_URL = LAN_API
  ? LAN_API.replace('/api', '')
  : Platform.OS === 'web'
    ? 'http://localhost:3000'
    : __DEV__
      ? 'http://10.0.2.2:3000'
      : 'https://sportnexus-api.onrender.com'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Silent refresh on 401
let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }
      originalRequest._retry = true
      isRefreshing = true
      try {
        const { refreshToken } = useAuthStore.getState()
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken })
        const { accessToken: newAccess, refreshToken: newRefresh } = data.data
        useAuthStore.getState().setTokens(newAccess, newRefresh)
        refreshQueue.forEach((cb) => cb(newAccess))
        refreshQueue = []
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return api(originalRequest)
      } catch {
        // Don't force-logout — the 401 error will propagate to the calling screen
        // which can decide whether to show an error or navigate to login.
        // Automatic logout on refresh failure causes mid-flow redirects (e.g. payment → register).
        const { accessToken } = useAuthStore.getState()
        if (!accessToken?.startsWith('dev-') && process.env.NODE_ENV !== 'development') {
          useAuthStore.getState().logout()
        }
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authAPI = {
  // Returns { phone, otpSent, devMode } — no tokens yet
  register: (data: { name: string; email: string; phone: string; firebaseUid?: string }) =>
    api.post('/auth/register', data).then((r) => r.data.data),

  // Returns { phone, otpSent, devMode }
  login: (data: { email?: string; phone?: string }) =>
    api.post('/auth/login', data).then((r) => r.data.data),

  // Resend OTP to an existing user
  sendOTP: (phone: string) =>
    api.post('/auth/otp/send', { phone }).then((r) => r.data.data),

  // Returns { user, accessToken, refreshToken }
  verifyOTP: (phone: string, otp: string) =>
    api.post('/auth/otp/verify', { phone, otp }).then((r) => r.data.data),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }).then((r) => r.data.data),

  logout: () => api.post('/auth/logout'),
}

// ─── User API ─────────────────────────────────────────────────────────────────

export const userAPI = {
  getProfile: () => api.get('/users/me').then((r) => r.data.data),

  updateProfile: (data: Partial<{
    name: string; dob: string; profilePhoto: string;
    homeLat: number; homeLng: number; homeAddress: string; fcmToken: string
  }>) => api.patch('/users/me', data).then((r) => r.data.data),

  getEnrollments: () => api.get('/users/me/enrollments').then((r) => r.data.data),
}

// ─── Academy API ──────────────────────────────────────────────────────────────

export const academyAPI = {
  list: (params?: {
    lat?: number; lng?: number; radius?: number; sport?: string;
    transport?: boolean; rating?: number; minFee?: number; maxFee?: number;
    search?: string; cursor?: string; limit?: number
  }) => api.get('/academies', { params }).then((r) => r.data),

  getById: (id: string) => api.get(`/academies/${id}`).then((r) => r.data.data),

  getPrograms: (academyId: string) =>
    api.get(`/academies/${academyId}/programs`).then((r) => r.data.data),
}

// ─── Slot API ─────────────────────────────────────────────────────────────────

export const slotAPI = {
  getByProgram: (programId: string) =>
    api.get(`/programs/${programId}/slots`).then((r) => r.data.data?.slots ?? []),

  checkAvailability: (programId: string, slotId: string) =>
    api.get(`/programs/${programId}/slots/${slotId}/availability`).then((r) => r.data.data),
}

// ─── Enrollment API ───────────────────────────────────────────────────────────

export const enrollmentAPI = {
  create: (data: {
    slotId: string; transportOpted: boolean; pickupLat?: number; pickupLng?: number;
    pickupAddress?: string; pickupDistance?: number; durationMonths: number
  }) => api.post('/enrollments', data).then((r) => r.data.data),

  getMyEnrollments: (status?: string) =>
    api.get('/enrollments/me', { params: status ? { status } : {} }).then((r) => r.data.data),

  getById: (id: string) => api.get(`/enrollments/${id}`).then((r) => r.data.data),

  cancel: (id: string) => api.delete(`/enrollments/${id}`),
}

// ─── Payment API ──────────────────────────────────────────────────────────────

export const paymentAPI = {
  initiate: (enrollmentId: string) =>
    api.post('/payments/initiate', { enrollmentId }).then((r) => r.data.data),

  confirm: (data: { enrollmentId: string; gatewayOrderId?: string; gatewayTxnId?: string }) =>
    api.post('/payments/confirm', data).then((r) => r.data.data),
}

// ─── Transit API ──────────────────────────────────────────────────────────────

export const transitAPI = {
  getToday:    ()          => api.get('/transit/today').then((r) => r.data.data),
  getById:     (id: string) => api.get(`/transit/${id}`).then((r) => r.data.data),
  cancelToday: (id: string) => api.post(`/transit/${id}/cancel-today`).then((r) => r.data.data),
}

export default api
