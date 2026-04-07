<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useReportsStore } from '@/stores/reports'
import Card from '@/components/ui/card.vue'
import CardHeader from '@/components/ui/card-header.vue'
import CardTitle from '@/components/ui/card-title.vue'
import CardContent from '@/components/ui/card-content.vue'
import Badge from '@/components/ui/badge.vue'
import Progress from '@/components/ui/progress.vue'
import Button from '@/components/ui/button.vue'
import Tabs from '@/components/ui/tabs.vue'
import TabsList from '@/components/ui/tabs-list.vue'
import TabsTrigger from '@/components/ui/tabs-trigger.vue'
import { cn } from '@/lib/utils'
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Clock,
  Star,
  Loader2,
  BarChart2,
  Users,
  CreditCard,
  ArrowUpRight,
} from 'lucide-vue-next'

const reportsStore = useReportsStore()

// ── Date range ────────────────────────────────────────────────────────────
type RangeKey = 'today' | 'week' | 'month'
const selectedRange = ref<RangeKey>('today')

const rangeLabels: Record<RangeKey, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
}

async function loadReport(range: RangeKey) {
  if (range === 'today') {
    await reportsStore.fetchTodayReport()
  } else if (range === 'week') {
    await reportsStore.fetchWeeklyReport()
  } else {
    await reportsStore.fetchTodayReport() // placeholder for month
  }
}

onMounted(() => loadReport('today'))
watch(selectedRange, (r) => loadReport(r))

// ── Derived stats ──────────────────────────────────────────────────────────
const sales = computed(() => reportsStore.dailySales)
const weekly = computed(() => reportsStore.weeklySummary)

const displayRevenue = computed(() => {
  if (selectedRange.value === 'week' && weekly.value) return weekly.value.totalRevenue
  return sales.value?.totalRevenue ?? 0
})

const displayOrders = computed(() => {
  if (selectedRange.value === 'week' && weekly.value) return weekly.value.totalOrders
  return sales.value?.totalOrders ?? 0
})

const displayAvgOrder = computed(() => {
  if (selectedRange.value === 'week' && weekly.value)
    return weekly.value.totalOrders > 0
      ? weekly.value.totalRevenue / weekly.value.totalOrders
      : 0
  return sales.value?.averageOrderValue ?? 0
})

// ── Hourly chart ───────────────────────────────────────────────────────────
const maxHourlySales = computed(() => {
  if (!reportsStore.hourlyData.length) return 1
  return Math.max(...reportsStore.hourlyData.map((h) => h.sales))
})

function barHeight(sales: number): string {
  const pct = (sales / maxHourlySales.value) * 100
  return `${Math.max(pct, 2)}%`
}

const peakHour = computed(() => {
  if (!reportsStore.hourlyData.length) return '—'
  const peak = reportsStore.hourlyData.reduce((a, b) => (a.sales > b.sales ? a : b))
  return peak.hour
})

// ── Popular items ──────────────────────────────────────────────────────────
const maxItemOrders = computed(() => {
  if (!reportsStore.popularItems.length) return 1
  return Math.max(...reportsStore.popularItems.map((i) => i.quantitySold))
})

// ── Server stats rating bar ────────────────────────────────────────────────
const maxServerSales = computed(() => {
  if (!reportsStore.serverStats.length) return 1
  return Math.max(...reportsStore.serverStats.map((s) => s.totalSales))
})

function serverRatingPct(totalSales: number): number {
  return Math.round((totalSales / maxServerSales.value) * 100)
}

// ── Recent transactions (mock) ─────────────────────────────────────────────
interface TxRow {
  id: string
  table: string
  items: number
  total: number
  method: string
  time: string
}

