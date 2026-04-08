<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import type { InventoryItem, MovementType, StockStatus } from '@/stores/inventory'
import Card from '@/components/ui/card.vue'
import CardHeader from '@/components/ui/card-header.vue'
import CardTitle from '@/components/ui/card-title.vue'
import CardContent from '@/components/ui/card-content.vue'
import CardFooter from '@/components/ui/card-footer.vue'
import Badge from '@/components/ui/badge.vue'
import Button from '@/components/ui/button.vue'
import Input from '@/components/ui/input.vue'
import Label from '@/components/ui/label.vue'
import Separator from '@/components/ui/separator.vue'
import Dialog from '@/components/ui/dialog.vue'
import DialogContent from '@/components/ui/dialog-content.vue'
import DialogHeader from '@/components/ui/dialog-header.vue'
import DialogTitle from '@/components/ui/dialog-title.vue'
import DialogDescription from '@/components/ui/dialog-description.vue'
import DialogFooter from '@/components/ui/dialog-footer.vue'
import Tabs from '@/components/ui/tabs.vue'
import TabsList from '@/components/ui/tabs-list.vue'
import TabsTrigger from '@/components/ui/tabs-trigger.vue'
import TabsContent from '@/components/ui/tabs-content.vue'
import Progress from '@/components/ui/progress.vue'
import Table from '@/components/ui/table.vue'
import TableHeader from '@/components/ui/table-header.vue'
import TableBody from '@/components/ui/table-body.vue'
import TableRow from '@/components/ui/table-row.vue'
import TableHead from '@/components/ui/table-head.vue'
import TableCell from '@/components/ui/table-cell.vue'
import Select from '@/components/ui/select.vue'
import SelectTrigger from '@/components/ui/select-trigger.vue'
import SelectContent from '@/components/ui/select-content.vue'
import SelectItem from '@/components/ui/select-item.vue'
import SelectValue from '@/components/ui/select-value.vue'
import {
  Package,
  PackagePlus,
  AlertTriangle,
  TrendingDown,
  RefreshCw,
  Plus,
  Minus,
  History,
  Search,
  Edit3,
  BarChart2,
  Boxes,
} from 'lucide-vue-next'

const inventoryStore = useInventoryStore()

onMounted(async () => {
  await Promise.all([inventoryStore.fetchInventory(), inventoryStore.fetchMovements()])
})

// ── Filter state ──────────────────────────────────────────────────────────────

const searchQuery = ref('')
const categoryFilter = ref<'all' | InventoryItem['category']>('all')
const statusFilter = ref<'all' | StockStatus>('all')

const filteredItems = computed(() => {
  let list = inventoryStore.items

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.supplier ?? '').toLowerCase().includes(q),
    )
  }

  if (categoryFilter.value !== 'all') {
    list = list.filter((i) => i.category === categoryFilter.value)
  }

  if (statusFilter.value !== 'all') {
    list = list.filter(
      (i) => inventoryStore.stockStatus(i) === statusFilter.value,
    )
  }

  return list
})

// ── Stock level helpers ───────────────────────────────────────────────────────

function stockPercent(item: InventoryItem): number {
  if (item.maxStock === 0) return 0
  return Math.min(Math.round((item.currentStock / item.maxStock) * 100), 100)
}

function stockBarColor(item: InventoryItem): string {
  const s = inventoryStore.stockStatus(item)
  if (s === 'out') return 'bg-red-500'
  if (s === 'critical') return 'bg-orange-500'
  if (s === 'low') return 'bg-amber-400'
  return 'bg-green-500'
}

// ── Badge helpers ─────────────────────────────────────────────────────────────

function statusBadgeVariant(status: StockStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'ok') return 'secondary'
  if (status === 'low') return 'outline'
  if (status === 'critical') return 'destructive'
  return 'destructive'
}

function statusBadgeClass(status: StockStatus): string {
  if (status === 'ok') return 'border-green-200 bg-green-100 text-green-800'
  if (status === 'low') return 'border-amber-300 bg-amber-50 text-amber-700'
  if (status === 'critical') return 'border-orange-300 bg-orange-100 text-orange-800 animate-pulse'
  return 'border-red-300 bg-red-100 text-red-800'
}

