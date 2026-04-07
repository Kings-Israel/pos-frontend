import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_TABLES: Table[] = [
  // ── Indoor ─────────────────────────────────────────────────────────────────
  {
    id: 'tbl-001',
    number: 1,
    capacity: 2,
    status: 'occupied',
    currentOrderId: 'ord-001',
    section: 'Indoor',
  },
  {
    id: 'tbl-002',
    number: 2,
    capacity: 2,
    status: 'available',
    section: 'Indoor',
  },
  {
    id: 'tbl-003',
    number: 3,
    capacity: 4,
    status: 'reserved',
    reservedFor: '7:30 PM — Smith',
    section: 'Indoor',
  },
  {
    id: 'tbl-004',
    number: 4,
    capacity: 4,
    status: 'occupied',
    currentOrderId: 'ord-002',
    section: 'Indoor',
  },
  {
    id: 'tbl-005',
    number: 5,
    capacity: 6,
    status: 'cleaning',
    section: 'Indoor',
  },
  {
    id: 'tbl-006',
    number: 6,
    capacity: 6,
    status: 'available',
    section: 'Indoor',
  },
  {
    id: 'tbl-007',
    number: 7,
    capacity: 8,
    status: 'occupied',
    currentOrderId: 'ord-003',
    section: 'Indoor',
  },

  // ── Outdoor ────────────────────────────────────────────────────────────────
  {
    id: 'tbl-008',
    number: 8,
    capacity: 2,
    status: 'available',
    section: 'Outdoor',
  },
  {
    id: 'tbl-009',
    number: 9,
    capacity: 4,
    status: 'occupied',
    currentOrderId: 'ord-004',
    section: 'Outdoor',
  },
  {
    id: 'tbl-010',
    number: 10,
    capacity: 4,
    status: 'reserved',
    reservedFor: '8:00 PM — Johnson',
    section: 'Outdoor',
  },

  // ── Bar ────────────────────────────────────────────────────────────────────
  {
    id: 'tbl-011',
    number: 11,
    capacity: 2,
    status: 'occupied',
    currentOrderId: 'ord-005',
    section: 'Bar',
  },
  {
    id: 'tbl-012',
    number: 12,
    capacity: 2,
    status: 'available',
    section: 'Bar',
  },
]

// ─── Store ────────────────────────────────────────────────────────────────────

export const useTablesStore = defineStore('tables', () => {
  const tables = ref<Table[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── Computed ──────────────────────────────────────────────────────────────

  const sections = computed(() => [
    ...new Set(tables.value.map((t) => t.section)),
  ])

  const tablesBySection = computed(() => {
    const map: Record<string, Table[]> = {}
    for (const section of sections.value) {
      map[section] = tables.value.filter((t) => t.section === section)
    }
    return map
  })

  const availableTables = computed(() =>
    tables.value.filter((t) => t.status === 'available'),
  )

  const occupiedTables = computed(() =>
    tables.value.filter((t) => t.status === 'occupied'),
  )

  // ── Actions ───────────────────────────────────────────────────────────────

  async function fetchTables(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // TODO: Replace with real API call
      // const response = await api.get('/tables')
      await new Promise((resolve) => setTimeout(resolve, 500))

      tables.value = MOCK_TABLES.map((t) => ({ ...t }))
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to load tables.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateStatus(id: string, status: TableStatus): Promise<void> {
    const table = tables.value.find((t) => t.id === id)
    if (!table) return

    const previousStatus = table.status
    table.status = status

    // Clear reservation info if no longer reserved
    if (status !== 'reserved') {
      table.reservedFor = undefined
    }
    // Clear order link if no longer occupied
    if (status !== 'occupied') {
      table.currentOrderId = undefined
    }

    try {
      // TODO: Replace with real API call
      // await api.patch(`/tables/${id}/status`, { status })
      await new Promise((resolve) => setTimeout(resolve, 300))
    } catch (err) {
      table.status = previousStatus
      error.value =
        err instanceof Error ? err.message : 'Failed to update table status.'
      throw err
    }
  }

  async function assignOrder(
    tableId: string,
    orderId: string,
  ): Promise<void> {
    const table = tables.value.find((t) => t.id === tableId)
    if (!table) return

    const previousOrderId = table.currentOrderId
    const previousStatus = table.status

    table.currentOrderId = orderId
    table.status = 'occupied'

    try {
      // TODO: Replace with real API call
      // await api.patch(`/tables/${tableId}/assign`, { orderId })
      await new Promise((resolve) => setTimeout(resolve, 300))
    } catch (err) {
      table.currentOrderId = previousOrderId
      table.status = previousStatus
      error.value =
        err instanceof Error ? err.message : 'Failed to assign order to table.'
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
