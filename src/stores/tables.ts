import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning'

export interface Table {
  id: string
  number: number
  capacity: number
  status: TableStatus
  currentOrderId?: string
  reservedFor?: string
  section: string
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useTablesStore = defineStore('tables', () => {
  const tables  = ref<Table[]>([])
  const loading = ref(false)
  const error   = ref<string | null>(null)

  // ── Computed ──────────────────────────────────────────────────────────────

  const sections = computed(() => [...new Set(tables.value.map((t) => t.section))])

  const tablesBySection = computed(() => {
    const map: Record<string, Table[]> = {}
    for (const section of sections.value) {
      map[section] = tables.value.filter((t) => t.section === section)
    }
    return map
  })

  const availableTables = computed(() => tables.value.filter((t) => t.status === 'available'))
  const occupiedTables  = computed(() => tables.value.filter((t) => t.status === 'occupied'))

  // ── Actions ───────────────────────────────────────────────────────────────

  async function fetchTables(): Promise<void> {
    loading.value = true
    error.value   = null

    try {
      const data    = await api.get<{ tables: Table[] }>('/tables')
      tables.value  = data.tables
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load tables.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateStatus(
    id: string,
    status: TableStatus,
    reservedFor?: string,
  ): Promise<void> {
    const table = tables.value.find((t) => t.id === id)
    if (!table) return

    const prev = { status: table.status, reservedFor: table.reservedFor, orderId: table.currentOrderId }

    // Optimistic update.
    table.status = status
    if (status !== 'reserved')  table.reservedFor    = undefined
    else if (reservedFor)       table.reservedFor    = reservedFor
    if (status !== 'occupied')  table.currentOrderId = undefined

    try {
      const data  = await api.patch<{ table: Table }>(`/tables/${id}/status`, { status, reservedFor })
      const idx   = tables.value.findIndex((t) => t.id === id)
      if (idx !== -1) tables.value[idx] = data.table
    } catch (err) {
      table.status         = prev.status
      table.reservedFor    = prev.reservedFor
      table.currentOrderId = prev.orderId
      error.value          = err instanceof Error ? err.message : 'Failed to update table status.'
      throw err
    }
  }

  async function assignOrder(tableId: string, orderId: string): Promise<void> {
    const table = tables.value.find((t) => t.id === tableId)
    if (!table) return

    const prev = { orderId: table.currentOrderId, status: table.status }

    // Optimistic update.
    table.currentOrderId = orderId
    table.status         = 'occupied'

    try {
      const data  = await api.patch<{ table: Table }>(`/tables/${tableId}/assign`, { orderId })
      const idx   = tables.value.findIndex((t) => t.id === tableId)
      if (idx !== -1) tables.value[idx] = data.table
    } catch (err) {
      table.currentOrderId = prev.orderId
      table.status         = prev.status
      error.value          = err instanceof Error ? err.message : 'Failed to assign order to table.'
      throw err
    }
  }

  function getTableById(id: string): Table | undefined {
    return tables.value.find((t) => t.id === id)
  }

  function getTableByOrderId(orderId: string): Table | undefined {
    return tables.value.find((t) => t.currentOrderId === orderId)
  }

  return {
    // State
    tables,
    loading,
    error,
    // Computed
    sections,
    tablesBySection,
    availableTables,
    occupiedTables,
    // Actions
    fetchTables,
    updateStatus,
    assignOrder,
    getTableById,
    getTableByOrderId,
  }
})
