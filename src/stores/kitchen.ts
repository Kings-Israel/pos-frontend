import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// ─── Types ────────────────────────────────────────────────────────────────────

export type KitchenItemStatus = 'pending' | 'preparing' | 'ready'

export type TicketPriority = 'normal' | 'high'

export interface KitchenTicketItem {
  name: string
  quantity: number
  modifiers: string[]
  notes?: string
  status: KitchenItemStatus
}

export interface KitchenTicket {
  id: string
  orderId: string
  tableNumber?: number
  items: KitchenTicketItem[]
  createdAt: string
  priority: TicketPriority
  /** Elapsed seconds since the ticket was created (updated in real time by callers) */
  elapsed: number
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_TICKETS: KitchenTicket[] = [
  {
    id: 'kt-001',
    orderId: 'ord-001',
    tableNumber: 1,
    createdAt: new Date(Date.now() - 25 * 60_000).toISOString(),
    priority: 'normal',
    elapsed: 25 * 60,
    items: [
      {
        name: 'Cappuccino',
        quantity: 2,
        modifiers: ['Oat Milk'],
        status: 'ready',
      },
      {
        name: 'Bruschetta al Pomodoro',
        quantity: 1,
        modifiers: [],
        status: 'preparing',
      },
    ],
  },
  {
    id: 'kt-002',
    orderId: 'ord-002',
    tableNumber: 4,
    createdAt: new Date(Date.now() - 10 * 60_000).toISOString(),
    priority: 'high',
    elapsed: 10 * 60,
    items: [
      {
        name: 'Grilled Ribeye Steak',
        quantity: 2,
        modifiers: ['Medium Rare', 'Peppercorn'],
        status: 'preparing',
      },
      {
        name: 'Calamari Fritti',
        quantity: 1,
        modifiers: [],
        status: 'pending',
      },
      {
        name: 'Espresso',
        quantity: 2,
        modifiers: ['Double'],
        status: 'pending',
      },
    ],
  },
  {
    id: 'kt-003',
    orderId: 'ord-003',
    tableNumber: 7,
    createdAt: new Date(Date.now() - 45 * 60_000).toISOString(),
    priority: 'high',
    elapsed: 45 * 60,
    items: [
      {
        name: 'Margherita Pizza',
        quantity: 3,
        modifiers: ['Classic'],
        status: 'ready',
      },
      {
        name: 'Mushroom Risotto',
        quantity: 1,
        modifiers: ['Extra Truffle'],
        status: 'ready',
      },
      {
        name: 'Fresh Orange Juice',
        quantity: 4,
        modifiers: [],
        status: 'ready',
      },
    ],
  },
  {
    id: 'kt-004',
    orderId: 'ord-005',
    tableNumber: 11,
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    priority: 'normal',
    elapsed: 5 * 60,
    items: [
      {
        name: 'Espresso',
        quantity: 1,
        modifiers: ['Single'],
        status: 'pending',
      },
      {
        name: 'Chocolate Lava Cake',
        quantity: 1,
        modifiers: ['Salted Caramel'],
        status: 'pending',
      },
    ],
  },
]

// ─── Store ────────────────────────────────────────────────────────────────────

export const useKitchenStore = defineStore('kitchen', () => {
  const tickets = ref<KitchenTicket[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── Computed ──────────────────────────────────────────────────────────────

  const pendingTickets = computed(() =>
    tickets.value.filter((t) =>
      t.items.some((i) => i.status !== 'ready'),
    ),
  )

  const readyTickets = computed(() =>
    tickets.value.filter((t) =>
      t.items.every((i) => i.status === 'ready'),
    ),
  )

  const highPriorityTickets = computed(() =>
    tickets.value.filter((t) => t.priority === 'high'),
  )

  /** Oldest-first ordering for the kitchen display */
  const sortedTickets = computed(() =>
    [...tickets.value].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    ),
  )

  // ── Actions ───────────────────────────────────────────────────────────────

  async function fetchTickets(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // TODO: Replace with real API call (or WebSocket subscription)
      // const response = await api.get('/kitchen/tickets')
      await new Promise((resolve) => setTimeout(resolve, 500))

      tickets.value = MOCK_TICKETS.map((t) => ({
        ...t,
        items: t.items.map((i) => ({ ...i })),
      }))
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to load kitchen tickets.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateItemStatus(
    ticketId: string,
    itemIndex: number,
    status: KitchenItemStatus,
  ): Promise<void> {
    const ticket = tickets.value.find((t) => t.id === ticketId)
    if (!ticket || !ticket.items[itemIndex]) return

    const previousStatus = ticket.items[itemIndex].status
    ticket.items[itemIndex].status = status

    try {
      // TODO: Replace with real API call
      // await api.patch(`/kitchen/tickets/${ticketId}/items/${itemIndex}`, { status })
      await new Promise((resolve) => setTimeout(resolve, 200))
    } catch (err) {
      ticket.items[itemIndex].status = previousStatus
      error.value =
        err instanceof Error ? err.message : 'Failed to update item status.'
      throw err
    }
  }

  async function markTicketReady(ticketId: string): Promise<void> {
    const ticket = tickets.value.find((t) => t.id === ticketId)
    if (!ticket) return

    const previousStatuses = ticket.items.map((i) => i.status)
    ticket.items.forEach((item) => {
      item.status = 'ready'
    })

    try {
      // TODO: Replace with real API call
      // await api.patch(`/kitchen/tickets/${ticketId}/ready`)
      await new Promise((resolve) => setTimeout(resolve, 300))
    } catch (err) {
      ticket.items.forEach((item, idx) => {
        item.status = previousStatuses[idx] ?? 'pending'
      })
      error.value =
        err instanceof Error ? err.message : 'Failed to mark ticket as ready.'
      throw err
    }
  }

  async function setPriority(
    ticketId: string,
    priority: TicketPriority,
  ): Promise<void> {
    const ticket = tickets.value.find((t) => t.id === ticketId)
    if (!ticket) return

    const previous = ticket.priority
    ticket.priority = priority

    try {
      // TODO: Replace with real API call
      // await api.patch(`/kitchen/tickets/${ticketId}`, { priority })
      await new Promise((resolve) => setTimeout(resolve, 200))
    } catch (err) {
      ticket.priority = previous
      error.value =
        err instanceof Error ? err.message : 'Failed to update ticket priority.'
      throw err
    }
  }

  /** Call this on an interval (e.g. every second) to keep elapsed times fresh */
  function tickElapsed(): void {
    const now = Date.now()
    tickets.value.forEach((ticket) => {
      ticket.elapsed = Math.floor(
        (now - new Date(ticket.createdAt).getTime()) / 1000,
      )
    })
  }

  /** Append a new ticket received via WebSocket push or polling */
  function receiveTicket(ticket: KitchenTicket): void {
    const existing = tickets.value.findIndex((t) => t.id === ticket.id)
    if (existing !== -1) {
      tickets.value[existing] = ticket
    } else {
      tickets.value.push(ticket)
    }
  }

  return {
    // State
    tickets,
    loading,
    error,
    // Computed
    pendingTickets,
    readyTickets,
    highPriorityTickets,
    sortedTickets,
    // Actions
    fetchTickets,
    updateItemStatus,
    markTicketReady,
    setPriority,
    tickElapsed,
    receiveTicket,
  }
})
