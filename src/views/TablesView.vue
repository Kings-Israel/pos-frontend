<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTablesStore } from '@/stores/tables'
import { useOrdersStore } from '@/stores/orders'
import type { Table, TableStatus } from '@/stores/tables'
import Badge from '@/components/ui/badge.vue'
import Button from '@/components/ui/button.vue'
import Card from '@/components/ui/card.vue'
import CardContent from '@/components/ui/card-content.vue'
import CardHeader from '@/components/ui/card-header.vue'
import CardTitle from '@/components/ui/card-title.vue'
import CardDescription from '@/components/ui/card-description.vue'
import Separator from '@/components/ui/separator.vue'
import Sheet from '@/components/ui/sheet.vue'
import SheetContent from '@/components/ui/sheet-content.vue'
import SheetHeader from '@/components/ui/sheet-header.vue'
import SheetTitle from '@/components/ui/sheet-title.vue'
import ScrollArea from '@/components/ui/scroll-area.vue'
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ShoppingCart,
  AlertCircle,
  ChefHat,
  Armchair,
} from 'lucide-vue-next'

const tablesStore = useTablesStore()
const ordersStore = useOrdersStore()

// ── State ─────────────────────────────────────────────────────────────────────

const activeSection = ref('All')
const selectedTable = ref<Table | null>(null)
const sheetOpen = ref(false)
const updatingTableId = ref<string | null>(null)

// ── Init ──────────────────────────────────────────────────────────────────────

onMounted(async () => {
  await Promise.all([tablesStore.fetchTables(), ordersStore.fetchOrders()])
})

// ── Computed ──────────────────────────────────────────────────────────────────

const sections = computed(() => ['All', ...tablesStore.sections])

const displayedTables = computed(() => {
  if (activeSection.value === 'All') return tablesStore.tables
  return tablesStore.tablesBySection[activeSection.value] ?? []
})

const stats = computed(() => ({
  available: tablesStore.tables.filter((t) => t.status === 'available').length,
  occupied:  tablesStore.tables.filter((t) => t.status === 'occupied').length,
  reserved:  tablesStore.tables.filter((t) => t.status === 'reserved').length,
  cleaning:  tablesStore.tables.filter((t) => t.status === 'cleaning').length,
  total:     tablesStore.tables.length,
}))

const selectedTableOrder = computed(() => {
  if (!selectedTable.value?.currentOrderId) return null
  return ordersStore.orders.find((o) => o.id === selectedTable.value!.currentOrderId) ?? null
})

const orderSubtotal = computed(() => {
  const order = selectedTableOrder.value
  if (!order) return 0
  return order.items.reduce((s, i) => s + i.price * i.quantity, 0)
})

const orderTotal = computed(() => {
  const order = selectedTableOrder.value
  if (!order) return orderSubtotal.value
  const base = orderSubtotal.value - order.discount
  const tax = base * 0.08
  return base + tax + order.tip
})

// ── Helpers ───────────────────────────────────────────────────────────────────

interface StatusConfig {
  label: string
  bg: string
  text: string
  border: string
  dot: string
  badge: 'default' | 'secondary' | 'destructive' | 'outline'
}

const statusConfig: Record<TableStatus, StatusConfig> = {
  available: {
    label: 'Available',
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/15',
    text: 'text-emerald-700',
    border: 'border-emerald-500/30 hover:border-emerald-500/60',
    dot: 'bg-emerald-500',
    badge: 'secondary',
  },
  occupied: {
    label: 'Occupied',
    bg: 'bg-red-500/10 hover:bg-red-500/15',
    text: 'text-red-700',
    border: 'border-red-500/30 hover:border-red-500/60',
    dot: 'bg-red-500',
    badge: 'destructive',
  },
  reserved: {
    label: 'Reserved',
    bg: 'bg-amber-500/10 hover:bg-amber-500/15',
    text: 'text-amber-700',
    border: 'border-amber-500/30 hover:border-amber-500/60',
    dot: 'bg-amber-500',
    badge: 'default',
  },
  cleaning: {
    label: 'Cleaning',
    bg: 'bg-slate-500/10 hover:bg-slate-500/15',
    text: 'text-slate-500',
    border: 'border-slate-400/30 hover:border-slate-400/60',
    dot: 'bg-slate-400',
    badge: 'outline',
  },
}

