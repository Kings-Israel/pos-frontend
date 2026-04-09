import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HourlyDataPoint {
  hour: string // e.g. "09:00"
  revenue: number
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
  date: string // "YYYY-MM-DD"
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

/**
 * A single paid order row shown in the Recent Transactions table.
 * Returned by GET /reports/daily as part of the daily report payload.
 */
export interface RecentTransaction {
  /** Payment / order identifier, e.g. "PAY-4821" */
  id: string
  /** Human-readable table label, e.g. "Table 3" or "Takeaway" */
  tableName: string
  /** Total number of line items in the order */
  itemCount: number
  /** Total amount charged (subtotal + tax + tip − discount) */
  total: number
  /** Payment method used */
  method: 'cash' | 'card' | 'digital'
  /** ISO 8601 timestamp of when payment was processed */
  processedAt: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isoDate(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useReportsStore = defineStore('reports', () => {
  const dailySales         = ref<DailySales | null>(null)
  const popularItems       = ref<PopularItem[]>([])
  const serverStats        = ref<ServerStat[]>([])
  const hourlyData         = ref<HourlyDataPoint[]>([])
  const weeklySummary      = ref<WeeklySummary | null>(null)
  const recentTransactions = ref<RecentTransaction[]>([])
  const loading            = ref(false)
  const error              = ref<string | null>(null)

  // ── Actions ───────────────────────────────────────────────────────────────

  async function fetchDailyReport(date: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const data = await api.get<{
        summary:              DailySales
        hourly:               HourlyDataPoint[]
        popularItems:         PopularItem[]
        serverStats:          ServerStat[]
        recentTransactions:   RecentTransaction[]
      }>(`/reports/daily?date=${date}`)

      dailySales.value         = data.summary
      hourlyData.value         = data.hourly
      popularItems.value       = data.popularItems
      serverStats.value        = data.serverStats
      recentTransactions.value = data.recentTransactions ?? []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch daily report.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchWeeklyReport(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const data = await api.get<{
        summary: WeeklySummary
        popularItems: PopularItem[]
        serverStats: ServerStat[]
      }>('/reports/weekly')

      weeklySummary.value = data.summary
      popularItems.value = data.popularItems
      serverStats.value = data.serverStats
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch weekly report.'
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
    recentTransactions,
    loading,
    error,
    // Actions
    fetchDailyReport,
    fetchWeeklyReport,
    fetchTodayReport,
  }
})
