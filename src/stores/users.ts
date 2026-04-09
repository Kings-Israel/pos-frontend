import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'
import type { UserRole } from './auth'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppUser {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
  lastLoginAt?: string    // ISO date string from backend
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role: UserRole
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  role?: UserRole
  active?: boolean
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useUsersStore = defineStore('users', () => {
  const users   = ref<AppUser[]>([])
  const loading = ref(false)
  const error   = ref<string | null>(null)

  // ── Actions ───────────────────────────────────────────────────────────────

  async function fetchUsers(): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      const data  = await api.get<{ users: AppUser[] }>('/users')
      users.value = data.users
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load users.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createUser(payload: CreateUserPayload): Promise<AppUser> {
    const data  = await api.post<{ user: AppUser }>('/users', payload)
    users.value.push(data.user)
    return data.user
  }

  async function updateUser(id: string, payload: UpdateUserPayload): Promise<void> {
    const data  = await api.patch<{ user: AppUser }>(`/users/${id}`, payload)
    const idx   = users.value.findIndex((u) => u.id === id)
    if (idx !== -1) users.value[idx] = data.user
  }

  async function toggleActive(id: string): Promise<void> {
    const user = users.value.find((u) => u.id === id)
    if (!user) return

    const prev    = user.active
    user.active   = !prev

    try {
      await updateUser(id, { active: user.active })
    } catch (err) {
      user.active = prev
      error.value = err instanceof Error ? err.message : 'Failed to update user status.'
      throw err
    }
  }

  async function deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`)
    users.value = users.value.filter((u) => u.id !== id)
  }

  return {
    // State
    users,
    loading,
    error,
    // Actions
    fetchUsers,
    createUser,
    updateUser,
    toggleActive,
    deleteUser,
  }
})