function cfg(status: TableStatus) {
  return statusConfig[status]
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function minutesAgo(iso: string) {
  return Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
}

function orderStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
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

// ── Actions ───────────────────────────────────────────────────────────────────

function openTable(table: Table) {
  selectedTable.value = table
  sheetOpen.value = true
}

async function changeStatus(tableId: string, status: TableStatus) {
  updatingTableId.value = tableId
  try {
    await tablesStore.updateStatus(tableId, status)
    // Refresh selectedTable ref if it's the same table
    if (selectedTable.value?.id === tableId) {
      selectedTable.value = tablesStore.getTableById(tableId) ?? null
    }
  } finally {
    updatingTableId.value = null
  }
}

const nextStatus: Record<TableStatus, TableStatus[]> = {
  available: ['reserved'],
  occupied:  ['cleaning', 'available'],
  reserved:  ['available', 'occupied'],
  cleaning:  ['available'],
}
</script>

<template>
  <div class="p-6 space-y-5 max-w-[1400px] mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">Tables</h1>
        <p class="text-muted-foreground text-sm">Manage seating and table status</p>
      </div>

      <!-- Summary stats -->
      <div class="flex flex-wrap items-center gap-3">
        <div
          v-for="([key, count]) in [['available', stats.available], ['occupied', stats.occupied], ['reserved', stats.reserved], ['cleaning', stats.cleaning]]"
          :key="key"
          class="flex items-center gap-1.5 text-sm"
        >
          <span
            class="w-2.5 h-2.5 rounded-full shrink-0"
            :class="cfg(key as TableStatus).dot"
          />
          <span class="text-muted-foreground">{{ cfg(key as TableStatus).label }}:</span>
          <span class="font-semibold">{{ count }}</span>
        </div>
        <Separator orientation="vertical" class="h-4" />
        <span class="text-sm text-muted-foreground">{{ stats.total }} total</span>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex flex-wrap items-center gap-3">
      <span class="text-xs text-muted-foreground font-medium uppercase tracking-wider">Legend:</span>
      <div
        v-for="(config, status) in statusConfig"
        :key="status"
        class="flex items-center gap-1.5"
      >
        <span class="w-3 h-3 rounded-sm" :class="config.dot" />
        <span class="text-xs text-muted-foreground">{{ config.label }}</span>
      </div>
    </div>

    <!-- Section tabs -->
    <div class="flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="section in sections"
        :key="section"
        class="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border"
        :class="
          activeSection === section
            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
            : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 bg-card'
        "
        @click="activeSection = section"
      >
        {{ section }}
        <span
          v-if="section !== 'All'"
          class="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold"
          :class="activeSection === section ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'"
        >
          {{ (tablesStore.tablesBySection[section] ?? []).length }}
        </span>
        <span
          v-else
          class="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold"
          :class="activeSection === section ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'"
        >
          {{ stats.total }}
        </span>
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="tablesStore.loading" class="flex items-center justify-center py-16">
      <Loader2 class="w-6 h-6 animate-spin text-muted-foreground" />
    </div>

    <!-- Tables grid -->
    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4"
    >
      <div
        v-for="table in displayedTables"
        :key="table.id"
        class="relative flex flex-col rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md"
        :class="[cfg(table.status).bg, cfg(table.status).border]"
        @click="openTable(table)"
      >
        <!-- Updating spinner -->
        <div
          v-if="updatingTableId === table.id"
          class="absolute inset-0 bg-background/60 rounded-xl flex items-center justify-center z-10"
        >
          <Loader2 class="w-5 h-5 animate-spin text-foreground" />
        </div>

        <!-- Table number -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span
              class="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
              :class="table.status === 'occupied' ? 'bg-red-500' : cfg(table.status).dot"
            />
            <span class="font-bold text-lg leading-none">{{ table.number }}</span>
          </div>
          <Badge :variant="cfg(table.status).badge" class="text-xs">
            {{ cfg(table.status).label }}
          </Badge>
        </div>

        <!-- Capacity (chairs) -->
        <div class="flex items-center gap-1 mb-1">
          <Armchair class="w-3.5 h-3.5 text-muted-foreground" />
          <span class="text-xs text-muted-foreground">{{ table.capacity }} seats</span>
        </div>

        <!-- Section label -->
        <span class="text-xs text-muted-foreground mb-2">{{ table.section }}</span>

        <!-- Reservation info -->
        <p v-if="table.reservedFor" class="text-xs font-medium truncate">
          {{ table.reservedFor }}
        </p>

        <!-- Order info if occupied -->
        <p v-if="table.status === 'occupied' && table.currentOrderId" class="text-xs text-muted-foreground">
          Order #{{ table.currentOrderId.slice(-4).toUpperCase() }}
        </p>

        <!-- Status change quick buttons (visible on hover) -->
        <div class="mt-auto pt-2 flex flex-wrap gap-1" @click.stop>
          <button
            v-for="ns in nextStatus[table.status]"
            :key="ns"
            class="text-xs px-2 py-0.5 rounded-full border font-medium transition-colors"
            :class="[cfg(ns).border, cfg(ns).text, 'hover:opacity-80']"
            @click="changeStatus(table.id, ns)"
          >
            → {{ cfg(ns).label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Table Detail Sheet -->
    <Sheet :open="sheetOpen" @update:open="sheetOpen = $event">
      <SheetContent side="right" class="w-[380px] sm:w-[440px] flex flex-col p-0">
        <SheetHeader class="p-6 pb-4 border-b border-border shrink-0">
          <SheetTitle v-if="selectedTable">
            Table {{ selectedTable.number }}
            <Badge :variant="cfg(selectedTable.status).badge" class="ml-2 capitalize">
              {{ cfg(selectedTable.status).label }}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea class="flex-1" v-if="selectedTable">
          <div class="p-6 space-y-5">
            <!-- Table info -->
            <Card>
              <CardContent class="p-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p class="text-muted-foreground text-xs">Section</p>
                  <p class="font-semibold">{{ selectedTable.section }}</p>
                </div>
                <div>
                  <p class="text-muted-foreground text-xs">Capacity</p>
                  <p class="font-semibold flex items-center gap-1">
                    <Armchair class="w-3.5 h-3.5" />
                    {{ selectedTable.capacity }} seats
                  </p>
                </div>
                <div v-if="selectedTable.reservedFor" class="col-span-2">
                  <p class="text-muted-foreground text-xs">Reserved for</p>
                  <p class="font-semibold">{{ selectedTable.reservedFor }}</p>
                </div>
              </CardContent>
            </Card>

            <!-- Status change buttons -->
            <div>
              <p class="text-sm font-semibold mb-2">Change Status</p>
              <div class="flex flex-wrap gap-2">
                <Button
                  v-for="status in (['available', 'occupied', 'reserved', 'cleaning'] as TableStatus[])"
                  :key="status"
                  :variant="selectedTable.status === status ? 'default' : 'outline'"
                  size="sm"
                  class="capitalize"
                  :disabled="selectedTable.status === status || updatingTableId === selectedTable.id"
                  @click="changeStatus(selectedTable.id, status)"
                >
                  <Loader2
                    v-if="updatingTableId === selectedTable.id"
                    class="w-3 h-3 animate-spin"
                  />
                  {{ cfg(status).label }}
                </Button>
              </div>
            </div>

            <Separator />

            <!-- Order details -->
            <div v-if="selectedTableOrder">
              <div class="flex items-center justify-between mb-3">
                <p class="text-sm font-semibold flex items-center gap-2">
                  <ShoppingCart class="w-4 h-4 text-primary" />
                  Active Order
                </p>
                <div class="flex items-center gap-2">
                  <Badge :variant="orderStatusVariant(selectedTableOrder.status)" class="capitalize text-xs">
                    {{ selectedTableOrder.status }}
                  </Badge>
                </div>
              </div>

              <!-- Order meta -->
              <div class="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                <span class="flex items-center gap-1">
                  <Clock class="w-3 h-3" />
                  {{ formatTime(selectedTableOrder.createdAt) }}
                  ({{ minutesAgo(selectedTableOrder.createdAt) }}m ago)
                </span>
                <span class="font-mono">
                  #{{ selectedTableOrder.id.slice(-6).toUpperCase() }}
                </span>
              </div>

              <!-- Items list -->
              <div class="space-y-2">
                <div
                  v-for="item in selectedTableOrder.items"
                  :key="item.id"
                  class="flex justify-between items-start text-sm gap-2"
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-bold text-muted-foreground w-4">{{ item.quantity }}×</span>
                      <span class="font-medium truncate">{{ item.name }}</span>
                    </div>
                    <p v-if="item.modifiers.length" class="text-xs text-muted-foreground ml-5">
                      {{ item.modifiers.join(', ') }}
                    </p>
                  </div>
                  <span class="shrink-0 text-sm font-semibold">
                    ${{ (item.price * item.quantity).toFixed(2) }}
                  </span>
                </div>
              </div>

              <Separator class="my-3" />

              <!-- Totals -->
              <div class="space-y-1 text-sm">
                <div class="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${{ orderSubtotal.toFixed(2) }}</span>
                </div>
                <div v-if="selectedTableOrder.discount > 0" class="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-${{ selectedTableOrder.discount.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between text-muted-foreground">
                  <span>Tax (8%)</span>
                  <span>${{ ((orderSubtotal - selectedTableOrder.discount) * 0.08).toFixed(2) }}</span>
                </div>
                <div v-if="selectedTableOrder.tip > 0" class="flex justify-between text-muted-foreground">
                  <span>Tip</span>
                  <span>${{ selectedTableOrder.tip.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between font-bold text-base pt-1">
                  <span>Total</span>
                  <span class="text-primary">${{ orderTotal.toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <!-- No order on this table -->
            <div
              v-else-if="selectedTable.status !== 'available'"
              class="flex flex-col items-center gap-3 py-6 text-muted-foreground"
            >
              <AlertCircle class="w-8 h-8 opacity-30" />
              <p class="text-sm">No active order linked to this table.</p>
            </div>

            <div
              v-else
              class="flex flex-col items-center gap-3 py-6 text-muted-foreground"
            >
              <CheckCircle2 class="w-8 h-8 text-emerald-400" />
              <p class="text-sm text-center">Table is available and ready for guests.</p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  </div>
</template>
