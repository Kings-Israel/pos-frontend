import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export type KitchenItemStatus = 'pending' | 'preparing' | 'ready'
export type TicketPriority    = 'normal' | 'high'

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
  /** Elapsed seconds since creation — updated in real time by callers. */
  elapsed: number
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useKitchenStore = defineStore('kitchen', () => {
  const tickets = ref<KitchenTicket[]>([])
  const loading = ref(false)
  const error   = ref<string | null>(null)

  // ── Computed ──────────────────────────────────────────────────────────────

  const pendingTickets = computed(() =>
    tickets.value.filter((t) => t.items.some((i) => i.status !== 'ready')),
  )

  const readyTickets = computed(() =>
    tickets.value.filter((t) => t.items.every((i) => i.status === 'ready')),
  )

  const highPriorityTickets = computed(() =>
    tickets.value.filter((t) => t.priority === 'high'),
  )

  /** Oldest-first ordering for the kitchen display. */
  const sortedTickets = computed(() =>
    [...tickets.value].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    ),
  )

  // ── Actions ───────────────────────────────────────────────────────────────

  async function fetchTickets(): Promise<void> {
    loading.value = true
    error.value   = null

    try {
      const data = await api.get<{ tickets: KitchenTicket[] }>('/kitchen/tickets')
      // Compute elapsed times from the server-provided createdAt.
      const now  = Date.now()
      tickets.value = data.tickets.map((t) => ({
        ...t,
        elapsed: Math.floor((now - new Date(t.createdAt).getTime()) / 1000),
      }))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load kitchen tickets.'
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

    const previous               = ticket.items[itemIndex]!.status
    ticket.items[itemIndex]!.status = status

    try {
      const data  = await api.patch<{ ticket: KitchenTicket }>(
        `/kitchen/tickets/${ticketId}/items/${itemIndex}`,
        { status },
      )
      receiveTicket(data.ticket)
    } catch (err) {
      ticket.items[itemIndex]!.status = previous
      error.value = err instanceof Error ? err.message : 'Failed to update item status.'
      throw err
    }
  }

  async function markTicketReady(ticketId: string): Promise<void> {
    const ticket = tickets.value.find((t) => t.id === ticketId)
    if (!ticket) return

    const previousStatuses = ticket.items.map((i) => i.status)
    ticket.items.forEach((item) => { item.status = 'ready' })

    try {
      const data = await api.patch<{ ticket: KitchenTicket }>(
        `/kitchen/tickets/${ticketId}/ready`,
      )
      receiveTicket(data.ticket)
    } catch (err) {
      ticket.items.forEach((item, idx) => {
        item.status = previousStatuses[idx] ?? 'pending'
      })
      error.value = err instanceof Error ? err.message : 'Failed to mark ticket as ready.'
      throw err
    }
  }

  async function setPriority(ticketId: string, priority: TicketPriority): Promise<void> {
    const ticket = tickets.value.find((t) => t.id === ticketId)
    if (!ticket) return

    const previous    = ticket.priority
    ticket.priority   = priority

    try {
      const data = await api.patch<{ ticket: KitchenTicket }>(
        `/kitchen/tickets/${ticketId}`,
        { priority },
      )
      receiveTicket(data.ticket)
    } catch (err) {
      ticket.priority = previous
      error.value     = err instanceof Error ? err.message : 'Failed to update ticket priority.'
      throw err
    }
  }

  /** Call on a 1-second interval to keep elapsed times fresh. */
  function tickElapsed(): void {
    const now = Date.now()
    tickets.value.forEach((ticket) => {
      ticket.elapsed = Math.floor((now - new Date(ticket.createdAt).getTime()) / 1000)
    })
  }

  /** Upsert a ticket received via WebSocket push or polling. */
  function receiveTicket(ticket: KitchenTicket): void {
    const existing = tickets.value.findIndex((t) => t.id === ticket.id)
    const withElapsed = {
      ...ticket,
      elapsed: Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / 1000),
    }
    if (existing !== -1) {
      tickets.value[existing] = withElapsed
    } else {
      tickets.value.push(withElapsed)
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