const recentTransactions: TxRow[] = [
  { id: 'TXN-4821', table: 'Table 3', items: 4, total: 87.5, method: 'Card', time: '21:34' },
  { id: 'TXN-4820', table: 'Table 7', items: 2, total: 46.0, method: 'Cash', time: '21:11' },
  { id: 'TXN-4819', table: 'Takeaway', items: 1, total: 18.0, method: 'Digital', time: '20:58' },
  { id: 'TXN-4818', table: 'Table 1', items: 6, total: 134.5, method: 'Card', time: '20:43' },
  { id: 'TXN-4817', table: 'Table 9', items: 3, total: 62.25, method: 'Card', time: '20:29' },
  { id: 'TXN-4816', table: 'Table 2', items: 2, total: 39.0, method: 'Digital', time: '20:05' },
]

const methodColor: Record<string, string> = {
  Card: 'bg-blue-100 text-blue-700',
  Cash: 'bg-green-100 text-green-700',
  Digital: 'bg-purple-100 text-purple-700',
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6 bg-background min-h-screen">
    <!-- Header + range selector -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold">Reports & Analytics</h1>
        <p class="text-sm text-muted-foreground mt-0.5">{{ rangeLabels[selectedRange] }} overview</p>
      </div>

      <Tabs :model-value="selectedRange" @update:model-value="selectedRange = $event as RangeKey">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>

    <!-- Loading overlay -->
    <div
      v-if="reportsStore.loading"
      class="fixed inset-0 bg-background/60 z-20 flex items-center justify-center"
    >
      <Loader2 class="w-10 h-10 animate-spin text-primary" />
    </div>

    <!-- ── Top stats cards ──────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Revenue -->
      <Card>
        <CardContent class="p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-muted-foreground">Total Revenue</span>
            <div class="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
              <DollarSign class="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p class="text-2xl font-bold">${{ displayRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</p>
          <p class="text-xs text-green-600 flex items-center gap-0.5 mt-1">
            <ArrowUpRight class="w-3 h-3" /> +12% vs yesterday
          </p>
        </CardContent>
      </Card>

      <!-- Orders -->
      <Card>
        <CardContent class="p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-muted-foreground">Total Orders</span>
            <div class="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
              <ShoppingCart class="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p class="text-2xl font-bold">{{ displayOrders }}</p>
          <p class="text-xs text-blue-600 flex items-center gap-0.5 mt-1">
            <ArrowUpRight class="w-3 h-3" /> +8% vs yesterday
          </p>
        </CardContent>
      </Card>

      <!-- Avg order -->
      <Card>
        <CardContent class="p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-muted-foreground">Avg Order Value</span>
            <div class="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
              <TrendingUp class="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p class="text-2xl font-bold">${{ displayAvgOrder.toFixed(2) }}</p>
          <p class="text-xs text-amber-600 flex items-center gap-0.5 mt-1">
            <ArrowUpRight class="w-3 h-3" /> +3% vs yesterday
          </p>
        </CardContent>
      </Card>

      <!-- Peak hour -->
      <Card>
        <CardContent class="p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-muted-foreground">Peak Hour</span>
            <div class="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
              <Clock class="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p class="text-2xl font-bold">{{ peakHour }}</p>
          <p class="text-xs text-muted-foreground mt-1">Highest order volume</p>
        </CardContent>
      </Card>
    </div>

    <!-- ── Hourly bar chart ──────────────────────────────────────────────── -->
    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="flex items-center gap-2 text-base">
          <BarChart2 class="w-5 h-5 text-primary" />
          Hourly Sales
        </CardTitle>
      </CardHeader>
      <CardContent class="pt-0 pb-5">
        <div class="relative h-48 flex items-end gap-1.5 px-1 overflow-x-auto">
          <div
            v-for="point in reportsStore.hourlyData"
            :key="point.hour"
            class="flex-1 min-w-[2.25rem] flex flex-col items-center gap-1 group"
          >
            <!-- Hover tooltip -->
            <div
              class="absolute -top-2 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-md px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-md"
            >
              <p class="font-semibold">{{ point.hour }}</p>
              <p>${{ point.sales.toFixed(0) }}</p>
              <p>{{ point.orders }} orders</p>
            </div>

            <!-- Bar -->
            <div class="w-full flex items-end" style="height: 160px">
              <div
                class="w-full rounded-t-sm bg-primary/80 hover:bg-primary transition-colors cursor-default"
                :style="{ height: barHeight(point.sales) }"
              />
            </div>

            <!-- Hour label -->
            <span class="text-[10px] text-muted-foreground">{{ point.hour.slice(0, 2) }}</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- ── Popular items ─────────────────────────────────────────────── -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2 text-base">
            <Star class="w-5 h-5 text-amber-500" />
            Popular Items
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4 pt-0">
          <div
            v-for="item in reportsStore.popularItems"
            :key="item.menuItemId"
            class="flex flex-col gap-1.5"
          >
            <div class="flex items-center justify-between text-sm">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {{ item.rank }}
                </span>
                <span class="font-medium">{{ item.name }}</span>
                <Badge variant="outline" class="text-xs py-0">{{ item.category }}</Badge>
              </div>
              <div class="text-right shrink-0">
                <p class="font-semibold">${{ item.revenue.toLocaleString() }}</p>
                <p class="text-xs text-muted-foreground">{{ item.quantitySold }} sold</p>
              </div>
            </div>
            <Progress
              :model-value="Math.round((item.quantitySold / maxItemOrders) * 100)"
              class="h-1.5"
            />
          </div>
        </CardContent>
      </Card>

      <!-- ── Server performance ─────────────────────────────────────────── -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2 text-base">
            <Users class="w-5 h-5 text-blue-500" />
            Server Performance
          </CardTitle>
        </CardHeader>
        <CardContent class="pt-0">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border">
                  <th class="text-left pb-2 font-medium text-muted-foreground">Server</th>
                  <th class="text-right pb-2 font-medium text-muted-foreground">Orders</th>
                  <th class="text-right pb-2 font-medium text-muted-foreground">Avg</th>
                  <th class="text-right pb-2 font-medium text-muted-foreground">Tips</th>
                  <th class="pb-2 font-medium text-muted-foreground pl-4">Rating</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr
                  v-for="server in reportsStore.serverStats"
                  :key="server.serverId"
                  class="hover:bg-muted/30 transition-colors"
                >
                  <td class="py-2.5 font-medium">{{ server.name }}</td>
                  <td class="py-2.5 text-right">{{ server.ordersServed }}</td>
                  <td class="py-2.5 text-right">${{ server.averageOrderValue.toFixed(2) }}</td>
                  <td class="py-2.5 text-right text-green-600">${{ server.tipsEarned.toFixed(0) }}</td>
                  <td class="py-2.5 pl-4 w-24">
                    <Progress
                      :model-value="serverRatingPct(server.totalSales)"
                      class="h-2"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- ── Recent transactions ────────────────────────────────────────── -->
    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="flex items-center gap-2 text-base">
          <CreditCard class="w-5 h-5 text-gray-500" />
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent class="pt-0">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left pb-2 font-medium text-muted-foreground">Order ID</th>
                <th class="text-left pb-2 font-medium text-muted-foreground">Table</th>
                <th class="text-right pb-2 font-medium text-muted-foreground">Items</th>
                <th class="text-right pb-2 font-medium text-muted-foreground">Total</th>
                <th class="text-left pb-2 font-medium text-muted-foreground pl-4">Method</th>
                <th class="text-right pb-2 font-medium text-muted-foreground">Time</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr
                v-for="tx in recentTransactions"
                :key="tx.id"
                class="hover:bg-muted/30 transition-colors"
              >
                <td class="py-2.5 font-mono text-xs text-muted-foreground">{{ tx.id }}</td>
                <td class="py-2.5 font-medium">{{ tx.table }}</td>
                <td class="py-2.5 text-right text-muted-foreground">{{ tx.items }}</td>
                <td class="py-2.5 text-right font-semibold">${{ tx.total.toFixed(2) }}</td>
                <td class="py-2.5 pl-4">
                  <span :class="cn('text-xs font-medium px-2 py-0.5 rounded-full', methodColor[tx.method] ?? 'bg-gray-100 text-gray-700')">
                    {{ tx.method }}
                  </span>
                </td>
                <td class="py-2.5 text-right text-muted-foreground font-mono text-xs">{{ tx.time }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
