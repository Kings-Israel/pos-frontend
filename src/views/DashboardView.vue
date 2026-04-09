<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useReportsStore } from '@/stores/reports'
import { useOrdersStore } from '@/stores/orders'
import { useTablesStore } from '@/stores/tables'
import Card from '@/components/ui/card.vue'
import CardContent from '@/components/ui/card-content.vue'
import CardHeader from '@/components/ui/card-header.vue'
import CardTitle from '@/components/ui/card-title.vue'
import CardDescription from '@/components/ui/card-description.vue'
import Badge from '@/components/ui/badge.vue'
import Button from '@/components/ui/button.vue'
import Separator from '@/components/ui/separator.vue'
import {
  DollarSign,
  ShoppingBag,
  Table2,
  TrendingUp,
  Plus,
  ChefHat,
  BarChart2,
  ArrowRight,
  Loader2,
  Clock,
  Star,
} from 'lucide-vue-next'

const authStore = useAuthStore()
const reportsStore = useReportsStore()
const ordersStore = useOrdersStore()
const tablesStore = useTablesStore()
const router = useRouter()

// ── Data loading ──────────────────────────────────────────────────────────────

onMounted(async () => {
  await Promise.all([
    reportsStore.fetchTodayReport(),
    ordersStore.fetchOrders(),
    tablesStore.fetchTables(),
  ])
})

// ── Computed ──────────────────────────────────────────────────────────────────

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
})

const firstName = computed(() => authStore.user?.name?.split(' ')[0] ?? 'there')

