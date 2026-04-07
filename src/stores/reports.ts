import { defineStore } from 'pinia'
import { ref } from 'vue'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HourlyDataPoint {
  hour: string   // e.g. "09:00"
  sales: number
  orders: number
}

export interface PopularItem {
  rank: number
  menuItemId: string
  name: string
  category: string
  quantitySold: number
  revenue: number
}

export interface ServerStat {
  serverId: string
  name: string
  ordersServed: number
  totalSales: number
  averageOrderValue: number
  tipsEarned: number
}

export interface DailySales {
  date: string           // ISO date string "YYYY-MM-DD"
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  totalTax: number
  totalTips: number
  totalDiscounts: number
  paymentBreakdown: {
    cash: number
    card: number
    digital: number
  }
}

export interface WeeklySummary {
  startDate: string
  endDate: string
  days: DailySales[]
  totalRevenue: number
  totalOrders: number
  bestDay: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Seeded pseudo-random number for reproducible mock data. */
function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10_000
  return x - Math.floor(x)
}

function buildHourlyData(baseSeed: number): HourlyDataPoint[] {
  const hours = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00',
  ]
  // Lunch and dinner peaks
  const peakMultipliers: Record<string, number> = {
    '12:00': 2.4,
    '13:00': 2.8,
    '14:00': 1.8,
    '19:00': 2.2,
    '20:00': 2.6,
    '21:00': 2.0,
  }

  return hours.map((hour, idx) => {
    const multiplier = peakMultipliers[hour] ?? 1.0
    const base = seededRand(baseSeed + idx)
    const orders = Math.round((3 + base * 6) * multiplier)
    const sales = parseFloat(((18 + base * 40) * multiplier * orders).toFixed(2))
    return { hour, sales, orders }
  })
}

function buildDailySales(dateStr: string, seed: number): DailySales {
  const r = (offset: number) => seededRand(seed + offset)
  const totalOrders = Math.round(40 + r(1) * 60)
  const averageOrderValue = parseFloat((22 + r(2) * 28).toFixed(2))
  const totalRevenue = parseFloat((totalOrders * averageOrderValue).toFixed(2))
  const totalTax = parseFloat((totalRevenue * 0.08).toFixed(2))
  const totalTips = parseFloat((totalRevenue * (0.12 + r(3) * 0.08)).toFixed(2))
  const totalDiscounts = parseFloat((totalRevenue * r(4) * 0.05).toFixed(2))
  const cardFrac = 0.55 + r(5) * 0.2
  const digitalFrac = 0.1 + r(6) * 0.15
  const cashFrac = 1 - cardFrac - digitalFrac

  return {
    date: dateStr,
    totalRevenue,
    totalOrders,
    averageOrderValue,
    totalTax,
    totalTips,
    totalDiscounts,
    paymentBreakdown: {
      cash: parseFloat((totalRevenue * cashFrac).toFixed(2)),
      card: parseFloat((totalRevenue * cardFrac).toFixed(2)),
      digital: parseFloat((totalRevenue * digitalFrac).toFixed(2)),
    },
  }
}

function isoDate(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

const MOCK_POPULAR_ITEMS: PopularItem[] = [
  {
    rank: 1,
    menuItemId: 'itm-mai-001',
    name: 'Grilled Ribeye Steak',
    category: 'Mains',
    quantitySold: 84,
    revenue: 3192.0,
  },
  {
    rank: 2,
    menuItemId: 'itm-bev-002',
    name: 'Cappuccino',
    category: 'Beverages',
    quantitySold: 210,
    revenue: 997.5,
  },
  {
    rank: 3,
    menuItemId: 'itm-mai-004',
    name: 'Margherita Pizza',
    category: 'Mains',
    quantitySold: 76,
    revenue: 1368.0,
  },
  {
    rank: 4,
    menuItemId: 'itm-des-002',
    name: 'Chocolate Lava Cake',
    category: 'Desserts',
    quantitySold: 68,
    revenue: 748.0,
  },
  {
    rank: 5,
    menuItemId: 'itm-mai-002',
    name: 'Pan-Seared Salmon',
    category: 'Mains',
    quantitySold: 61,
    revenue: 1586.0,
  },
]

const MOCK_SERVER_STATS: ServerStat[] = [
  {
    serverId: 'usr-002',
    name: 'Jane Waiter',
    ordersServed: 124,
    totalSales: 4820.5,
    averageOrderValue: 38.87,
    tipsEarned: 578.46,
  },
  {
    serverId: 'usr-003',
    name: 'Mike Floor',
    ordersServed: 98,
    totalSales: 3540.0,
    averageOrderValue: 36.12,
    tipsEarned: 425.0,
  },
  {
    serverId: 'usr-004',
    name: 'Alice Cashier',
    ordersServed: 87,
    totalSales: 3210.75,
    averageOrderValue: 36.91,
    tipsEarned: 385.0,
  },
]

// ─── Store ────────────────────────────────────────────────────────────────────

export const useReportsStore = defineStore('reports', () => {
  const dailySales = ref<DailySales | null>(null)
  const popularItems = ref<PopularItem[]>([])
  const serverStats = ref<ServerStat[]>([])
  const hourlyData = ref<HourlyDataPoint[]>([])
  const weeklySummary = ref<WeeklySummary | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── Actions ───────────────────────────────────────────────────────────────

  async function fetchDailyReport(date: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // TODO: Replace with real API call
      // const response = await api.get('/reports/daily', { params: { date } })
      await new Promise((resolve) => setTimeout(resolve, 700))

      // Use date string as seed so the same date always yields the same numbers
      const seed = date
        .split('-')
        .reduce((acc, part) => acc + parseInt(part, 10), 0)

      dailySales.value = buildDailySales(date, seed)
      hourlyData.value = buildHourlyData(seed)
      popularItems.value = MOCK_POPULAR_ITEMS
      serverStats.value = MOCK_SERVER_STATS
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch daily report.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchWeeklyReport(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // TODO: Replace with real API call
      // const response = await api.get('/reports/weekly')
      await new Promise((resolve) => setTimeout(resolve, 900))

      const days: DailySales[] = []
      let totalRevenue = 0
      let totalOrders = 0
      let bestDay = ''
      let bestRevenue = 0

      for (let i = -6; i <= 0; i++) {
        const dateStr = isoDate(i)
        const seed = dateStr
          .split('-')
          .reduce((acc, part) => acc + parseInt(part, 10), 0)
        const day = buildDailySales(dateStr, seed)
        days.push(day)
        totalRevenue += day.totalRevenue
        totalOrders += day.totalOrders
        if (day.totalRevenue > bestRevenue) {
          bestRevenue = day.totalRevenue
          bestDay = dateStr
        }
      }

      weeklySummary.value = {
        startDate: isoDate(-6),
        endDate: isoDate(0),
        days,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalOrders,
        bestDay,
      }

      popularItems.value = MOCK_POPULAR_ITEMS
      serverStats.value = MOCK_SERVER_STATS
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch weekly report.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTodayReport(): Promise<void> {
    await fetchDailyReport(isoDate(0))
  }

  return {
    // State
    dailySales,
    popularItems,
    serverStats,
    hourlyData,
    weeklySummary,
    loading,
    error,
    // Actions
    fetchDailyReport,
    fetchWeeklyReport,
    fetchTodayReport,
  }
})
