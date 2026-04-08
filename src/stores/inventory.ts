import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// ─── Types ────────────────────────────────────────────────────────────────────

export type StockStatus = 'ok' | 'low' | 'critical' | 'out'
export type MovementType = 'deduction' | 'restock' | 'adjustment' | 'waste'

export interface InventoryItem {
  id: string
  name: string
  category: 'ingredient' | 'beverage' | 'packaging' | 'cleaning'
  unit: string           // 'kg', 'liters', 'pieces', 'portions', 'bottles'
  currentStock: number
  minStock: number       // low stock threshold
  maxStock: number       // full capacity
  costPerUnit: number    // cost in $
  linkedMenuItems: { menuItemId: string; usagePerOrder: number }[]
  lastUpdated: string    // ISO date
  supplier?: string
}

export interface StockMovement {
  id: string
  inventoryItemId: string
  inventoryItemName: string
  type: MovementType
  quantity: number       // positive=added, negative=removed
  reason: string
  orderId?: string
  timestamp: string
  performedBy: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function nowIso(): string {
  return new Date().toISOString()
}

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function hoursAgo(hours: number): string {
  const d = new Date()
  d.setHours(d.getHours() - hours)
  return d.toISOString()
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_INVENTORY: InventoryItem[] = [
  // ── Beverages ──────────────────────────────────────────────────────────────
  {
    id: 'inv-001',
    name: 'Coffee Beans',
    category: 'ingredient',
    unit: 'kg',
    currentStock: 2.4,
    minStock: 1.0,
    maxStock: 10.0,
    costPerUnit: 18.0,
    linkedMenuItems: [
      { menuItemId: 'itm-bev-001', usagePerOrder: 0.018 },
      { menuItemId: 'itm-bev-002', usagePerOrder: 0.02 },
    ],
    lastUpdated: daysAgo(1),
    supplier: 'Artisan Roasters Co.',
  },
  {
    id: 'inv-002',
    name: 'Whole Milk',
    category: 'ingredient',
    unit: 'liters',
    currentStock: 8.5,
    minStock: 5.0,
    maxStock: 20.0,
    costPerUnit: 1.8,
    linkedMenuItems: [
      { menuItemId: 'itm-bev-002', usagePerOrder: 0.2 },
    ],
    lastUpdated: daysAgo(0),
    supplier: 'Valley Dairy Farm',
  },
  {
    id: 'inv-003',
    name: 'Oranges',
    category: 'ingredient',
    unit: 'kg',
    currentStock: 3.2,
    minStock: 2.0,
    maxStock: 15.0,
    costPerUnit: 2.5,
    linkedMenuItems: [
      { menuItemId: 'itm-bev-003', usagePerOrder: 0.3 },
    ],
    lastUpdated: daysAgo(2),
    supplier: 'Fresh Produce Direct',
  },
  {
    id: 'inv-004',
    name: 'Sparkling Water 330ml',
    category: 'beverage',
    unit: 'bottles',
    currentStock: 48,
    minStock: 24,
    maxStock: 144,
    costPerUnit: 0.85,
    linkedMenuItems: [
      { menuItemId: 'itm-bev-004', usagePerOrder: 1 },
    ],
    lastUpdated: daysAgo(3),
    supplier: 'AquaPure Beverages',
  },

  // ── Starters ───────────────────────────────────────────────────────────────
  {
    id: 'inv-005',
    name: 'Sourdough Bread',
    category: 'ingredient',
    unit: 'portions',
    currentStock: 8,
    minStock: 10,
    maxStock: 40,
    costPerUnit: 1.2,
    linkedMenuItems: [
      { menuItemId: 'itm-sta-001', usagePerOrder: 2 },
    ],
    lastUpdated: daysAgo(0),
    supplier: 'Artisan Bakehouse',
  },
  {
    id: 'inv-006',
    name: 'Squid / Calamari',
    category: 'ingredient',
    unit: 'kg',
    currentStock: 1.8,
    minStock: 1.0,
    maxStock: 5.0,
    costPerUnit: 14.0,
    linkedMenuItems: [
      { menuItemId: 'itm-sta-002', usagePerOrder: 0.2 },
    ],
    lastUpdated: daysAgo(1),
    supplier: 'Harbor Fresh Seafood',
  },
  {
    id: 'inv-007',
    name: 'Romaine Lettuce',
    category: 'ingredient',
    unit: 'kg',
    currentStock: 0,
    minStock: 1.0,
    maxStock: 5.0,
    costPerUnit: 3.5,
    linkedMenuItems: [
      { menuItemId: 'itm-sta-003', usagePerOrder: 0.15 },
    ],
    lastUpdated: daysAgo(1),
    supplier: 'Fresh Produce Direct',
  },

  // ── Mains ──────────────────────────────────────────────────────────────────
  {
    id: 'inv-008',
    name: 'Ribeye Steak',
    category: 'ingredient',
    unit: 'kg',
    currentStock: 4.2,
    minStock: 2.0,
    maxStock: 12.0,
    costPerUnit: 32.0,
    linkedMenuItems: [
      { menuItemId: 'itm-mai-001', usagePerOrder: 0.35 },
    ],
    lastUpdated: daysAgo(1),
    supplier: 'Prime Cut Meats',
  },
  {
    id: 'inv-009',
    name: 'Atlantic Salmon',
    category: 'ingredient',
    unit: 'kg',
    currentStock: 1.1,
    minStock: 1.5,
    maxStock: 8.0,
    costPerUnit: 22.0,
    linkedMenuItems: [
      { menuItemId: 'itm-mai-002', usagePerOrder: 0.25 },
    ],
    lastUpdated: daysAgo(0),
    supplier: 'Harbor Fresh Seafood',
  },
  {
    id: 'inv-010',
    name: 'Arborio Rice',
    category: 'ingredient',
    unit: 'kg',
    currentStock: 3.5,
    minStock: 1.0,
    maxStock: 8.0,
    costPerUnit: 4.5,
    linkedMenuItems: [
      { menuItemId: 'itm-mai-003', usagePerOrder: 0.12 },
    ],
    lastUpdated: daysAgo(4),
    supplier: 'Italian Imports Ltd.',
  },
  {
    id: 'inv-011',
    name: 'Pizza Dough',
    category: 'ingredient',
    unit: 'portions',
    currentStock: 12,
    minStock: 8,
    maxStock: 30,
    costPerUnit: 1.5,
    linkedMenuItems: [
      { menuItemId: 'itm-mai-004', usagePerOrder: 1 },
    ],
    lastUpdated: daysAgo(0),
    supplier: 'Artisan Bakehouse',
  },
  {
    id: 'inv-012',
    name: 'Beef Patties',
    category: 'ingredient',
    unit: 'pieces',
    currentStock: 6,
    minStock: 8,
    maxStock: 40,
    costPerUnit: 4.8,
    linkedMenuItems: [
      { menuItemId: 'itm-mai-005', usagePerOrder: 1 },
    ],
    lastUpdated: daysAgo(0),
    supplier: 'Prime Cut Meats',
  },

  // ── Desserts ───────────────────────────────────────────────────────────────
  {
    id: 'inv-013',
    name: 'Mascarpone',
    category: 'ingredient',
    unit: 'kg',
    currentStock: 0.9,
    minStock: 0.5,
    maxStock: 3.0,
    costPerUnit: 12.0,
    linkedMenuItems: [
      { menuItemId: 'itm-des-001', usagePerOrder: 0.08 },
    ],
    lastUpdated: daysAgo(2),
    supplier: 'Italian Imports Ltd.',
  },
  {
    id: 'inv-014',
    name: 'Dark Chocolate',
    category: 'ingredient',
    unit: 'kg',
    currentStock: 1.2,
    minStock: 0.5,
    maxStock: 4.0,
    costPerUnit: 16.0,
    linkedMenuItems: [
      { menuItemId: 'itm-des-002', usagePerOrder: 0.1 },
    ],
    lastUpdated: daysAgo(3),
    supplier: 'Gourmet Pantry Supplies',
  },
  {
    id: 'inv-015',
    name: 'Heavy Cream',
    category: 'ingredient',
    unit: 'liters',
    currentStock: 2.8,
    minStock: 1.0,
    maxStock: 8.0,
    costPerUnit: 3.2,
    linkedMenuItems: [
      { menuItemId: 'itm-des-002', usagePerOrder: 0.05 },
      { menuItemId: 'itm-des-003', usagePerOrder: 0.15 },
    ],
    lastUpdated: daysAgo(1),
    supplier: 'Valley Dairy Farm',
  },

  // ── Packaging ──────────────────────────────────────────────────────────────
  {
    id: 'inv-016',
    name: 'Disposable Cups',
    category: 'packaging',
    unit: 'pieces',
    currentStock: 180,
    minStock: 50,
    maxStock: 500,
    costPerUnit: 0.12,
    linkedMenuItems: [],
    lastUpdated: daysAgo(5),
    supplier: 'PackRight Solutions',
  },
  {
    id: 'inv-017',
    name: 'Paper Napkins',
    category: 'packaging',
    unit: 'pieces',
    currentStock: 320,
    minStock: 100,
    maxStock: 1000,
    costPerUnit: 0.03,
    linkedMenuItems: [],
    lastUpdated: daysAgo(5),
    supplier: 'PackRight Solutions',
  },

  // ── Cleaning ───────────────────────────────────────────────────────────────
  {
    id: 'inv-018',
    name: 'Dish Soap',
    category: 'cleaning',
    unit: 'liters',
    currentStock: 1.5,
    minStock: 1.0,
    maxStock: 5.0,
    costPerUnit: 4.0,
    linkedMenuItems: [],
    lastUpdated: daysAgo(7),
    supplier: 'CleanPro Supplies',
  },
]

const MOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov-001',
    inventoryItemId: 'inv-001',
    inventoryItemName: 'Coffee Beans',
    type: 'restock',
    quantity: 5.0,
    reason: 'Weekly delivery from Artisan Roasters Co.',
    timestamp: daysAgo(2),
    performedBy: 'Admin',
  },
  {
    id: 'mov-002',
    inventoryItemId: 'inv-007',
    inventoryItemName: 'Romaine Lettuce',
    type: 'waste',
    quantity: -1.5,
    reason: 'Spoilage — lettuce past use-by date',
    timestamp: hoursAgo(6),
    performedBy: 'Chef Marco',
  },
  {
    id: 'mov-003',
    inventoryItemId: 'inv-008',
    inventoryItemName: 'Ribeye Steak',
    type: 'deduction',
    quantity: -1.05,
    reason: 'Order fulfilment',
    orderId: 'ord-002',
    timestamp: hoursAgo(2),
    performedBy: 'System',
  },
  {
    id: 'mov-004',
    inventoryItemId: 'inv-009',
    inventoryItemName: 'Atlantic Salmon',
    type: 'deduction',
    quantity: -0.5,
    reason: 'Order fulfilment',
    orderId: 'ord-004',
    timestamp: hoursAgo(1),
    performedBy: 'System',
  },
  {
    id: 'mov-005',
    inventoryItemId: 'inv-012',
    inventoryItemName: 'Beef Patties',
    type: 'adjustment',
    quantity: -2,
    reason: 'Stock count correction — found 2 missing from freezer',
    timestamp: hoursAgo(3),
    performedBy: 'Manager Sarah',
  },
  {
    id: 'mov-006',
    inventoryItemId: 'inv-005',
    inventoryItemName: 'Sourdough Bread',
    type: 'deduction',
    quantity: -4,
    reason: 'Order fulfilment — table orders',
    orderId: 'ord-001',
    timestamp: hoursAgo(4),
    performedBy: 'System',
  },
  {
    id: 'mov-007',
    inventoryItemId: 'inv-004',
    inventoryItemName: 'Sparkling Water 330ml',
    type: 'restock',
    quantity: 72,
    reason: 'Bi-weekly delivery from AquaPure Beverages',
    timestamp: daysAgo(3),
    performedBy: 'Admin',
  },
  {
    id: 'mov-008',
    inventoryItemId: 'inv-014',
    inventoryItemName: 'Dark Chocolate',
    type: 'restock',
    quantity: 2.0,
    reason: 'Emergency restock — running low before dinner service',
    timestamp: daysAgo(1),
    performedBy: 'Manager Sarah',
  },
]

