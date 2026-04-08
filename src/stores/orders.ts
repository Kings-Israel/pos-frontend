import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useMenuStore } from './menu'
import { useTablesStore } from './tables'
import { useInventoryStore } from './inventory'

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

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function nowIso(): string {
  return new Date().toISOString()
}

// ─── Mock existing orders ────────────────────────────────────────────────────

const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-001',
    tableId: 'tbl-001',
    tableName: 'Table 1',
    items: [
      {
        id: 'oi-001-a',
        menuItemId: 'itm-bev-002',
        name: 'Cappuccino',
        price: 4.75,
        quantity: 2,
        modifiers: ['Oat Milk'],
      },
      {
        id: 'oi-001-b',
        menuItemId: 'itm-sta-001',
        name: 'Bruschetta al Pomodoro',
        price: 9.0,
        quantity: 1,
        modifiers: [],
      },
    ],
    status: 'preparing',
    createdAt: new Date(Date.now() - 25 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 18 * 60_000).toISOString(),
    serverId: 'usr-002',
    discount: 0,
    tip: 0,
  },
  {
    id: 'ord-002',
    tableId: 'tbl-004',
    tableName: 'Table 4',
    items: [
      {
        id: 'oi-002-a',
        menuItemId: 'itm-mai-001',
        name: 'Grilled Ribeye Steak',
        price: 38.0,
        quantity: 2,
        modifiers: ['Medium Rare', 'Peppercorn'],
      },
      {
        id: 'oi-002-b',
        menuItemId: 'itm-sta-002',
        name: 'Calamari Fritti',
        price: 13.5,
        quantity: 1,
        modifiers: [],
      },
      {
        id: 'oi-002-c',
        menuItemId: 'itm-bev-001',
        name: 'Espresso',
        price: 3.5,
        quantity: 2,
        modifiers: ['Double'],
      },
    ],
    status: 'sent',
    createdAt: new Date(Date.now() - 10 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60_000).toISOString(),
    serverId: 'usr-002',
    discount: 0,
    tip: 0,
  },
  {
    id: 'ord-003',
    tableId: 'tbl-007',
    tableName: 'Table 7',
    items: [
      {
        id: 'oi-003-a',
        menuItemId: 'itm-mai-004',
        name: 'Margherita Pizza',
        price: 18.0,
        quantity: 3,
        modifiers: ['Classic'],
      },
      {
        id: 'oi-003-b',
        menuItemId: 'itm-mai-003',
        name: 'Mushroom Risotto',
        price: 22.0,
        quantity: 1,
        modifiers: ['Extra Truffle'],
      },
      {
        id: 'oi-003-c',
        menuItemId: 'itm-bev-003',
        name: 'Fresh Orange Juice',
        price: 5.5,
        quantity: 4,
        modifiers: [],
      },
    ],
    status: 'ready',
    createdAt: new Date(Date.now() - 45 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    serverId: 'usr-002',
    discount: 10,
    tip: 0,
  },
  {
    id: 'ord-004',
    tableId: 'tbl-009',
    tableName: 'Table 9',
    items: [
      {
        id: 'oi-004-a',
        menuItemId: 'itm-mai-002',
        name: 'Pan-Seared Salmon',
        price: 26.0,
        quantity: 2,
        modifiers: ['Steamed Rice'],
      },
      {
        id: 'oi-004-b',
        menuItemId: 'itm-des-001',
        name: 'Tiramisu',
        price: 9.5,
        quantity: 2,
        modifiers: [],
      },
    ],
    status: 'served',
    createdAt: new Date(Date.now() - 60 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60_000).toISOString(),
    serverId: 'usr-002',
    discount: 0,
    tip: 12,
  },
  {
    id: 'ord-005',
    tableId: 'tbl-011',
    tableName: 'Table 11 (Bar)',
    items: [
      {
        id: 'oi-005-a',
        menuItemId: 'itm-bev-001',
        name: 'Espresso',
        price: 3.5,
        quantity: 1,
        modifiers: ['Single'],
      },
      {
        id: 'oi-005-b',
        menuItemId: 'itm-des-002',
        name: 'Chocolate Lava Cake',
        price: 11.0,
        quantity: 1,
        modifiers: ['Salted Caramel'],
      },
    ],
    status: 'draft',
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    serverId: 'usr-002',
    discount: 0,
    tip: 0,
  },
]

