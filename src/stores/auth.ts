import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'manager' | 'waiter' | 'kitchen' | 'cashier'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_USERS: Array<User & { password: string }> = [
  {
    id: 'usr-001',
    name: 'Admin User',
    email: 'admin@pos.com',
    role: 'admin',
    password: 'admin',
    avatar: undefined,
  },
  {
    id: 'usr-002',
    name: 'Jane Waiter',
    email: 'waiter@pos.com',
    role: 'waiter',
    password: 'waiter',
    avatar: undefined,
  },
  {
    id: 'usr-003',
    name: 'Bob Kitchen',
    email: 'kitchen@pos.com',
    role: 'kitchen',
    password: 'kitchen',
    avatar: undefined,
  },
  {
    id: 'usr-004',
    name: 'Alice Cashier',
    email: 'cashier@pos.com',
    role: 'cashier',
    password: 'cashier',
    avatar: undefined,
  },
]

const ROLE_ROUTES: Record<UserRole, string> = {
  admin: '/dashboard/admin',
  manager: '/dashboard/manager',
  waiter: '/dashboard/tables',
  kitchen: '/dashboard/kitchen',
  cashier: '/dashboard/cashier',
}

const SESSION_KEY = 'pos_session_user'

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => user.value !== null)
  const userRole = computed(() => user.value?.role ?? null)

  // ── Actions ──────────────────────────────────────────────────────────────

  async function login(email: string, password: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // TODO: Replace with real API call
      // const response = await api.post('/auth/login', { email, password })
      await new Promise((resolve) => setTimeout(resolve, 800))

      const found = MOCK_USERS.find(
        (u) => u.email === email && u.password === password,
      )

      if (!found) {
        throw new Error('Invalid email or password.')
      }

      const { password: _pw, ...safeUser } = found
      user.value = safeUser

      sessionStorage.setItem(SESSION_KEY, JSON.stringify(safeUser))

      const destination = ROLE_ROUTES[safeUser.role]
      await router.push(destination)
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
      // TODO: Replace with real API call
      // await api.post('/auth/logout')
      await new Promise((resolve) => setTimeout(resolve, 300))
    } finally {
      user.value = null
      sessionStorage.removeItem(SESSION_KEY)
      loading.value = false
      await router.push('/login')
    }
  }

  async function checkSession(): Promise<void> {
    loading.value = true

    try {
      // TODO: Replace with real API call to validate token
      // const response = await api.get('/auth/me')
      await new Promise((resolve) => setTimeout(resolve, 200))

      const raw = sessionStorage.getItem(SESSION_KEY)
      if (raw) {
        user.value = JSON.parse(raw) as User
      }
    } catch {
      user.value = null
      sessionStorage.removeItem(SESSION_KEY)
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
