import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Category {
  id: string
  name: string
  color: string
  icon: string
}

export interface ModifierOption {
  label: string
  priceAdd: number
}

export interface Modifier {
  id: string
  name: string
  options: ModifierOption[]
}

export interface MenuItem {
  id: string
  category_id: string
  name: string
  category_name?: string
  description: string
  price: number
  available: boolean
  image?: string
  modifiers: Modifier[]
}

export interface MenuItemCreatePayload {
  name?: string
  description?: string
  price?: number
  available?: boolean
  image?: string
  categoryId?: string
  modifiers?: Modifier[]
}

export interface MenuItemUpdatePayload {
  name?: string
  description?: string
  price?: number
  available?: boolean
  image?: string
  categoryId?: string
  modifiers?: Modifier[]
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useMenuStore = defineStore('menu', () => {
  const categories = ref<Category[]>([])
  const items = ref<MenuItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── Computed ──────────────────────────────────────────────────────────────

  const availableItems = computed(() => items.value.filter((i) => i.available))

  const itemsByCategory = computed(() => {
    const map: Record<string, MenuItem[]> = {}
    for (const cat of categories.value) {
      map[cat.id] = items.value.filter((i) => i.category_id === cat.id)
    }
    return map
  })

  // ── Actions ───────────────────────────────────────────────────────────────

  async function fetchMenu(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const data = await api.get<{ categories: Category[]; items: MenuItem[] }>('/menu')
      categories.value = data.categories
      items.value = data.items
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load menu.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function toggleAvailability(id: string): Promise<void> {
    const item = items.value.find((i) => i.id === id)
    if (!item) return

    const previous = item.available
    item.available = !previous

    try {
      const data = await api.patch<{ item: MenuItem }>(`/menu/items/${id}`, {
        available: item.available,
      })
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) items.value[idx] = data.item
    } catch (err) {
      item.available = previous
      error.value = err instanceof Error ? err.message : 'Failed to update availability.'
      throw err
    }
  }

  async function storeItem(data: MenuItemCreatePayload): Promise<void> {
    try {
      const res = await api.post<{ item: MenuItem }>(`/menu/items`, data)
      items.value.push(res.item)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to store item.'
      throw err
    }
  }

  async function updateItem(id: string, data: MenuItemUpdatePayload): Promise<void> {
    const index = items.value.findIndex((i) => i.id === id)
    if (index === -1) return

    const snapshot = { ...items.value[index] } as MenuItem
    try {
      const res = await api.patch<{ item: MenuItem }>(`/menu/items/${id}`, data)
      items.value[index] = res.item
    } catch (err) {
      items.value[index] = snapshot
      error.value = err instanceof Error ? err.message : 'Failed to update item.'
      throw err
    }
  }

  async function createCategory(data: Omit<Category, 'id'>): Promise<void> {
    const res = await api.post<{ category: Category }>('/menu/categories', data)
    categories.value.push(res.category)
  }

  function getItemById(id: string): MenuItem | undefined {
    return items.value.find((i) => i.id === id)
  }

  return {
    // State
    categories,
    items,
    loading,
    error,
    // Computed
    availableItems,
    itemsByCategory,
    // Actions
    fetchMenu,
    toggleAvailability,
    storeItem,
    updateItem,
    createCategory,
    getItemById,
  }
})