function statusLabel(status: StockStatus): string {
  if (status === 'ok') return 'OK'
  if (status === 'low') return 'Low'
  if (status === 'critical') return 'Critical'
  return 'Out of Stock'
}

function movementTypeBadgeClass(type: MovementType): string {
  if (type === 'deduction') return 'border-red-200 bg-red-50 text-red-700'
  if (type === 'restock') return 'border-green-200 bg-green-100 text-green-700'
  if (type === 'adjustment') return 'border-blue-200 bg-blue-50 text-blue-700'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

function categoryLabel(category: InventoryItem['category']): string {
  const map: Record<InventoryItem['category'], string> = {
    ingredient: 'Ingredient',
    beverage: 'Beverage',
    packaging: 'Packaging',
    cleaning: 'Cleaning',
  }
  return map[category]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Restock dialog ────────────────────────────────────────────────────────────

const restockOpen = ref(false)
const restockItem = ref<InventoryItem | null>(null)
const restockQty = ref<number>(0)
const restockNotes = ref('')
const restockLoading = ref(false)

function openRestock(item: InventoryItem) {
  restockItem.value = item
  restockQty.value = 0
  restockNotes.value = ''
  restockOpen.value = true
}

async function confirmRestock() {
  if (!restockItem.value || restockQty.value <= 0) return
  restockLoading.value = true
  try {
    await inventoryStore.restockItem(
      restockItem.value.id,
      restockQty.value,
      restockNotes.value || undefined,
    )
    restockOpen.value = false
  } finally {
    restockLoading.value = false
  }
}

// ── Adjustment dialog ─────────────────────────────────────────────────────────

const adjustOpen = ref(false)
const adjustItem = ref<InventoryItem | null>(null)
const adjustType = ref<'adjustment' | 'waste'>('adjustment')
const adjustQty = ref<number>(0)
const adjustNegative = ref(true)
const adjustReason = ref('')
const adjustLoading = ref(false)

function openAdjust(item: InventoryItem) {
  adjustItem.value = item
  adjustType.value = 'adjustment'
  adjustQty.value = 0
  adjustNegative.value = true
  adjustReason.value = ''
  adjustOpen.value = true
}

async function confirmAdjust() {
  if (!adjustItem.value || adjustQty.value === 0 || !adjustReason.value.trim()) return
  adjustLoading.value = true
  const finalQty = adjustNegative.value ? -Math.abs(adjustQty.value) : Math.abs(adjustQty.value)
  try {
    await inventoryStore.adjustStock(
      adjustItem.value.id,
      finalQty,
      adjustType.value,
      adjustReason.value,
    )
    adjustOpen.value = false
  } finally {
    adjustLoading.value = false
  }
}

// ── History dialog ────────────────────────────────────────────────────────────

const historyOpen = ref(false)
const historyItem = ref<InventoryItem | null>(null)

const historyMovements = computed(() => {
  if (!historyItem.value) return []
  return inventoryStore.movements.filter(
    (m) => m.inventoryItemId === historyItem.value!.id,
  )
})

function openHistory(item: InventoryItem) {
  historyItem.value = item
  historyOpen.value = true
}

// ── Add Item dialog ───────────────────────────────────────────────────────────

const addOpen = ref(false)
const addLoading = ref(false)

interface AddForm {
  name: string
  category: InventoryItem['category']
  unit: string
  currentStock: number
  minStock: number
  maxStock: number
  costPerUnit: number
  supplier: string
}

const emptyAddForm = (): AddForm => ({
  name: '',
  category: 'ingredient',
  unit: 'kg',
  currentStock: 0,
  minStock: 0,
  maxStock: 0,
  costPerUnit: 0,
  supplier: '',
})

const addForm = ref<AddForm>(emptyAddForm())

function openAddItem() {
  addForm.value = emptyAddForm()
  addOpen.value = true
}

async function confirmAddItem() {
  if (!addForm.value.name.trim() || addForm.value.maxStock <= 0) return
  addLoading.value = true
  try {
    await inventoryStore.addInventoryItem({
      name: addForm.value.name.trim(),
      category: addForm.value.category,
      unit: addForm.value.unit,
      currentStock: addForm.value.currentStock,
      minStock: addForm.value.minStock,
      maxStock: addForm.value.maxStock,
      costPerUnit: addForm.value.costPerUnit,
      linkedMenuItems: [],
      supplier: addForm.value.supplier.trim() || undefined,
    })
    addOpen.value = false
  } finally {
    addLoading.value = false
  }
}

// ── Recent movements (last 10) ────────────────────────────────────────────────

const recentMovements = computed(() =>
  [...inventoryStore.movements]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10),
)
</script>

<template>
  <div class="flex flex-col gap-6 p-6 bg-background min-h-screen">
    <!-- ── Page header ────────────────────────────────────────────────────── -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <Boxes class="w-6 h-6 text-primary" />
          Inventory Management
        </h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          Track stock levels, movements and alerts
        </p>
      </div>
      <Button @click="openAddItem">
        <PackagePlus class="w-4 h-4" />
        Add Item
      </Button>
    </div>

    <!-- ── Stats row ──────────────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total SKUs -->
      <Card>
        <CardContent class="p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-muted-foreground">Total SKUs</span>
            <div class="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
              <Package class="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p class="text-2xl font-bold">{{ inventoryStore.items.length }}</p>
          <p class="text-xs text-muted-foreground mt-1">Tracked inventory items</p>
        </CardContent>
      </Card>

      <!-- Low Stock Alerts -->
      <Card>
        <CardContent class="p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-muted-foreground">Low Stock Alerts</span>
            <div class="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle class="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p
            class="text-2xl font-bold"
            :class="inventoryStore.lowStockItems.length > 0 ? 'text-amber-600' : ''"
          >
            {{ inventoryStore.lowStockItems.length }}
          </p>
          <p class="text-xs text-muted-foreground mt-1">Items approaching minimum</p>
        </CardContent>
      </Card>

      <!-- Out of Stock -->
      <Card>
        <CardContent class="p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-muted-foreground">Out of Stock</span>
            <div class="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
              <TrendingDown class="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p
            class="text-2xl font-bold"
            :class="inventoryStore.outOfStockItems.length > 0 ? 'text-red-600' : ''"
          >
            {{ inventoryStore.outOfStockItems.length }}
          </p>
          <p class="text-xs text-muted-foreground mt-1">Items with zero stock</p>
        </CardContent>
      </Card>

      <!-- Total Value -->
      <Card>
        <CardContent class="p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-muted-foreground">Total Value</span>
            <div class="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
              <BarChart2 class="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p class="text-2xl font-bold">
            ${{ inventoryStore.totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
          </p>
          <p class="text-xs text-muted-foreground mt-1">Current inventory cost</p>
        </CardContent>
      </Card>
    </div>

    <!-- ── Alert summary (when issues exist) ─────────────────────────────── -->
    <div
      v-if="inventoryStore.alertCount > 0"
      class="flex items-center gap-3 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm"
    >
      <AlertTriangle class="w-4 h-4 shrink-0 text-red-600" />
      <span>
        <strong>{{ inventoryStore.alertCount }} items</strong> need attention —
        {{ inventoryStore.outOfStockItems.length }} out of stock,
        {{ inventoryStore.criticalItems.length }} critical,
        {{ inventoryStore.lowStockItems.length }} low.
      </span>
    </div>

    <!-- ── Filter bar ─────────────────────────────────────────────────────── -->
    <div class="flex flex-wrap gap-3 items-center">
      <!-- Search -->
      <div class="relative flex-1 min-w-48">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Search items or supplier..."
          class="pl-9"
        />
      </div>

      <!-- Category filter -->
      <Tabs :model-value="categoryFilter" @update:model-value="categoryFilter = $event as typeof categoryFilter">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="ingredient">Ingredient</TabsTrigger>
          <TabsTrigger value="beverage">Beverage</TabsTrigger>
          <TabsTrigger value="packaging">Packaging</TabsTrigger>
          <TabsTrigger value="cleaning">Cleaning</TabsTrigger>
        </TabsList>
      </Tabs>

      <!-- Status filter -->
      <Select :model-value="statusFilter" @update:model-value="statusFilter = $event as typeof statusFilter">
        <SelectTrigger class="w-40">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="ok">OK</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
          <SelectItem value="out">Out of Stock</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- ── Main inventory table ───────────────────────────────────────────── -->
    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="flex items-center gap-2 text-base">
          <Package class="w-5 h-5 text-primary" />
          Inventory Items
          <Badge variant="outline" class="ml-1 text-xs">{{ filteredItems.length }}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent class="pt-0 px-0">
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="pl-6">Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead class="min-w-44">Stock Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead class="text-right">Min Stock</TableHead>
                <TableHead class="text-right">Cost / Unit</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead class="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="item in filteredItems"
                :key="item.id"
                class="hover:bg-muted/30 transition-colors"
              >
                <!-- Name -->
                <TableCell class="pl-6 font-medium">{{ item.name }}</TableCell>

                <!-- Category -->
                <TableCell>
                  <Badge variant="outline" class="text-xs capitalize">
                    {{ categoryLabel(item.category) }}
                  </Badge>
                </TableCell>

                <!-- Unit -->
                <TableCell class="text-muted-foreground text-sm">{{ item.unit }}</TableCell>

                <!-- Stock Level -->
                <TableCell>
                  <div class="space-y-1 min-w-36">
                    <div class="flex justify-between text-xs text-muted-foreground">
                      <span class="font-medium text-foreground">{{ item.currentStock }}</span>
                      <span>/ {{ item.maxStock }} {{ item.unit }}</span>
                    </div>
                    <div class="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        class="h-full rounded-full transition-all"
                        :class="stockBarColor(item)"
                        :style="{ width: `${stockPercent(item)}%` }"
                      />
                    </div>
                  </div>
                </TableCell>

                <!-- Status badge -->
                <TableCell>
                  <span
                    class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold"
                    :class="statusBadgeClass(inventoryStore.stockStatus(item))"
                  >
                    <AlertTriangle
                      v-if="inventoryStore.stockStatus(item) === 'low' || inventoryStore.stockStatus(item) === 'critical'"
                      class="w-3 h-3"
                    />
                    {{ statusLabel(inventoryStore.stockStatus(item)) }}
                  </span>
                </TableCell>

                <!-- Min Stock -->
                <TableCell class="text-right text-sm text-muted-foreground">
                  {{ item.minStock }} {{ item.unit }}
                </TableCell>

                <!-- Cost / Unit -->
                <TableCell class="text-right text-sm font-medium">
                  ${{ item.costPerUnit.toFixed(2) }}
                </TableCell>

                <!-- Supplier -->
                <TableCell class="text-sm text-muted-foreground max-w-32 truncate">
                  {{ item.supplier ?? '—' }}
                </TableCell>

                <!-- Last Updated -->
                <TableCell class="text-xs text-muted-foreground whitespace-nowrap">
                  {{ formatDate(item.lastUpdated) }}
                </TableCell>

                <!-- Actions -->
                <TableCell class="pr-6">
                  <div class="flex items-center justify-end gap-1">
                    <!-- Restock -->
                    <Button
                      variant="outline"
                      size="sm"
                      class="h-8 px-2 text-green-700 border-green-200 hover:bg-green-50"
                      title="Restock"
                      @click="openRestock(item)"
                    >
                      <Plus class="w-3.5 h-3.5" />
                      <span class="hidden lg:inline ml-1">Restock</span>
                    </Button>

                    <!-- Adjust -->
                    <Button
                      variant="ghost"
                      size="sm"
                      class="h-8 px-2"
                      title="Adjust stock"
                      @click="openAdjust(item)"
                    >
                      <Edit3 class="w-3.5 h-3.5" />
                    </Button>

                    <!-- History -->
                    <Button
                      variant="ghost"
                      size="sm"
                      class="h-8 px-2"
                      title="Stock history"
                      @click="openHistory(item)"
                    >
                      <History class="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>

              <!-- Empty state -->
              <TableRow v-if="filteredItems.length === 0">
                <TableCell colspan="10" class="text-center py-12 text-muted-foreground">
                  <Package class="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p class="font-medium">No items found</p>
                  <p class="text-xs mt-1">Try adjusting your filters</p>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <!-- ── Recent Movements ───────────────────────────────────────────────── -->
    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="flex items-center gap-2 text-base">
          <History class="w-5 h-5 text-primary" />
          Recent Stock Movements
          <Badge variant="outline" class="ml-1 text-xs">Last 10</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent class="pt-0 px-0">
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="pl-6">Time</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead class="text-right">Quantity</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead class="pr-6">Performed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="mov in recentMovements"
                :key="mov.id"
                class="hover:bg-muted/30 transition-colors"
              >
                <TableCell class="pl-6 text-xs text-muted-foreground whitespace-nowrap">
                  {{ formatDate(mov.timestamp) }}
                </TableCell>
                <TableCell class="font-medium text-sm">{{ mov.inventoryItemName }}</TableCell>
                <TableCell>
                  <span
                    class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold capitalize"
                    :class="movementTypeBadgeClass(mov.type)"
                  >
                    {{ mov.type }}
                  </span>
                </TableCell>
                <TableCell
                  class="text-right font-mono text-sm font-semibold"
                  :class="mov.quantity >= 0 ? 'text-green-600' : 'text-red-600'"
                >
                  {{ mov.quantity >= 0 ? '+' : '' }}{{ mov.quantity }}
                </TableCell>
                <TableCell class="text-sm text-muted-foreground max-w-48 truncate">
                  {{ mov.reason }}
                </TableCell>
                <TableCell class="font-mono text-xs text-muted-foreground">
                  {{ mov.orderId ?? '—' }}
                </TableCell>
                <TableCell class="pr-6 text-sm text-muted-foreground">
                  {{ mov.performedBy }}
                </TableCell>
              </TableRow>

              <TableRow v-if="recentMovements.length === 0">
                <TableCell colspan="7" class="text-center py-8 text-muted-foreground">
                  No movements recorded yet.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>

  <!-- ─────────────────────────────────────────────────────────────────────────
       Dialog 1: Restock
  ───────────────────────────────────────────────────────────────────────────── -->
  <Dialog :open="restockOpen" @update:open="restockOpen = $event">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <RefreshCw class="w-5 h-5 text-green-600" />
          Restock {{ restockItem?.name }}
        </DialogTitle>
        <DialogDescription>
          Add stock to bring this item back to an adequate level.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-2" v-if="restockItem">
        <!-- Current stock display -->
        <div class="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
          <div>
            <p class="text-xs text-muted-foreground">Current Stock</p>
            <p class="text-xl font-bold">
              {{ restockItem.currentStock }}
              <span class="text-sm font-normal text-muted-foreground">{{ restockItem.unit }}</span>
            </p>
          </div>
          <div class="text-right">
            <p class="text-xs text-muted-foreground">Maximum</p>
            <p class="text-sm font-medium">{{ restockItem.maxStock }} {{ restockItem.unit }}</p>
          </div>
        </div>

        <!-- Add quantity -->
        <div class="space-y-2">
          <Label for="restock-qty">Add Quantity ({{ restockItem.unit }})</Label>
          <Input
            id="restock-qty"
            v-model.number="restockQty"
            type="number"
            :min="0"
            :max="restockItem.maxStock - restockItem.currentStock"
            step="0.1"
            placeholder="0"
          />
          <p class="text-xs text-muted-foreground">
            Space available: {{ (restockItem.maxStock - restockItem.currentStock).toFixed(2) }} {{ restockItem.unit }}
          </p>
        </div>

        <!-- Notes -->
        <div class="space-y-2">
          <Label for="restock-notes">Notes / Reason</Label>
          <Input
            id="restock-notes"
            v-model="restockNotes"
            placeholder="e.g. Weekly delivery from supplier"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="restockOpen = false">Cancel</Button>
        <Button
          class="bg-green-600 hover:bg-green-700 text-white"
          :disabled="restockQty <= 0 || restockLoading"
          @click="confirmRestock"
        >
          <RefreshCw class="w-4 h-4" :class="restockLoading ? 'animate-spin' : ''" />
          {{ restockLoading ? 'Restocking…' : 'Confirm Restock' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- ─────────────────────────────────────────────────────────────────────────
       Dialog 2: Adjustment
  ───────────────────────────────────────────────────────────────────────────── -->
  <Dialog :open="adjustOpen" @update:open="adjustOpen = $event">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Edit3 class="w-5 h-5 text-blue-600" />
          Adjust Stock — {{ adjustItem?.name }}
        </DialogTitle>
        <DialogDescription>
          Record a stock adjustment or waste event.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-2" v-if="adjustItem">
        <!-- Current stock display -->
        <div class="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
          <div>
            <p class="text-xs text-muted-foreground">Current Stock</p>
            <p class="text-xl font-bold">
              {{ adjustItem.currentStock }}
              <span class="text-sm font-normal text-muted-foreground">{{ adjustItem.unit }}</span>
            </p>
          </div>
          <span
            class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold"
            :class="statusBadgeClass(inventoryStore.stockStatus(adjustItem))"
          >
            {{ statusLabel(inventoryStore.stockStatus(adjustItem)) }}
          </span>
        </div>

        <!-- Type -->
        <div class="space-y-2">
          <Label>Adjustment Type</Label>
          <Select :model-value="adjustType" @update:model-value="adjustType = $event as typeof adjustType">
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="adjustment">Adjustment (stock count correction)</SelectItem>
              <SelectItem value="waste">Waste (spoilage / breakage)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Quantity with +/- toggle -->
        <div class="space-y-2">
          <Label>Quantity ({{ adjustItem.unit }})</Label>
          <div class="flex gap-2">
            <Button
              type="button"
              size="sm"
              :variant="adjustNegative ? 'destructive' : 'outline'"
              class="w-10 shrink-0"
              @click="adjustNegative = true"
            >
              <Minus class="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              size="sm"
              :variant="!adjustNegative ? 'default' : 'outline'"
              class="w-10 shrink-0"
              @click="adjustNegative = false"
            >
              <Plus class="w-3.5 h-3.5" />
            </Button>
            <Input
              v-model.number="adjustQty"
              type="number"
              :min="0"
              step="0.1"
              placeholder="0"
            />
          </div>
          <p class="text-xs text-muted-foreground">
            Result:
            <strong>{{ Math.max(adjustItem.currentStock + (adjustNegative ? -Math.abs(adjustQty) : Math.abs(adjustQty)), 0).toFixed(2) }}</strong>
            {{ adjustItem.unit }}
          </p>
        </div>

        <!-- Reason -->
        <div class="space-y-2">
          <Label for="adjust-reason">
            Reason
            <span class="text-destructive">*</span>
          </Label>
          <Input
            id="adjust-reason"
            v-model="adjustReason"
            placeholder="e.g. Stock count revealed discrepancy"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="adjustOpen = false">Cancel</Button>
        <Button
          :disabled="adjustQty === 0 || !adjustReason.trim() || adjustLoading"
          @click="confirmAdjust"
        >
          <Edit3 class="w-4 h-4" />
          {{ adjustLoading ? 'Saving…' : 'Save Adjustment' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- ─────────────────────────────────────────────────────────────────────────
       Dialog 3: Movement History
  ───────────────────────────────────────────────────────────────────────────── -->
  <Dialog :open="historyOpen" @update:open="historyOpen = $event">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <History class="w-5 h-5" />
          Stock History — {{ historyItem?.name }}
        </DialogTitle>
        <DialogDescription>
          Full movement log for this inventory item.
        </DialogDescription>
      </DialogHeader>

      <div class="max-h-96 overflow-y-auto -mx-6 px-6">
        <div v-if="historyMovements.length === 0" class="text-center py-10 text-muted-foreground text-sm">
          No movements recorded for this item.
        </div>
        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead class="text-right">Qty</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="mov in historyMovements"
              :key="mov.id"
              class="hover:bg-muted/30 transition-colors"
            >
              <TableCell>
                <span
                  class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold capitalize"
                  :class="movementTypeBadgeClass(mov.type)"
                >
                  {{ mov.type }}
                </span>
              </TableCell>
              <TableCell
                class="text-right font-mono text-sm font-semibold"
                :class="mov.quantity >= 0 ? 'text-green-600' : 'text-red-600'"
              >
                {{ mov.quantity >= 0 ? '+' : '' }}{{ mov.quantity }}
              </TableCell>
              <TableCell class="text-sm text-muted-foreground max-w-48 truncate">
                {{ mov.reason }}
                <span v-if="mov.orderId" class="ml-1 text-xs font-mono opacity-60">({{ mov.orderId }})</span>
              </TableCell>
              <TableCell class="text-xs text-muted-foreground whitespace-nowrap">
                {{ formatDate(mov.timestamp) }}
              </TableCell>
              <TableCell class="text-sm text-muted-foreground">
                {{ mov.performedBy }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="historyOpen = false">Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- ─────────────────────────────────────────────────────────────────────────
       Dialog 4: Add Item
  ───────────────────────────────────────────────────────────────────────────── -->
  <Dialog :open="addOpen" @update:open="addOpen = $event">
    <DialogContent class="max-w-lg">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <PackagePlus class="w-5 h-5 text-primary" />
          Add Inventory Item
        </DialogTitle>
        <DialogDescription>
          Create a new inventory item to track in the system.
        </DialogDescription>
      </DialogHeader>

      <div class="grid grid-cols-2 gap-4 py-2">
        <!-- Name -->
        <div class="col-span-2 space-y-2">
          <Label for="add-name">Item Name <span class="text-destructive">*</span></Label>
          <Input id="add-name" v-model="addForm.name" placeholder="e.g. Arborio Rice" />
        </div>

        <!-- Category -->
        <div class="space-y-2">
          <Label>Category</Label>
          <Select :model-value="addForm.category" @update:model-value="addForm.category = $event as InventoryItem['category']">
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ingredient">Ingredient</SelectItem>
              <SelectItem value="beverage">Beverage</SelectItem>
              <SelectItem value="packaging">Packaging</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Unit -->
        <div class="space-y-2">
          <Label>Unit</Label>
          <Select :model-value="addForm.unit" @update:model-value="addForm.unit = $event">
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kg">kg</SelectItem>
              <SelectItem value="liters">liters</SelectItem>
              <SelectItem value="pieces">pieces</SelectItem>
              <SelectItem value="portions">portions</SelectItem>
              <SelectItem value="bottles">bottles</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Current Stock -->
        <div class="space-y-2">
          <Label for="add-current">Current Stock</Label>
          <Input id="add-current" v-model.number="addForm.currentStock" type="number" min="0" step="0.1" placeholder="0" />
        </div>

        <!-- Min Stock -->
        <div class="space-y-2">
          <Label for="add-min">Min Stock (alert threshold)</Label>
          <Input id="add-min" v-model.number="addForm.minStock" type="number" min="0" step="0.1" placeholder="0" />
        </div>

        <!-- Max Stock -->
        <div class="space-y-2">
          <Label for="add-max">Max Stock (capacity) <span class="text-destructive">*</span></Label>
          <Input id="add-max" v-model.number="addForm.maxStock" type="number" min="1" step="0.1" placeholder="0" />
        </div>

        <!-- Cost per Unit -->
        <div class="space-y-2">
          <Label for="add-cost">Cost per Unit ($)</Label>
          <Input id="add-cost" v-model.number="addForm.costPerUnit" type="number" min="0" step="0.01" placeholder="0.00" />
        </div>

        <!-- Supplier -->
        <div class="col-span-2 space-y-2">
          <Label for="add-supplier">Supplier (optional)</Label>
          <Input id="add-supplier" v-model="addForm.supplier" placeholder="e.g. Fresh Produce Direct" />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="addOpen = false">Cancel</Button>
        <Button
          :disabled="!addForm.name.trim() || addForm.maxStock <= 0 || addLoading"
          @click="confirmAddItem"
        >
          <PackagePlus class="w-4 h-4" />
          {{ addLoading ? 'Adding…' : 'Add Item' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
