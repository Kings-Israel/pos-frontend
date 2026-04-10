import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api, setToken, clearToken, getToken } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'manager' | 'waiter' | 'kitchen' | 'cashier'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}

interface LoginResponse {
  token: string
  user: User
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default landing page after login per role. */
const ROLE_HOME: Record<UserRole, string> = {
  admin:   '/',
  manager: '/',
  waiter:  '/tables',
  kitchen: '/kitchen',
  cashier: '/payments',
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  const user            = ref<User | null>(null)
  const loading         = ref(false)
  const error           = ref<string | null>(null)
  /** Prevents /auth/me from being called on every navigation. */
  const sessionChecked  = ref(false)

  const isAuthenticated = computed(() => user.value !== null)
  const userRole        = computed(() => user.value?.role ?? null)

  // ── Actions ──────────────────────────────────────────────────────────────

  async function login(email: string, password: string): Promise<void> {
    loading.value = true
    error.value   = null

    try {
      const data = await api.post<LoginResponse>('/auth/login/', { email, password })
      setToken(data.token)
      user.value           = data.user
      sessionChecked.value = true
      await router.push(ROLE_HOME[data.user.role])
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    loading.value = true
    try {
      await api.post('/auth/logout/')
    } catch {
      // Ignore logout errors — clear local state regardless.
    } finally {
      user.value           = null
      sessionChecked.value = false
      clearToken()
      loading.value = false
      await router.push('/login')
    }
  }

  /**
   * Restores the session from the stored JWT by calling GET /auth/me.
   * Only runs once per app lifecycle (guarded by `sessionChecked`).
   */
  async function checkSession(): Promise<void> {
    if (sessionChecked.value) return
    sessionChecked.value = true

    if (!getToken()) return

    loading.value = true
    try {
      const data   = await api.get<{ user: User }>('/auth/me')
      user.value   = data.user
    } catch {
      user.value = null
      clearToken()
    } finally {
      loading.value = false
    }
  }

  function clearError(): void {
    error.value = null
  }

  return {
    // State
    user,
    loading,
    error,
    // Computed
    isAuthenticated,
    userRole,
    // Actions
    login,
    logout,
    checkSession,
    clearError,
  }
})