// ─── Store ────────────────────────────────────────────────────────────────────

export const useInventoryStore = defineStore('inventory', () => {
  const items = ref<InventoryItem[]>([])
  const movements = ref<StockMovement[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── Computed ───────────────────────────────────────────────────────────────

  function stockStatus(item: InventoryItem): StockStatus {
    if (item.currentStock === 0) return 'out'
    if (item.currentStock <= item.minStock) return 'critical'
    if (item.currentStock <= item.minStock * 1.5) return 'low'
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
      (i) =>
        i.currentStock > i.minStock &&
        i.currentStock <= i.minStock * 1.5,
    ),
  )

  const totalInventoryValue = computed(() =>
    items.value.reduce((sum, i) => sum + i.currentStock * i.costPerUnit, 0),
  )

  const alertCount = computed(
    () =>
      lowStockItems.value.length +
      outOfStockItems.value.length +
      criticalItems.value.length,
  )

  // ── Actions ────────────────────────────────────────────────────────────────

  async function fetchInventory(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      items.value = MOCK_INVENTORY.map((item) => ({ ...item, linkedMenuItems: item.linkedMenuItems.map((l) => ({ ...l })) }))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load inventory.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchMovements(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      movements.value = MOCK_MOVEMENTS.map((m) => ({ ...m }))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load movements.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function restockItem(id: string, quantity: number, notes?: string): Promise<void> {
    const item = items.value.find((i) => i.id === id)
    if (!item) return

    await new Promise((resolve) => setTimeout(resolve, 300))

    const clamped = Math.min(item.currentStock + quantity, item.maxStock)
    const actual = clamped - item.currentStock
    item.currentStock = clamped
    item.lastUpdated = nowIso()

    movements.value.unshift({
      id: generateId('mov'),
      inventoryItemId: id,
      inventoryItemName: item.name,
      type: 'restock',
      quantity: actual,
      reason: notes ?? 'Manual restock',
      timestamp: nowIso(),
      performedBy: 'Manager',
    })
  }

  async function adjustStock(
    id: string,
    quantity: number,
    type: MovementType,
    reason: string,
  ): Promise<void> {
    const item = items.value.find((i) => i.id === id)
    if (!item) return

    await new Promise((resolve) => setTimeout(resolve, 300))

    const newStock = Math.min(Math.max(item.currentStock + quantity, 0), item.maxStock)
    const actual = newStock - item.currentStock
    item.currentStock = newStock
    item.lastUpdated = nowIso()

    movements.value.unshift({
      id: generateId('mov'),
      inventoryItemId: id,
      inventoryItemName: item.name,
      type,
      quantity: actual,
      reason,
      timestamp: nowIso(),
      performedBy: 'Manager',
    })
  }

  function deductForOrder(
    orderId: string,
    orderItems: { menuItemId: string; quantity: number }[],
  ): void {
    for (const orderItem of orderItems) {
      const linked = items.value.filter((inv) =>
        inv.linkedMenuItems.some((l) => l.menuItemId === orderItem.menuItemId),
      )

      for (const invItem of linked) {
        const link = invItem.linkedMenuItems.find(
          (l) => l.menuItemId === orderItem.menuItemId,
        )
        if (!link) continue

        const deduction = link.usagePerOrder * orderItem.quantity
        const previous = invItem.currentStock
        invItem.currentStock = Math.max(invItem.currentStock - deduction, 0)
        const actual = previous - invItem.currentStock
        invItem.lastUpdated = nowIso()

        if (actual > 0) {
          movements.value.unshift({
            id: generateId('mov'),
            inventoryItemId: invItem.id,
            inventoryItemName: invItem.name,
            type: 'deduction',
            quantity: -actual,
            reason: 'Order fulfilment',
            orderId,
            timestamp: nowIso(),
            performedBy: 'System',
          })
        }
      }
    }
  }

  async function addInventoryItem(
    data: Omit<InventoryItem, 'id' | 'lastUpdated'>,
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 400))

    const newItem: InventoryItem = {
      ...data,
      id: generateId('inv'),
      lastUpdated: nowIso(),
    }

    items.value.push(newItem)
  }

  async function updateInventoryItem(
    id: string,
    data: Partial<Omit<InventoryItem, 'id'>>,
  ): Promise<void> {
    const index = items.value.findIndex((i) => i.id === id)
    if (index === -1) return

    await new Promise((resolve) => setTimeout(resolve, 300))

    items.value[index] = {
      ...items.value[index],
      ...data,
      lastUpdated: nowIso(),
    } as InventoryItem
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
    deductForOrder,
    addInventoryItem,
    updateInventoryItem,
  }
})