// ─── Store ────────────────────────────────────────────────────────────────────

export const useOrdersStore = defineStore('orders', () => {
  const menuStore = useMenuStore()
  const tablesStore = useTablesStore()
  const inventoryStore = useInventoryStore()

  const orders = ref<Order[]>([])
  const activeOrder = ref<Order | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── Order-level computed (active order) ───────────────────────────────────

  const subtotal = computed(() => {
    if (!activeOrder.value) return 0
    return activeOrder.value.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    )
  })

  const discountAmount = computed(() => activeOrder.value?.discount ?? 0)

  const subtotalAfterDiscount = computed(
    () => subtotal.value - discountAmount.value,
  )

  const tax = computed(() =>
    Math.max(0, subtotalAfterDiscount.value * TAX_RATE),
  )

  const tipAmount = computed(() => activeOrder.value?.tip ?? 0)

  const orderTotal = computed(
    () => subtotalAfterDiscount.value + tax.value + tipAmount.value,
  )

  const totalWithTax = computed(
    () => subtotalAfterDiscount.value + tax.value,
  )

  // ── List-level computed ───────────────────────────────────────────────────

  const activeOrders = computed(() =>
    orders.value.filter(
      (o) =>
        o.status !== 'paid' &&
        o.status !== 'cancelled',
    ),
  )

  const pendingKitchenOrders = computed(() =>
    orders.value.filter(
      (o) => o.status === 'sent' || o.status === 'preparing',
    ),
  )

  // ── Actions ───────────────────────────────────────────────────────────────

  async function fetchOrders(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // TODO: Replace with real API call
      // const response = await api.get('/orders')
      await new Promise((resolve) => setTimeout(resolve, 500))

      orders.value = MOCK_ORDERS.map((o) => ({
        ...o,
        items: o.items.map((i) => ({ ...i })),
      }))
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to load orders.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createOrder(tableId?: string): Promise<Order> {
    loading.value = true
    error.value = null

    try {
      // TODO: Replace with real API call
      // const response = await api.post('/orders', { tableId })
      await new Promise((resolve) => setTimeout(resolve, 300))

      const table = tableId ? tablesStore.getTableById(tableId) : undefined
      const now = nowIso()

      const newOrder: Order = {
        id: generateId('ord'),
        tableId,
        tableName: table ? `Table ${table.number}` : undefined,
        items: [],
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        serverId: 'usr-002', // TODO: get from auth store
        discount: 0,
        tip: 0,
      }

      orders.value.push(newOrder)
      activeOrder.value = newOrder

      if (tableId) {
        await tablesStore.assignOrder(tableId, newOrder.id)
      }

      return newOrder
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to create order.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function addItem(payload: AddItemPayload): Promise<void> {
    if (!activeOrder.value) {
      throw new Error('No active order. Call createOrder() first.')
    }

    const menuItem = menuStore.getItemById(payload.menuItemId)
    if (!menuItem) {
      throw new Error(`Menu item ${payload.menuItemId} not found.`)
    }

    const modifiers = payload.modifiers ?? []
    const quantity = payload.quantity ?? 1

    // Merge with existing identical line item (same item + same modifiers + same notes)
    const existingItem = activeOrder.value.items.find(
      (i) =>
        i.menuItemId === payload.menuItemId &&
        JSON.stringify(i.modifiers) === JSON.stringify(modifiers) &&
        (i.notes ?? '') === (payload.notes ?? ''),
    )

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      activeOrder.value.items.push({
        id: generateId('oi'),
        menuItemId: payload.menuItemId,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
        modifiers,
        notes: payload.notes,
      })
    }

    activeOrder.value.updatedAt = nowIso()

    // TODO: Replace with real API call
    // await api.post(`/orders/${activeOrder.value.id}/items`, payload)
    await new Promise((resolve) => setTimeout(resolve, 150))
  }

  async function removeItem(orderItemId: string): Promise<void> {
    if (!activeOrder.value) return

    const index = activeOrder.value.items.findIndex(
      (i) => i.id === orderItemId,
    )
    if (index === -1) return

    activeOrder.value.items.splice(index, 1)
    activeOrder.value.updatedAt = nowIso()

    // TODO: Replace with real API call
    // await api.delete(`/orders/${activeOrder.value.id}/items/${orderItemId}`)
    await new Promise((resolve) => setTimeout(resolve, 150))
  }

  async function updateItemQuantity(
    orderItemId: string,
    quantity: number,
  ): Promise<void> {
    if (!activeOrder.value) return

    if (quantity <= 0) {
      await removeItem(orderItemId)
      return
    }

    const item = activeOrder.value.items.find((i) => i.id === orderItemId)
    if (!item) return

    item.quantity = quantity
    activeOrder.value.updatedAt = nowIso()

    // TODO: Replace with real API call
    // await api.patch(`/orders/${activeOrder.value.id}/items/${orderItemId}`, { quantity })
    await new Promise((resolve) => setTimeout(resolve, 150))
  }

  function setDiscount(amount: number): void {
    if (!activeOrder.value) return
    activeOrder.value.discount = Math.max(0, amount)
    activeOrder.value.updatedAt = nowIso()
    // TODO: await api.patch(`/orders/${activeOrder.value.id}`, { discount: amount })
  }

  function setTip(amount: number): void {
    if (!activeOrder.value) return
    activeOrder.value.tip = Math.max(0, amount)
    activeOrder.value.updatedAt = nowIso()
    // TODO: await api.patch(`/orders/${activeOrder.value.id}`, { tip: amount })
  }

  async function sendToKitchen(orderId: string): Promise<void> {
    const order = orders.value.find((o) => o.id === orderId)
    if (order) {
      inventoryStore.deductForOrder(
        orderId,
        order.items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
      )
    }
    await updateOrderStatus(orderId, 'sent')
  }

  async function updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<void> {
    const order = orders.value.find((o) => o.id === orderId)
    if (!order) return

    const previousStatus = order.status
    order.status = status
    order.updatedAt = nowIso()

    // Sync active order if it is the one being updated
    if (activeOrder.value?.id === orderId) {
      activeOrder.value.status = status
      activeOrder.value.updatedAt = order.updatedAt
    }

    try {
      // TODO: Replace with real API call
      // await api.patch(`/orders/${orderId}/status`, { status })
      await new Promise((resolve) => setTimeout(resolve, 300))
    } catch (err) {
      order.status = previousStatus
      order.updatedAt = nowIso()
      if (activeOrder.value?.id === orderId) {
        activeOrder.value.status = previousStatus
      }
      error.value =
        err instanceof Error ? err.message : 'Failed to update order status.'
      throw err
    }
  }

  async function processPayment(
    orderId: string,
    method: PaymentMethod,
    amount: number,
  ): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // TODO: Replace with real API call
      // await api.post(`/orders/${orderId}/payment`, { method, amount })
      await new Promise((resolve) => setTimeout(resolve, 800))

      await updateOrderStatus(orderId, 'paid')

      const order = orders.value.find((o) => o.id === orderId)
      if (order?.tableId) {
        await tablesStore.updateStatus(order.tableId, 'cleaning')
      }

      if (activeOrder.value?.id === orderId) {
        activeOrder.value = null
      }

      // Suppress unused-variable warning for `method` and `amount` until real API is wired
      void method
      void amount
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Payment processing failed.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function cancelOrder(orderId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // TODO: Replace with real API call
      // await api.patch(`/orders/${orderId}/cancel`)
      await new Promise((resolve) => setTimeout(resolve, 400))

      await updateOrderStatus(orderId, 'cancelled')

      const order = orders.value.find((o) => o.id === orderId)
      if (order?.tableId) {
        await tablesStore.updateStatus(order.tableId, 'available')
      }

      if (activeOrder.value?.id === orderId) {
        activeOrder.value = null
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to cancel order.'
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
    const found = orders.value.find((o) => o.id === orderId)
    activeOrder.value = found ?? null
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
