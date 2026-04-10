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
import Dialog from '@/components/ui/dialog.vue'
import DialogContent from '@/components/ui/dialog-content.vue'
import DialogHeader from '@/components/ui/dialog-header.vue'
import DialogTitle from '@/components/ui/dialog-title.vue'
import DialogFooter from '@/components/ui/dialog-footer.vue'
import Input from '@/components/ui/input.vue'
import Label from '@/components/ui/label.vue'
import { cn } from '@/lib/utils'
import {
  Clock,
  CheckCircle2,
  Loader2,
  ShoppingCart,
  AlertCircle,
  Armchair,
  Plus,
  Pencil,
  Trash2,
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

const statSummary = computed(() =>
  (['available', 'occupied', 'reserved', 'cleaning'] as TableStatus[]).map((key) => ({
    key,
    label: statusConfig[key].label,
    dot: statusConfig[key].dot,
    count: tablesStore.tables.filter((t: Table) => t.status === key).length,
  })),
)

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

// ── Add / Edit dialog ─────────────────────────────────────────────────────────

const KNOWN_SECTIONS = ['Indoor', 'Outdoor', 'Bar']

interface TableForm {
  id: string
  number: string
  capacity: string
  section: string
}

const tableDialogOpen = ref(false)
const isAddingTable = ref(false)
const savingTable = ref(false)

const emptyTableForm = (): TableForm => ({
  id: '',
  number: '',
  capacity: '',
  section: 'Indoor',
})

const tableForm = ref<TableForm>(emptyTableForm())

function openAddTable() {
  isAddingTable.value = true
  tableForm.value = emptyTableForm()
  tableDialogOpen.value = true
}

function openEditTable(table: Table, e?: Event) {
  e?.stopPropagation()
  isAddingTable.value = false
  tableForm.value = {
    id: table.id,
    number: String(table.number),
    capacity: String(table.capacity),
    section: table.section,
  }
  tableDialogOpen.value = true
}

async function saveTableDialog() {
  const number = parseInt(tableForm.value.number)
  const capacity = parseInt(tableForm.value.capacity)
  if (isNaN(number) || isNaN(capacity) || !tableForm.value.section.trim()) return

  savingTable.value = true
  try {
    if (isAddingTable.value) {
      await tablesStore.createTable({ number, capacity, section: tableForm.value.section.trim() })
    } else {
      await tablesStore.updateTable(tableForm.value.id, {
        number,
        capacity,
        section: tableForm.value.section.trim(),
      })
      // Refresh sheet if editing the open table
      if (selectedTable.value?.id === tableForm.value.id) {
        selectedTable.value = tablesStore.getTableById(tableForm.value.id) ?? null
      }
    }
    tableDialogOpen.value = false
  } finally {
    savingTable.value = false
  }
}

// ── Delete confirm dialog ─────────────────────────────────────────────────────

const deleteDialogOpen = ref(false)
const tableToDelete = ref<Table | null>(null)
const deleting = ref(false)

function openDeleteTable(table: Table, e?: Event) {
  e?.stopPropagation()
  tableToDelete.value = table
  deleteDialogOpen.value = true
}

async function confirmDelete() {
  if (!tableToDelete.value) return
  deleting.value = true
  try {
    await tablesStore.deleteTable(tableToDelete.value.id)
    if (selectedTable.value?.id === tableToDelete.value.id) sheetOpen.value = false
    deleteDialogOpen.value = false
  } finally {
    deleting.value = false
  }
}

// ── Derived sections for chips ────────────────────────────────────────────────

const allSections = computed(() => {
  const fromStore = tablesStore.sections
  const merged = [...new Set([...KNOWN_SECTIONS, ...fromStore])]
  return merged
})
</script>

<template>
  <div class="p-6 space-y-5 max-w-[1400px] mx-auto">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">Tables</h1>
        <p class="text-muted-foreground text-sm">Manage seating and table status</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Summary stats -->
        <div
          v-for="stat in statSummary"
          :key="stat.key"
          class="flex items-center gap-1.5 text-sm"
        >
          <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="stat.dot" />
          <span class="text-muted-foreground">{{ stat.label }}:</span>
          <span class="font-semibold">{{ stat.count }}</span>
        </div>
        <Separator orientation="vertical" class="h-4" />
        <span class="text-sm text-muted-foreground">{{ stats.total }} total</span>
        <Separator orientation="vertical" class="h-4" />
        <Button size="sm" class="gap-2" @click="openAddTable">
          <Plus class="w-4 h-4" />
          Add Table
        </Button>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex flex-wrap items-center gap-3">
      <span class="text-xs text-muted-foreground font-medium uppercase tracking-wider">Legend:</span>
      <div v-for="(config, status) in statusConfig" :key="status" class="flex items-center gap-1.5">
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
          class="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold"
          :class="activeSection === section ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'"
        >
          {{ section === 'All' ? stats.total : (tablesStore.tablesBySection[section] ?? []).length }}
        </span>
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="tablesStore.loading" class="flex items-center justify-center py-16">
      <Loader2 class="w-6 h-6 animate-spin text-muted-foreground" />
    </div>

    <!-- Tables grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
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

        <!-- Table number + edit/delete -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span
              class="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
              :class="table.status === 'occupied' ? 'bg-red-500' : cfg(table.status).dot"
            />
            <span class="font-bold text-lg leading-none">{{ table.number }}</span>
          </div>
          <div class="flex items-center gap-1" @click.stop>
            <button
              class="p-1 rounded hover:bg-background/60 text-muted-foreground hover:text-foreground transition-colors"
              title="Edit table"
              @click="openEditTable(table)"
            >
              <Pencil class="w-3.5 h-3.5" />
            </button>
            <button
              class="p-1 rounded hover:bg-background/60 text-muted-foreground hover:text-destructive transition-colors"
              title="Delete table"
              @click="openDeleteTable(table)"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Status badge -->
        <Badge :variant="cfg(table.status).badge" class="text-xs self-start mb-2">
          {{ cfg(table.status).label }}
        </Badge>

        <!-- Capacity -->
        <div class="flex items-center gap-1 mb-1">
          <Armchair class="w-3.5 h-3.5 text-muted-foreground" />
          <span class="text-xs text-muted-foreground">{{ table.capacity }} seats</span>
        </div>

        <!-- Section label -->
        <span class="text-xs text-muted-foreground mb-2">{{ table.section }}</span>

        <!-- Reservation info -->
        <p v-if="table.reservedFor" class="text-xs font-medium truncate">{{ table.reservedFor }}</p>

        <!-- Order info if occupied -->
        <p v-if="table.status === 'occupied' && table.currentOrderId" class="text-xs text-muted-foreground">
          Order #{{ table.currentOrderId.slice(-4).toUpperCase() }}
        </p>

        <!-- Quick status buttons -->
        <div class="mt-auto pt-2 flex flex-wrap gap-1" @click.stop>
          <button
            v-for="ns in nextStatus[table.status]"
            :key="ns"
            class="text-xs px-2 py-0.5 rounded-full border font-medium transition-colors hover:opacity-80"
            :class="[cfg(ns).border, cfg(ns).text]"
            @click="changeStatus(table.id, ns)"
          >
            → {{ cfg(ns).label }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Table Detail Sheet ───────────────────────────────────────────── -->
    <Sheet :open="sheetOpen" @update:open="sheetOpen = $event">
      <SheetContent side="right" class="w-[380px] sm:w-[440px] flex flex-col p-0">
        <SheetHeader class="p-6 pb-4 border-b border-border shrink-0">
          <div class="flex items-center justify-between">
            <SheetTitle v-if="selectedTable">
              Table {{ selectedTable.number }}
              <Badge :variant="cfg(selectedTable.status).badge" class="ml-2 capitalize">
                {{ cfg(selectedTable.status).label }}
              </Badge>
            </SheetTitle>
            <div v-if="selectedTable" class="flex gap-1">
              <Button variant="ghost" size="icon" class="h-8 w-8" @click="openEditTable(selectedTable)">
                <Pencil class="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8 text-destructive hover:text-destructive"
                @click="openDeleteTable(selectedTable)"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea v-if="selectedTable" class="flex-1">
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

            <!-- Status change -->
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
                  <Loader2 v-if="updatingTableId === selectedTable.id" class="w-3 h-3 animate-spin" />
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
                <Badge :variant="orderStatusVariant(selectedTableOrder.status)" class="capitalize text-xs">
                  {{ selectedTableOrder.status }}
                </Badge>
              </div>

              <div class="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                <span class="flex items-center gap-1">
                  <Clock class="w-3 h-3" />
                  {{ formatTime(selectedTableOrder.createdAt) }}
                  ({{ minutesAgo(selectedTableOrder.createdAt) }}m ago)
                </span>
                <span class="font-mono">#{{ selectedTableOrder.id.slice(-6).toUpperCase() }}</span>
              </div>

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
                  <span class="shrink-0 text-sm font-semibold">${{ (item.price * item.quantity).toFixed(2) }}</span>
                </div>
              </div>

              <Separator class="my-3" />

              <div class="space-y-1 text-sm">
                <div class="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span>${{ orderSubtotal.toFixed(2) }}</span>
                </div>
                <div v-if="selectedTableOrder.discount > 0" class="flex justify-between text-emerald-600">
                  <span>Discount</span><span>-${{ selectedTableOrder.discount.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between text-muted-foreground">
                  <span>Tax (8%)</span>
                  <span>${{ ((orderSubtotal - selectedTableOrder.discount) * 0.08).toFixed(2) }}</span>
                </div>
                <div v-if="selectedTableOrder.tip > 0" class="flex justify-between text-muted-foreground">
                  <span>Tip</span><span>${{ selectedTableOrder.tip.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between font-bold text-base pt-1">
                  <span>Total</span><span class="text-primary">${{ orderTotal.toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <div
              v-else-if="selectedTable.status !== 'available'"
              class="flex flex-col items-center gap-3 py-6 text-muted-foreground"
            >
              <AlertCircle class="w-8 h-8 opacity-30" />
              <p class="text-sm">No active order linked to this table.</p>
            </div>

            <div v-else class="flex flex-col items-center gap-3 py-6 text-muted-foreground">
              <CheckCircle2 class="w-8 h-8 text-emerald-400" />
              <p class="text-sm text-center">Table is available and ready for guests.</p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>

    <!-- ── Add / Edit Table Dialog ─────────────────────────────────────── -->
    <Dialog :open="tableDialogOpen" @update:open="tableDialogOpen = $event">
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <DialogTitle>{{ isAddingTable ? 'Add Table' : 'Edit Table' }}</DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label>Table Number</Label>
              <Input v-model="tableForm.number" type="number" min="1" placeholder="e.g. 5" />
            </div>
            <div class="space-y-1.5">
              <Label>Capacity (seats)</Label>
              <Input v-model="tableForm.capacity" type="number" min="1" placeholder="e.g. 4" />
            </div>
          </div>

          <div class="space-y-1.5">
            <Label>Section</Label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="s in allSections"
                :key="s"
                type="button"
                :class="
                  cn(
                    'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    tableForm.section === s
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
                  )
                "
                @click="tableForm.section = s"
              >
                {{ s }}
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="tableDialogOpen = false">Cancel</Button>
          <Button :disabled="savingTable" @click="saveTableDialog">
            <Loader2 v-if="savingTable" class="w-4 h-4 animate-spin" />
            {{ isAddingTable ? 'Add Table' : 'Save Changes' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- ── Delete Confirm Dialog ───────────────────────────────────────── -->
    <Dialog :open="deleteDialogOpen" @update:open="deleteDialogOpen = $event">
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Table</DialogTitle>
        </DialogHeader>
        <p class="text-sm text-muted-foreground py-2">
          Are you sure you want to delete
          <span class="font-semibold text-foreground">Table {{ tableToDelete?.number }}</span>?
          This cannot be undone.
        </p>
        <DialogFooter>
          <Button variant="outline" @click="deleteDialogOpen = false">Cancel</Button>
          <Button variant="destructive" :disabled="deleting" @click="confirmDelete">
            <Loader2 v-if="deleting" class="w-4 h-4 animate-spin" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

  </div>
</template>
