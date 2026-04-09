import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export type StockStatus  = 'ok' | 'low' | 'critical' | 'out'
export type MovementType = 'deduction' | 'restock' | 'adjustment' | 'waste'

export interface InventoryItem {
  id: string
  name: string
  category: 'ingredient' | 'beverage' | 'packaging' | 'cleaning'
  unit: string
  currentStock: number
  minStock: number
  maxStock: number
  costPerUnit: number
  linkedMenuItems: { menuItemId: string; usagePerOrder: number }[]
  lastUpdated: string
  supplier?: string
}

export interface StockMovement {
  id: string
  inventoryItemId: string
  inventoryItemName: string
  type: MovementType
  quantity: number        // positive = added, negative = removed
  reason: string
  orderId?: string
  timestamp: string
  performedBy: string
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useInventoryStore = defineStore('inventory', () => {
  const items     = ref<InventoryItem[]>([])
  const movements = ref<StockMovement[]>([])
  const loading   = ref(false)
  const error     = ref<string | null>(null)

  // ── Computed ───────────────────────────────────────────────────────────────

  function stockStatus(item: InventoryItem): StockStatus {
    if (item.currentStock === 0)                          return 'out'
    if (item.currentStock <= item.minStock)               return 'critical'
    if (item.currentStock <= item.minStock * 1.5)         return 'low'
    return 'ok'
  }

  const outOfStockItems = computed(() =>
    items.value.filter((i) => i.currentStock === 0),
  )

  const criticalItems = computed(() =>
    items.value.filter((i) => i.currentStock > 0 && i.currentStock <= i.minStock),
  )

  const lowStockItems = computed(() =>
    items.value.filter(
      (i) => i.currentStock > i.minStock && i.currentStock <= i.minStock * 1.5,
    ),
  )

  const totalInventoryValue = computed(() =>
    items.value.reduce((sum, i) => sum + i.currentStock * i.costPerUnit, 0),
  )

  const alertCount = computed(
    () => lowStockItems.value.length + outOfStockItems.value.length + criticalItems.value.length,
  )

  // ── Actions ────────────────────────────────────────────────────────────────

  async function fetchInventory(): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      const data    = await api.get<{ items: InventoryItem[] }>('/inventory')
      items.value   = data.items
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load inventory.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchMovements(): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      const data        = await api.get<{ movements: StockMovement[] }>('/inventory/movements')
      movements.value   = data.movements
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load movements.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function restockItem(id: string, quantity: number, notes?: string): Promise<void> {
    try {
      const data = await api.post<{ item: InventoryItem; movement: StockMovement }>(
        `/inventory/${id}/restock`,
        { quantity, notes },
      )
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) items.value[idx] = data.item
      movements.value.unshift(data.movement)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to restock item.'
      throw err
    }
  }

  async function adjustStock(
    id: string,
    quantity: number,
    type: MovementType,
    reason: string,
  ): Promise<void> {
    try {
      const data = await api.post<{ item: InventoryItem; movement: StockMovement }>(
        `/inventory/${id}/adjust`,
        { quantity, type, reason },
      )
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) items.value[idx] = data.item
      movements.value.unshift(data.movement)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to adjust stock.'
      throw err
    }
  }

  async function addInventoryItem(
    data: Omit<InventoryItem, 'id' | 'lastUpdated'>,
  ): Promise<void> {
    const res = await api.post<{ item: InventoryItem }>('/inventory', data)
    items.value.push(res.item)
  }

  async function updateInventoryItem(
    id: string,
    data: Partial<Omit<InventoryItem, 'id'>>,
  ): Promise<void> {
    const res = await api.patch<{ item: InventoryItem }>(`/inventory/${id}`, data)
    const idx = items.value.findIndex((i) => i.id === id)
    if (idx !== -1) items.value[idx] = res.item
  }

  return {
    // State
    items,
    movements,
    loading,
    error,
    // Computed
    outOfStockItems,
    criticalItems,
    lowStockItems,
    totalInventoryValue,
    alertCount,
    // Functions
    stockStatus,
    // Actions
    fetchInventory,
    fetchMovements,
    restockItem,
    adjustStock,
    addInventoryItem,
    updateInventoryItem,
  }
})
