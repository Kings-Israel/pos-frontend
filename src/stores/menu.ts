import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
  categoryId: string
  name: string
  description: string
  price: number
  available: boolean
  image?: string
  modifiers: Modifier[]
}

export interface MenuItemUpdatePayload {
  name?: string
  description?: string
  price?: number
  available?: boolean
  image?: string
  modifiers?: Modifier[]
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-bev', name: 'Beverages', color: '#3B82F6', icon: '☕' },
  { id: 'cat-sta', name: 'Starters', color: '#F59E0B', icon: '🥗' },
  { id: 'cat-mai', name: 'Mains', color: '#EF4444', icon: '🍽️' },
  { id: 'cat-des', name: 'Desserts', color: '#8B5CF6', icon: '🍰' },
]

const MOCK_ITEMS: MenuItem[] = [
  // ── Beverages ──────────────────────────────────────────────────────────────
  {
    id: 'itm-bev-001',
    categoryId: 'cat-bev',
    name: 'Espresso',
    description: 'Rich single-origin espresso shot.',
    price: 3.5,
    available: true,
    modifiers: [
      {
        id: 'mod-shots',
        name: 'Shots',
        options: [
          { label: 'Single', priceAdd: 0 },
          { label: 'Double', priceAdd: 1.0 },
          { label: 'Triple', priceAdd: 2.0 },
        ],
      },
    ],
  },
  {
    id: 'itm-bev-002',
    categoryId: 'cat-bev',
    name: 'Cappuccino',
    description: 'Espresso with steamed milk and foam.',
    price: 4.75,
    available: true,
    modifiers: [
      {
        id: 'mod-milk',
        name: 'Milk Type',
        options: [
          { label: 'Whole Milk', priceAdd: 0 },
          { label: 'Oat Milk', priceAdd: 0.75 },
          { label: 'Almond Milk', priceAdd: 0.75 },
          { label: 'Soy Milk', priceAdd: 0.5 },
        ],
      },
      {
        id: 'mod-size',
        name: 'Size',
        options: [
          { label: 'Regular', priceAdd: 0 },
          { label: 'Large', priceAdd: 1.0 },
        ],
      },
    ],
  },
  {
    id: 'itm-bev-003',
    categoryId: 'cat-bev',
    name: 'Fresh Orange Juice',
    description: 'Freshly squeezed Valencia oranges.',
    price: 5.5,
    available: true,
    modifiers: [],
  },
  {
    id: 'itm-bev-004',
    categoryId: 'cat-bev',
    name: 'Sparkling Water',
    description: 'Chilled sparkling mineral water.',
    price: 2.5,
    available: true,
    modifiers: [
      {
        id: 'mod-water-size',
        name: 'Size',
        options: [
          { label: '330ml', priceAdd: 0 },
          { label: '750ml', priceAdd: 1.5 },
        ],
      },
    ],
  },

  // ── Starters ───────────────────────────────────────────────────────────────
  {
    id: 'itm-sta-001',
    categoryId: 'cat-sta',
    name: 'Bruschetta al Pomodoro',
    description: 'Toasted sourdough with heirloom tomatoes, garlic, and basil.',
    price: 9.0,
    available: true,
    modifiers: [
      {
        id: 'mod-extra',
        name: 'Extras',
        options: [
          { label: 'Add Burrata', priceAdd: 3.5 },
          { label: 'Add Prosciutto', priceAdd: 4.0 },
        ],
      },
    ],
  },
  {
    id: 'itm-sta-002',
    categoryId: 'cat-sta',
    name: 'Calamari Fritti',
    description: 'Crispy fried squid rings with lemon aioli.',
    price: 13.5,
    available: true,
    modifiers: [],
  },
  {
    id: 'itm-sta-003',
    categoryId: 'cat-sta',
    name: 'Caesar Salad',
    description:
      'Romaine hearts, house Caesar dressing, Parmesan, house croutons.',
    price: 12.0,
    available: true,
    modifiers: [
      {
        id: 'mod-caesar-protein',
        name: 'Add Protein',
        options: [
          { label: 'No Protein', priceAdd: 0 },
          { label: 'Grilled Chicken', priceAdd: 5.0 },
          { label: 'Grilled Shrimp', priceAdd: 7.0 },
          { label: 'Anchovies', priceAdd: 2.0 },
        ],
      },
    ],
  },
  {
    id: 'itm-sta-004',
    categoryId: 'cat-sta',
    name: 'Soup of the Day',
    description: 'Ask your server for today\'s selection. Served with bread.',
    price: 8.5,
    available: true,
    modifiers: [],
  },

  // ── Mains ──────────────────────────────────────────────────────────────────
  {
    id: 'itm-mai-001',
    categoryId: 'cat-mai',
    name: 'Grilled Ribeye Steak',
    description: '300g dry-aged ribeye, herb butter, seasonal vegetables.',
    price: 38.0,
    available: true,
    modifiers: [
      {
        id: 'mod-steak-cook',
        name: 'Cooking',
        options: [
          { label: 'Rare', priceAdd: 0 },
          { label: 'Medium Rare', priceAdd: 0 },
          { label: 'Medium', priceAdd: 0 },
          { label: 'Medium Well', priceAdd: 0 },
          { label: 'Well Done', priceAdd: 0 },
        ],
      },
      {
        id: 'mod-steak-sauce',
        name: 'Sauce',
        options: [
          { label: 'Peppercorn', priceAdd: 0 },
          { label: 'Béarnaise', priceAdd: 0 },
          { label: 'Red Wine Jus', priceAdd: 0 },
        ],
      },
    ],
  },
  {
    id: 'itm-mai-002',
    categoryId: 'cat-mai',
    name: 'Pan-Seared Salmon',
    description: 'Atlantic salmon, lemon caper butter, crushed new potatoes.',
    price: 26.0,
    available: true,
    modifiers: [
      {
        id: 'mod-salmon-side',
        name: 'Side Swap',
        options: [
          { label: 'Crushed Potatoes', priceAdd: 0 },
          { label: 'Steamed Rice', priceAdd: 0 },
          { label: 'Seasonal Greens', priceAdd: 0 },
        ],
      },
    ],
  },
  {
    id: 'itm-mai-003',
    categoryId: 'cat-mai',
    name: 'Mushroom Risotto',
    description: 'Arborio rice, wild mushrooms, truffle oil, Parmesan.',
    price: 22.0,
    available: true,
    modifiers: [
      {
        id: 'mod-risotto-extra',
        name: 'Extras',
        options: [
          { label: 'Extra Truffle', priceAdd: 4.0 },
          { label: 'Add Chicken', priceAdd: 5.0 },
        ],
      },
    ],
  },
  {
    id: 'itm-mai-004',
    categoryId: 'cat-mai',
    name: 'Margherita Pizza',
    description: 'San Marzano tomato, fior di latte mozzarella, fresh basil.',
    price: 18.0,
    available: true,
    modifiers: [
      {
        id: 'mod-pizza-crust',
        name: 'Crust',
        options: [
          { label: 'Classic', priceAdd: 0 },
          { label: 'Thin & Crispy', priceAdd: 0 },
          { label: 'Gluten-Free Base', priceAdd: 3.0 },
        ],
      },
      {
        id: 'mod-pizza-extras',
        name: 'Extra Toppings',
        options: [
          { label: 'Pepperoni', priceAdd: 2.5 },
          { label: 'Olives', priceAdd: 1.5 },
          { label: 'Mushrooms', priceAdd: 1.5 },
          { label: 'Jalapeños', priceAdd: 1.0 },
        ],
      },
    ],
  },

  // ── Desserts ───────────────────────────────────────────────────────────────
  {
    id: 'itm-des-001',
    categoryId: 'cat-des',
    name: 'Tiramisu',
    description: 'Classic Italian tiramisu with mascarpone and espresso.',
    price: 9.5,
    available: true,
    modifiers: [],
  },
  {
    id: 'itm-des-002',
    categoryId: 'cat-des',
    name: 'Chocolate Lava Cake',
    description:
      'Warm dark chocolate cake with molten centre, vanilla ice cream.',
    price: 11.0,
    available: true,
    modifiers: [
      {
        id: 'mod-lava-ice-cream',
        name: 'Ice Cream Flavour',
        options: [
          { label: 'Vanilla', priceAdd: 0 },
          { label: 'Salted Caramel', priceAdd: 0 },
          { label: 'Mint Choc Chip', priceAdd: 0 },
        ],
      },
    ],
  },
  {
    id: 'itm-des-003',
    categoryId: 'cat-des',
    name: 'Crème Brûlée',
    description: 'Vanilla custard with a crisp caramelised sugar crust.',
    price: 9.0,
    available: true,
    modifiers: [],
  },
  {
    id: 'itm-des-004',
    categoryId: 'cat-des',
    name: 'Seasonal Sorbet (3 scoops)',
    description: 'Three scoops of house-made sorbet. Ask for today\'s flavours.',
    price: 7.5,
    available: false,
    modifiers: [],
  },
]

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
      map[cat.id] = items.value.filter((i) => i.categoryId === cat.id)
    }
    return map
  })

  // ── Actions ───────────────────────────────────────────────────────────────

  async function fetchMenu(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // TODO: Replace with real API call
      // const response = await api.get('/menu')
      await new Promise((resolve) => setTimeout(resolve, 600))

      categories.value = MOCK_CATEGORIES
      items.value = MOCK_ITEMS
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
      // TODO: Replace with real API call
      // await api.patch(`/menu/items/${id}`, { available: item.available })
      await new Promise((resolve) => setTimeout(resolve, 300))
    } catch (err) {
      // Rollback on failure
      item.available = previous
      error.value =
        err instanceof Error ? err.message : 'Failed to update availability.'
      throw err
    }
  }

  async function updateItem(
    id: string,
    data: MenuItemUpdatePayload,
  ): Promise<void> {
    const index = items.value.findIndex((i) => i.id === id)
    if (index === -1) return

    const snapshot = { ...items.value[index] } as MenuItem

    try {
      // TODO: Replace with real API call
      // await api.put(`/menu/items/${id}`, data)
      await new Promise((resolve) => setTimeout(resolve, 400))

      items.value[index] = { ...items.value[index], ...data } as MenuItem
    } catch (err) {
      items.value[index] = snapshot
      error.value = err instanceof Error ? err.message : 'Failed to update item.'
      throw err
    }
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
    updateItem,
    getItemById,
  }
})
