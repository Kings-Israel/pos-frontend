import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/lib/api'
import { useMenuStore } from './menu'
import { useTablesStore } from './tables'

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'draft'
  | 'sent'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'paid'
  | 'cancelled'

export type PaymentMethod = 'cash' | 'card' | 'digital'

export interface OrderItem {
  id: string
  menuItemId: string
  name: string
  price: number
  quantity: number
  modifiers: string[]
  notes?: string
}

export interface Order {
  id: string
  tableId?: string
  tableName?: string
  items: OrderItem[]
  status: OrderStatus
  createdAt: string
  updatedAt: string
  serverId: string
  discount: number
  tip: number
  notes?: string
}

export interface AddItemPayload {
  menuItemId: string
  modifiers?: string[]
  notes?: string
  quantity?: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TAX_RATE = 0.08

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString()
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useOrdersStore = defineStore('orders', () => {
  const menuStore   = useMenuStore()
  const tablesStore = useTablesStore()

  const orders      = ref<Order[]>([])
  const activeOrder = ref<Order | null>(null)
  const loading     = ref(false)
  const error       = ref<string | null>(null)

  // ── Active-order computed ─────────────────────────────────────────────────

  const subtotal = computed(() => {
    if (!activeOrder.value) return 0
    return activeOrder.value.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    )
  })

  const discountAmount        = computed(() => activeOrder.value?.discount ?? 0)
  const subtotalAfterDiscount = computed(() => subtotal.value - discountAmount.value)
  const tax                   = computed(() => Math.max(0, subtotalAfterDiscount.value * TAX_RATE))
  const tipAmount             = computed(() => activeOrder.value?.tip ?? 0)
  const orderTotal            = computed(() => subtotalAfterDiscount.value + tax.value + tipAmount.value)
  const totalWithTax          = computed(() => subtotalAfterDiscount.value + tax.value)

  // ── List computed ─────────────────────────────────────────────────────────

  const activeOrders = computed(() =>
    orders.value.filter((o) => o.status !== 'paid' && o.status !== 'cancelled'),
  )

  const pendingKitchenOrders = computed(() =>
    orders.value.filter((o) => o.status === 'sent' || o.status === 'preparing'),
  )

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Sync a returned order into both the list and activeOrder if applicable. */
  function _syncOrder(updated: Order): void {
    const idx = orders.value.findIndex((o) => o.id === updated.id)
    if (idx !== -1) orders.value[idx] = updated
    if (activeOrder.value?.id === updated.id) activeOrder.value = updated
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async function fetchOrders(): Promise<void> {
    loading.value = true
    error.value   = null

    try {
      const data    = await api.get<{ orders: Order[] }>('/orders')
      orders.value  = data.orders
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load orders.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createOrder(tableId?: string): Promise<Order> {
    loading.value = true
    error.value   = null

    try {
      const data      = await api.post<{ order: Order }>('/orders', { tableId })
      const newOrder  = data.order

      orders.value.push(newOrder)
      activeOrder.value = newOrder

      // Optimistically reflect the table as occupied in the local store.
      if (tableId) {
        const table = tablesStore.tables.find((t) => t.id === tableId)
        if (table) {
          table.status         = 'occupied'
          table.currentOrderId = newOrder.id
        }
      }

      return newOrder
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create order.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function addItem(payload: AddItemPayload): Promise<void> {
    if (!activeOrder.value) throw new Error('No active order. Call createOrder() first.')

    const orderId   = activeOrder.value.id
    const modifiers = payload.modifiers ?? []
    const quantity  = payload.quantity  ?? 1

    // ── Optimistic update ──────────────────────────────────────────────────
    // Look up the menu item locally so we can display it immediately.
    const menuItem = menuStore.getItemById(payload.menuItemId)
    if (!menuItem) throw new Error(`Menu item ${payload.menuItemId} not found.`)

    const existingItem = activeOrder.value.items.find(
      (i) =>
        i.menuItemId === payload.menuItemId &&
        JSON.stringify(i.modifiers) === JSON.stringify(modifiers) &&
        (i.notes ?? '') === (payload.notes ?? ''),
    )

    const tempId = `temp-${Date.now()}`
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      activeOrder.value.items.push({
        id:         tempId,
        menuItemId: payload.menuItemId,
        name:       menuItem.name,
        price:      menuItem.price,
        quantity,
        modifiers,
        notes:      payload.notes,
      })
    }
    activeOrder.value.updatedAt = nowIso()

    try {
      const data = await api.post<{ order: Order }>(`/orders/${orderId}/items`, {
        menuItemId: payload.menuItemId,
        quantity,
        modifiers,
        notes: payload.notes,
      })
      _syncOrder(data.order)
    } catch (err) {
      // Rollback optimistic change.
      if (existingItem) {
        existingItem.quantity -= quantity
      } else {
        const idx = activeOrder.value?.items.findIndex((i) => i.id === tempId) ?? -1
        if (idx !== -1) activeOrder.value!.items.splice(idx, 1)
      }
      error.value = err instanceof Error ? err.message : 'Failed to add item.'
      throw err
    }
  }

  async function removeItem(orderItemId: string): Promise<void> {
    if (!activeOrder.value) return

    const orderId  = activeOrder.value.id
    const itemIdx  = activeOrder.value.items.findIndex((i) => i.id === orderItemId)
    if (itemIdx === -1) return

    // Optimistic removal.
    const removed = activeOrder.value.items[itemIdx]!
    activeOrder.value.items.splice(itemIdx, 1)
    activeOrder.value.updatedAt = nowIso()

    try {
      const data = await api.delete<{ order: Order }>(`/orders/${orderId}/items/${orderItemId}`)
      _syncOrder(data.order)
    } catch (err) {
      // Rollback.
      activeOrder.value!.items.splice(itemIdx, 0, removed)
      error.value = err instanceof Error ? err.message : 'Failed to remove item.'
      throw err
    }
  }

  async function updateItemQuantity(orderItemId: string, quantity: number): Promise<void> {
    if (!activeOrder.value) return

    if (quantity <= 0) {
      return removeItem(orderItemId)
    }

    const orderId     = activeOrder.value.id
    const item        = activeOrder.value.items.find((i) => i.id === orderItemId)
    if (!item) return

    const previousQty = item.quantity
    item.quantity     = quantity
    activeOrder.value.updatedAt = nowIso()

    try {
      const data = await api.patch<{ order: Order }>(
        `/orders/${orderId}/items/${orderItemId}`,
        { quantity },
      )
      _syncOrder(data.order)
    } catch (err) {
      item.quantity = previousQty
      error.value   = err instanceof Error ? err.message : 'Failed to update quantity.'
      throw err
    }
  }

  async function setDiscount(amount: number): Promise<void> {
    if (!activeOrder.value) return

    const orderId = activeOrder.value.id
    const prev    = activeOrder.value.discount
    activeOrder.value.discount = Math.max(0, amount)

    try {
      const data = await api.patch<{ order: Order }>(`/orders/${orderId}`, { discount: amount })
      _syncOrder(data.order)
    } catch (err) {
      activeOrder.value!.discount = prev
      error.value = err instanceof Error ? err.message : 'Failed to set discount.'
      throw err
    }
  }

  async function setTip(amount: number): Promise<void> {
    if (!activeOrder.value) return

    const orderId = activeOrder.value.id
    const prev    = activeOrder.value.tip
    activeOrder.value.tip = Math.max(0, amount)

    try {
      const data = await api.patch<{ order: Order }>(`/orders/${orderId}`, { tip: amount })
      _syncOrder(data.order)
    } catch (err) {
      activeOrder.value!.tip = prev
      error.value = err instanceof Error ? err.message : 'Failed to set tip.'
      throw err
    }
  }

  async function sendToKitchen(orderId: string): Promise<void> {
    // Server handles inventory deduction when status changes to 'sent'.
    await updateOrderStatus(orderId, 'sent')
  }

  async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const order = orders.value.find((o) => o.id === orderId)
    if (!order) return

    const previousStatus = order.status
    order.status         = status
    order.updatedAt      = nowIso()
    if (activeOrder.value?.id === orderId) {
      activeOrder.value.status    = status
      activeOrder.value.updatedAt = order.updatedAt
    }

    try {
      const data = await api.patch<{ order: Order }>(`/orders/${orderId}/status`, { status })
      _syncOrder(data.order)
    } catch (err) {
      order.status = previousStatus
      order.updatedAt = nowIso()
      if (activeOrder.value?.id === orderId) activeOrder.value.status = previousStatus
      error.value  = err instanceof Error ? err.message : 'Failed to update order status.'
      throw err
    }
  }

  async function processPayment(
    orderId: string,
    method: PaymentMethod,
    amount: number,
  ): Promise<void> {
    loading.value = true
    error.value   = null

    try {
      const data = await api.post<{ order: Order }>(`/orders/${orderId}/payment`, { method, amount })
      _syncOrder(data.order)

      // Update local table state without a redundant API call —
      // the server already set the table to 'cleaning'.
      const tableId = data.order.tableId
      if (tableId) {
        const table = tablesStore.tables.find((t) => t.id === tableId)
        if (table) {
          table.status         = 'cleaning'
          table.currentOrderId = undefined
        }
      }

      if (activeOrder.value?.id === orderId) activeOrder.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Payment processing failed.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function cancelOrder(orderId: string): Promise<void> {
    loading.value = true
    error.value   = null

    try {
      const data = await api.patch<{ order: Order }>(`/orders/${orderId}/status`, {
        status: 'cancelled',
      })
      _syncOrder(data.order)

      // Update local table state without a redundant API call.
      const tableId = data.order.tableId
      if (tableId) {
        const table = tablesStore.tables.find((t) => t.id === tableId)
        if (table) {
          table.status         = 'available'
          table.currentOrderId = undefined
        }
      }

      if (activeOrder.value?.id === orderId) activeOrder.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to cancel order.'
      throw err
    } finally {
      loading.value = false
    }
  }

  function setActiveOrder(orderId: string | null): void {
    if (orderId === null) {
      activeOrder.value = null
      return
    }
    activeOrder.value = orders.value.find((o) => o.id === orderId) ?? null
  }

  return {
    // State
    orders,
    activeOrder,
    loading,
    error,
    // Computed
    subtotal,
    discountAmount,
    subtotalAfterDiscount,
    tax,
    tipAmount,
    orderTotal,
    totalWithTax,
    activeOrders,
    pendingKitchenOrders,
    // Actions
    fetchOrders,
    createOrder,
    addItem,
    removeItem,
    updateItemQuantity,
    setDiscount,
    setTip,
    sendToKitchen,
    updateOrderStatus,
    processPayment,
    cancelOrder,
    setActiveOrder,
  }
})