const stats = computed(() => {
  const daily = reportsStore.dailySales
  return [
    {
      label: "Today's Revenue",
      value: daily ? `KES ${daily.totalRevenue.toFixed(2)}` : '—',
      trend: '+12.4%',
      trendUp: true,
      icon: DollarSign,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Orders Today',
      value: daily ? String(daily.totalOrders) : '—',
      trend: '+8.1%',
      trendUp: true,
      icon: ShoppingBag,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Active Tables',
      value: tablesStore.occupiedTables.length ? String(tablesStore.occupiedTables.length) : '0',
      trend: `${tablesStore.tables.length} total`,
      trendUp: null,
      icon: Table2,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'Avg Order Value',
      value: daily ? `KES ${daily.averageOrderValue?.toFixed(2)}` : '—',
      trend: '+3.2%',
      trendUp: true,
      icon: TrendingUp,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
  ]
})

const recentOrders = computed(() =>
  [...ordersStore.orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5),
)

const popularItems = computed(() => reportsStore.popularItems.slice(0, 5))

const maxHourlySales = computed(() => {
  const vals = reportsStore.hourlyData.map((d) => d.revenue)
  return Math.max(...vals, 1)
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    draft: 'secondary',
    sent: 'outline',
    preparing: 'default',
    ready: 'default',
    served: 'secondary',
    paid: 'outline',
    cancelled: 'destructive',
  }
  return map[status] ?? 'secondary'
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function orderTotal(order: (typeof ordersStore.orders)[0]) {
  const sub = order.items.reduce((s, i) => s + i.price * i.quantity, 0)
  return sub - order.discount + order.tip
}
</script>

<template>
  <div class="p-6 space-y-6 max-w-[1400px] mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ greeting }}, {{ firstName }}</h1>
        <p class="text-muted-foreground text-sm mt-0.5">
          Here's what's happening at your restaurant today.
        </p>
      </div>
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock class="w-4 h-4" />
        {{
          new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
        }}
      </div>
    </div>

    <!-- Stats Row -->
    <div v-if="reportsStore.loading" class="flex items-center justify-center py-8">
      <Loader2 class="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <Card v-for="stat in stats" :key="stat.label" class="hover:shadow-md transition-shadow">
        <CardContent class="p-5">
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground font-medium">{{ stat.label }}</p>
              <p class="text-3xl font-bold tracking-tight">{{ stat.value }}</p>
              <div class="flex items-center gap-1">
                <TrendingUp v-if="stat.trendUp === true" class="w-3 h-3 text-emerald-500" />
                <span
                  class="text-xs"
                  :class="stat.trendUp === true ? 'text-emerald-500' : 'text-muted-foreground'"
                >
                  {{ stat.trend }}
                </span>
              </div>
            </div>
            <div :class="['p-2.5 rounded-xl', stat.bg]">
              <component :is="stat.icon" :class="['w-5 h-5', stat.color]" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <button
        class="group flex flex-col items-start gap-3 p-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm hover:shadow-md text-left"
        @click="router.push('/orders')"
      >
        <div class="p-2 rounded-lg bg-white/20">
          <Plus class="w-5 h-5" />
        </div>
        <div>
          <p class="font-semibold">New Order</p>
          <p class="text-sm text-primary-foreground/70 mt-0.5">Start taking an order</p>
        </div>
        <ArrowRight
          class="w-4 h-4 opacity-60 group-hover:translate-x-1 transition-transform mt-auto"
        />
      </button>

      <button
        class="group flex flex-col items-start gap-3 p-5 rounded-xl border border-border bg-card hover:bg-accent transition-all shadow-sm hover:shadow-md text-left"
        @click="router.push('/tables')"
      >
        <div class="p-2 rounded-lg bg-violet-500/10">
          <Table2 class="w-5 h-5 text-violet-500" />
        </div>
        <div>
          <p class="font-semibold">View Tables</p>
          <p class="text-sm text-muted-foreground mt-0.5">
            {{ tablesStore.availableTables.length }} available
          </p>
        </div>
        <ArrowRight
          class="w-4 h-4 text-muted-foreground opacity-60 group-hover:translate-x-1 transition-transform mt-auto"
        />
      </button>

      <button
        class="group flex flex-col items-start gap-3 p-5 rounded-xl border border-border bg-card hover:bg-accent transition-all shadow-sm hover:shadow-md text-left"
        @click="router.push('/kitchen')"
      >
        <div class="p-2 rounded-lg bg-orange-500/10">
          <ChefHat class="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <p class="font-semibold">Kitchen View</p>
          <p class="text-sm text-muted-foreground mt-0.5">
            {{ ordersStore.pendingKitchenOrders.length }} pending
          </p>
        </div>
        <ArrowRight
          class="w-4 h-4 text-muted-foreground opacity-60 group-hover:translate-x-1 transition-transform mt-auto"
        />
      </button>
    </div>

    <!-- Two column layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent Orders (spans 2 cols) -->
      <Card class="lg:col-span-2">
        <CardHeader class="pb-3">
          <div class="flex items-center justify-between">
            <CardTitle class="text-base">Recent Orders</CardTitle>
            <Button variant="ghost" size="sm" @click="router.push('/orders')">
              View all
              <ArrowRight class="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent class="p-0">
          <div v-if="ordersStore.loading" class="flex items-center justify-center py-8">
            <Loader2 class="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
          <div
            v-else-if="recentOrders.length === 0"
            class="py-8 text-center text-muted-foreground text-sm"
          >
            No orders yet today.
          </div>
          <table v-else class="w-full text-sm">
            <thead>
              <tr class="border-b border-border">
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Order
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Table
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Time
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Total
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr
                v-for="order in recentOrders"
                :key="order.id"
                class="hover:bg-muted/40 transition-colors"
              >
                <td class="px-6 py-3.5 font-mono text-xs text-muted-foreground">
                  #{{ order.id.slice(-6).toUpperCase() }}
                </td>
                <td class="px-6 py-3.5 font-medium">
                  {{ order.tableName ?? 'Takeaway' }}
                </td>
                <td class="px-6 py-3.5 text-muted-foreground">
                  {{ formatTime(order.createdAt) }}
                </td>
                <td class="px-6 py-3.5">
                  <Badge :variant="statusVariant(order.status)" class="capitalize text-xs">
                    {{ order.status }}
                  </Badge>
                </td>
                <td class="px-6 py-3.5 text-right font-semibold">
                  KES {{ orderTotal(order).toFixed(2) }}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <!-- Popular items -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="text-base flex items-center gap-2">
            <Star class="w-4 h-4 text-amber-500" />
            Popular Items
          </CardTitle>
          <CardDescription>Top sellers today</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div v-if="reportsStore.loading" class="flex items-center justify-center py-6">
            <Loader2 class="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
          <template v-else>
            <div
              v-for="item in popularItems"
              :key="item.menuItemId"
              class="flex items-center gap-3"
            >
              <div
                class="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-bold text-muted-foreground shrink-0"
              >
                {{ item.rank }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ item.name }}</p>
                <p class="text-xs text-muted-foreground">{{ item.quantitySold }} sold</p>
              </div>
              <p class="text-sm font-semibold text-emerald-600 shrink-0">
                KES {{ item.revenue.toFixed(0) }}
              </p>
            </div>
          </template>
        </CardContent>
      </Card>
    </div>

    <!-- Hourly Sales Chart -->
    <Card>
      <CardHeader class="pb-3">
        <div class="flex items-center justify-between">
          <div>
            <CardTitle class="text-base flex items-center gap-2">
              <BarChart2 class="w-4 h-4 text-blue-500" />
              Hourly Sales
            </CardTitle>
            <CardDescription>Revenue breakdown by hour</CardDescription>
          </div>
          <Button variant="outline" size="sm" @click="router.push('/reports')">
            Full Report
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div v-if="reportsStore.loading" class="flex items-center justify-center h-28">
          <Loader2 class="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
        <div v-else class="flex items-end gap-1 h-28">
          <div
            v-for="point in reportsStore.hourlyData"
            :key="point.hour"
            class="flex flex-col items-center gap-1 flex-1 min-w-0"
          >
            <div class="w-full flex items-end justify-center" style="height: 80px">
              <div
                class="w-full max-w-[28px] bg-primary/80 rounded-t hover:bg-primary transition-colors cursor-default group relative"
                :style="{
                  height: `${Math.max(4, Math.round((point.sales / maxHourlySales) * 80))}px`,
                }"
              >
                <!-- Tooltip -->
                <div
                  class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex flex-col items-center z-10"
                >
                  <div
                    class="bg-foreground text-background text-xs rounded px-2 py-1 whitespace-nowrap shadow"
                  >
                    ${{ point.revenue.toFixed(0) }} &bull; {{ point.orders }} orders
                  </div>
                  <div class="w-2 h-2 bg-foreground rotate-45 -mt-1" />
                </div>
              </div>
            </div>
            <span class="text-xs text-muted-foreground truncate w-full text-center">
              {{ point.hour }}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
