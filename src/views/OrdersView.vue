<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useMenuStore } from '@/stores/menu'
import { useOrdersStore } from '@/stores/orders'
import { useTablesStore } from '@/stores/tables'
import type { MenuItem } from '@/stores/menu'
import type { PaymentMethod } from '@/stores/orders'
import Button from '@/components/ui/button.vue'
import Card from '@/components/ui/card.vue'
import CardContent from '@/components/ui/card-content.vue'
import CardHeader from '@/components/ui/card-header.vue'
import CardTitle from '@/components/ui/card-title.vue'
import Badge from '@/components/ui/badge.vue'
import Input from '@/components/ui/input.vue'
import Label from '@/components/ui/label.vue'
import Separator from '@/components/ui/separator.vue'
import Dialog from '@/components/ui/dialog.vue'
import DialogContent from '@/components/ui/dialog-content.vue'
import DialogHeader from '@/components/ui/dialog-header.vue'
import DialogTitle from '@/components/ui/dialog-title.vue'
import Tabs from '@/components/ui/tabs.vue'
import TabsList from '@/components/ui/tabs-list.vue'
import TabsTrigger from '@/components/ui/tabs-trigger.vue'
import TabsContent from '@/components/ui/tabs-content.vue'
import ScrollArea from '@/components/ui/scroll-area.vue'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  SendHorizontal,
  CreditCard,
  Banknote,
  Smartphone,
  Loader2,
  ShoppingCart,
  ChevronDown,
  AlertCircle,
  Check,
} from 'lucide-vue-next'

const menuStore = useMenuStore()
const ordersStore = useOrdersStore()
const tablesStore = useTablesStore()

// ── State ─────────────────────────────────────────────────────────────────────

const searchQuery = ref('')
const activeCategoryId = ref<string>('all')
const selectedTableId = ref<string>('')
const orderNotes = ref('')
const discountInput = ref('')
const tipPreset = ref<string>('')
const customTip = ref('')
const paymentOpen = ref(false)
const paymentMethod = ref<PaymentMethod>('card')
const cashInput = ref('')
const processingPayment = ref(false)
const sendingToKitchen = ref(false)
const paymentSuccess = ref(false)

// ── Init ──────────────────────────────────────────────────────────────────────

onMounted(async () => {
  await Promise.all([
    menuStore.fetchMenu(),
    ordersStore.fetchOrders(),
    tablesStore.fetchTables(),
  ])
})

// ── Computed ──────────────────────────────────────────────────────────────────

const allCategories = computed(() => [
  { id: 'all', name: 'All Items', color: '#6366F1', icon: '🍴' },
  ...menuStore.categories,
])

const filteredItems = computed(() => {
  let items = menuStore.items
  if (activeCategoryId.value !== 'all') {
    items = items.filter((i) => i.categoryId === activeCategoryId.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    items = items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q),
    )
  }
  return items
})

const availableTables = computed(() =>
  tablesStore.tables.filter((t) => t.status === 'available' || t.status === 'occupied'),
)

const activeOrder = computed(() => ordersStore.activeOrder)

const discountPct = computed(() => parseFloat(discountInput.value) || 0)
const discountDollar = computed(() =>
  (ordersStore.subtotal * discountPct.value) / 100,
)

const tipPercent = computed(() => {
  if (tipPreset.value === 'custom') return parseFloat(customTip.value) || 0
  return parseFloat(tipPreset.value) || 0
})

const tipDollar = computed(() => {
  const base = ordersStore.subtotal - discountDollar.value
  return base * (tipPercent.value / 100)
})

const grandTotal = computed(() => {
  const sub = ordersStore.subtotal
  const disc = discountDollar.value
  const base = sub - disc
  const tax = base * 0.08
  return base + tax + tipDollar.value
})

const cashChange = computed(() => {
  const tendered = parseFloat(cashInput.value) || 0
  return Math.max(0, tendered - grandTotal.value)
})

// ── Watchers ──────────────────────────────────────────────────────────────────

watch(discountInput, (val) => {
  const n = parseFloat(val)
  if (!isNaN(n) && activeOrder.value) {
    ordersStore.setDiscount(ordersStore.subtotal * (n / 100))
  }
})

watch([tipPreset, customTip], () => {
  if (activeOrder.value) {
    ordersStore.setTip(tipDollar.value)
  }
})

// ── Actions ───────────────────────────────────────────────────────────────────

async function ensureOrder() {
  if (!activeOrder.value) {
    await ordersStore.createOrder(selectedTableId.value || undefined)
  }
}

async function addToOrder(item: MenuItem) {
  if (!item.available) return
  await ensureOrder()
  await ordersStore.addItem({ menuItemId: item.id, quantity: 1 })
}

async function changeQty(itemId: string, delta: number) {
  const item = activeOrder.value?.items.find((i) => i.id === itemId)
  if (!item) return
  await ordersStore.updateItemQuantity(itemId, item.quantity + delta)
}

async function removeItem(itemId: string) {
  await ordersStore.removeItem(itemId)
}

async function handleSendToKitchen() {
  if (!activeOrder.value || sendingToKitchen.value) return
  sendingToKitchen.value = true
  try {
    await ordersStore.sendToKitchen(activeOrder.value.id)
  } finally {
    sendingToKitchen.value = false
  }
}

async function handleProcessPayment() {
  if (!activeOrder.value || processingPayment.value) return
  processingPayment.value = true
  try {
    await ordersStore.processPayment(
      activeOrder.value.id,
      paymentMethod.value,
      grandTotal.value,
    )
    paymentSuccess.value = true
    setTimeout(() => {
      paymentOpen.value = false
      paymentSuccess.value = false
      discountInput.value = ''
      tipPreset.value = ''
      customTip.value = ''
      cashInput.value = ''
    }, 1800)
  } finally {
    processingPayment.value = false
  }
}

function itemQtyInOrder(menuItemId: string): number {
  return (
    activeOrder.value?.items
      .filter((i) => i.menuItemId === menuItemId)
      .reduce((s, i) => s + i.quantity, 0) ?? 0
  )
}

function categoryColor(categoryId: string): string {
  return menuStore.categories.find((c) => c.id === categoryId)?.color ?? '#6366F1'
}

// Color-coded bg for item cards
const bgColors = [
  'bg-blue-500/10',
  'bg-amber-500/10',
  'bg-rose-500/10',
  'bg-violet-500/10',
  'bg-emerald-500/10',
  'bg-cyan-500/10',
]

function itemBg(idx: number): string {
  return bgColors[idx % bgColors.length] ?? 'bg-blue-500/10'
}
</script>

<template>
  <div class="flex h-[calc(100vh-4rem)] overflow-hidden">
    <!-- ══════════════ LEFT PANEL – Menu ══════════════ -->
    <div class="flex flex-col flex-1 min-w-0 border-r border-border">
      <!-- Search + Category tabs header -->
      <div class="shrink-0 p-4 space-y-3 border-b border-border bg-card">
        <!-- Search -->
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            v-model="searchQuery"
            placeholder="Search menu items..."
            class="pl-9"
          />
        </div>

        <!-- Category filter (horizontally scrollable) -->
        <ScrollArea orientation="horizontal" class="w-full pb-1">
          <div class="flex gap-2 pb-1">
            <button
              v-for="cat in allCategories"
              :key="cat.id"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border"
              :class="
                activeCategoryId === cat.id
                  ? 'text-white border-transparent shadow-sm'
                  : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground bg-card'
              "
              :style="activeCategoryId === cat.id ? { backgroundColor: cat.color } : {}"
              @click="activeCategoryId = cat.id"
            >
              <span>{{ cat.icon }}</span>
              {{ cat.name }}
            </button>
          </div>
        </ScrollArea>
      </div>

      <!-- Menu grid -->
      <ScrollArea class="flex-1">
        <div v-if="menuStore.loading" class="flex items-center justify-center h-40">
          <Loader2 class="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
        <div
          v-else-if="filteredItems.length === 0"
          class="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2"
        >
          <Search class="w-8 h-8 opacity-30" />
          <p class="text-sm">No items found</p>
        </div>
        <div
          v-else
          class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 p-4"
        >
          <button
            v-for="(item, idx) in filteredItems"
            :key="item.id"
            class="relative group flex flex-col rounded-xl border overflow-hidden text-left transition-all hover:shadow-md"
            :class="[
              item.available
                ? 'border-border hover:border-primary/50 bg-card cursor-pointer'
                : 'border-border/50 bg-muted/30 cursor-not-allowed opacity-60',
            ]"
            :disabled="!item.available"
            @click="addToOrder(item)"
          >
            <!-- Colored image placeholder -->
            <div
              class="h-24 flex items-center justify-center text-3xl font-bold relative"
              :class="itemBg(idx)"
            >
              <span>{{ menuStore.categories.find((c) => c.id === item.categoryId)?.icon ?? '🍽️' }}</span>

              <!-- In-cart indicator -->
              <div
                v-if="itemQtyInOrder(item.id) > 0"
                class="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow"
              >
                {{ itemQtyInOrder(item.id) }}
              </div>

              <!-- Unavailable overlay -->
              <div
                v-if="!item.available"
                class="absolute inset-0 bg-background/60 flex items-center justify-center"
              >
                <span class="text-xs font-semibold text-muted-foreground px-2 py-0.5 bg-background/90 rounded">
                  Unavailable
                </span>
              </div>
            </div>

            <!-- Info -->
            <div class="p-2.5 flex-1 space-y-1">
              <p class="text-sm font-semibold leading-tight line-clamp-1">{{ item.name }}</p>
              <p class="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{{ item.description }}</p>
              <div class="flex items-center justify-between pt-0.5">
                <span class="text-sm font-bold text-primary">${{ item.price.toFixed(2) }}</span>
                <div
                  v-if="item.available"
                  class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  <Plus class="w-3 h-3 text-primary group-hover:text-primary-foreground" />
                </div>
              </div>
            </div>
          </button>
        </div>
      </ScrollArea>
    </div>

    <!-- ══════════════ RIGHT PANEL – Current Order ══════════════ -->
    <div class="flex flex-col w-[380px] xl:w-[420px] shrink-0 bg-card">
      <!-- Order header -->
      <div class="shrink-0 p-4 border-b border-border">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold flex items-center gap-2">
            <ShoppingCart class="w-4 h-4 text-primary" />
            Current Order
          </h2>
          <Badge variant="outline" class="font-mono text-xs">
            {{ activeOrder?.id?.slice(-6).toUpperCase() ?? 'New' }}
          </Badge>
        </div>

        <!-- Table selector -->
        <div>
          <Label class="text-xs text-muted-foreground mb-1 block">Table</Label>
          <div class="relative">
            <select
              v-model="selectedTableId"
              class="w-full h-9 rounded-md border border-input bg-transparent px-3 py-2 text-sm pr-8 appearance-none focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Takeaway / No Table</option>
              <option
                v-for="table in availableTables"
                :key="table.id"
                :value="table.id"
              >
                Table {{ table.number }} ({{ table.section }}) — {{ table.capacity }} seats — {{ table.status }}
              </option>
            </select>
            <ChevronDown class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      <!-- Order items -->
      <ScrollArea class="flex-1 px-4">
        <div
          v-if="!activeOrder || activeOrder.items.length === 0"
          class="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3"
        >
          <ShoppingCart class="w-10 h-10 opacity-20" />
          <p class="text-sm text-center">Add items from the menu to start an order</p>
        </div>

        <div v-else class="py-3 space-y-2">
          <div
            v-for="item in activeOrder.items"
            :key="item.id"
            class="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
          >
            <!-- Qty controls -->
            <div class="flex flex-col items-center gap-1">
              <button
                class="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                @click="changeQty(item.id, 1)"
              >
                <Plus class="w-3 h-3" />
              </button>
              <span class="text-sm font-bold w-4 text-center">{{ item.quantity }}</span>
              <button
                class="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                @click="changeQty(item.id, -1)"
              >
                <Minus class="w-3 h-3" />
              </button>
            </div>

            <!-- Item info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold truncate">{{ item.name }}</p>
              <p v-if="item.modifiers.length" class="text-xs text-muted-foreground">
                {{ item.modifiers.join(', ') }}
              </p>
              <p v-if="item.notes" class="text-xs text-muted-foreground italic">{{ item.notes }}</p>
            </div>

            <!-- Price + remove -->
            <div class="flex flex-col items-end gap-2 shrink-0">
              <p class="text-sm font-bold">${{ (item.price * item.quantity).toFixed(2) }}</p>
              <button
                class="text-muted-foreground hover:text-destructive transition-colors"
                @click="removeItem(item.id)"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </ScrollArea>

      <!-- Order footer: notes, discount, tip, totals, actions -->
      <div class="shrink-0 border-t border-border">
        <!-- Notes -->
        <div class="px-4 pt-3">
          <Label class="text-xs text-muted-foreground mb-1 block">Order Notes</Label>
          <textarea
            v-model="orderNotes"
            rows="2"
            placeholder="Special requests, allergies..."
            class="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>

        <!-- Discount + Tip row -->
        <div class="px-4 pt-2 grid grid-cols-2 gap-2">
          <div>
            <Label class="text-xs text-muted-foreground mb-1 block">Discount (%)</Label>
            <Input
              v-model="discountInput"
              type="number"
              placeholder="0"
              min="0"
              max="100"
              class="h-8 text-sm"
            />
          </div>
          <div>
            <Label class="text-xs text-muted-foreground mb-1 block">Tip</Label>
            <div class="flex gap-1">
              <button
                v-for="pct in ['10', '15', '20']"
                :key="pct"
                class="flex-1 h-8 text-xs rounded-md border transition-colors font-medium"
                :class="
                  tipPreset === pct
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:border-primary/50'
                "
                @click="tipPreset = tipPreset === pct ? '' : pct"
              >
                {{ pct }}%
              </button>
              <button
                class="flex-1 h-8 text-xs rounded-md border transition-colors font-medium"
                :class="
                  tipPreset === 'custom'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:border-primary/50'
                "
                @click="tipPreset = tipPreset === 'custom' ? '' : 'custom'"
              >
                Custom
              </button>
            </div>
          </div>
        </div>

        <!-- Custom tip input -->
        <div v-if="tipPreset === 'custom'" class="px-4 pt-1.5">
          <Input
            v-model="customTip"
            type="number"
            placeholder="Custom tip %"
            min="0"
            class="h-8 text-sm"
          />
        </div>

        <!-- Totals -->
        <div class="px-4 pt-3 space-y-1 text-sm">
          <div class="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>${{ ordersStore.subtotal.toFixed(2) }}</span>
          </div>
          <div v-if="discountDollar > 0" class="flex justify-between text-emerald-600">
            <span>Discount ({{ discountPct }}%)</span>
            <span>-${{ discountDollar.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between text-muted-foreground">
            <span>Tax (8%)</span>
            <span>${{ ((ordersStore.subtotal - discountDollar) * 0.08).toFixed(2) }}</span>
          </div>
          <div v-if="tipDollar > 0" class="flex justify-between text-muted-foreground">
            <span>Tip ({{ tipPercent }}%)</span>
            <span>${{ tipDollar.toFixed(2) }}</span>
          </div>
          <Separator class="my-1.5" />
          <div class="flex justify-between font-bold text-base">
            <span>TOTAL</span>
            <span class="text-primary">${{ grandTotal.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="p-4 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            :disabled="!activeOrder || activeOrder.items.length === 0 || sendingToKitchen"
            @click="handleSendToKitchen"
          >
            <Loader2 v-if="sendingToKitchen" class="w-4 h-4 animate-spin" />
            <SendHorizontal v-else class="w-4 h-4" />
            <span class="ml-1">Kitchen</span>
          </Button>

          <Button
            :disabled="!activeOrder || activeOrder.items.length === 0"
            @click="paymentOpen = true"
          >
            <CreditCard class="w-4 h-4" />
            <span class="ml-1">Payment</span>
          </Button>
        </div>
      </div>
    </div>

    <!-- ══════════════ PAYMENT DIALOG ══════════════ -->
    <Dialog :open="paymentOpen" @update:open="(v) => !processingPayment && (paymentOpen = v)">
      <DialogContent class="max-w-md">
        <!-- Success state -->
        <div v-if="paymentSuccess" class="flex flex-col items-center gap-4 py-8">
          <div class="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Check class="w-8 h-8 text-emerald-500" />
          </div>
          <div class="text-center">
            <h3 class="font-bold text-lg">Payment Successful!</h3>
            <p class="text-muted-foreground text-sm mt-1">Order has been marked as paid.</p>
          </div>
        </div>

        <!-- Payment form -->
        <template v-else>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>

          <div class="space-y-4 mt-4">
            <!-- Order summary -->
            <div class="rounded-lg bg-muted/50 p-4 space-y-1.5 text-sm">
              <div class="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${{ ordersStore.subtotal.toFixed(2) }}</span>
              </div>
              <div v-if="discountDollar > 0" class="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>-${{ discountDollar.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-muted-foreground">
                <span>Tax (8%)</span>
                <span>${{ ((ordersStore.subtotal - discountDollar) * 0.08).toFixed(2) }}</span>
              </div>
              <div v-if="tipDollar > 0" class="flex justify-between text-muted-foreground">
                <span>Tip</span>
                <span>${{ tipDollar.toFixed(2) }}</span>
              </div>
              <Separator class="my-1" />
              <div class="flex justify-between font-bold text-base">
                <span>Total Due</span>
                <span class="text-primary">${{ grandTotal.toFixed(2) }}</span>
              </div>
            </div>

            <!-- Payment method tabs -->
            <Tabs v-model="paymentMethod">
              <TabsList class="w-full grid grid-cols-3">
                <TabsTrigger value="card" class="gap-1.5">
                  <CreditCard class="w-3.5 h-3.5" />
                  Card
                </TabsTrigger>
                <TabsTrigger value="cash" class="gap-1.5">
                  <Banknote class="w-3.5 h-3.5" />
                  Cash
                </TabsTrigger>
                <TabsTrigger value="digital" class="gap-1.5">
                  <Smartphone class="w-3.5 h-3.5" />
                  Digital
                </TabsTrigger>
              </TabsList>

              <!-- Card -->
              <TabsContent value="card">
                <div class="mt-4 p-4 rounded-lg border border-border bg-muted/20 flex items-center gap-3">
                  <CreditCard class="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p class="text-sm font-medium">Card Payment</p>
                    <p class="text-xs text-muted-foreground">Tap, insert, or swipe card on terminal</p>
                  </div>
                </div>
              </TabsContent>

              <!-- Cash -->
              <TabsContent value="cash" class="space-y-3 mt-4">
                <div>
                  <Label class="text-sm mb-1.5 block">Amount Tendered</Label>
                  <Input
                    v-model="cashInput"
                    type="number"
                    placeholder="0.00"
                    :min="grandTotal"
                    step="0.01"
                    class="text-lg font-bold"
                  />
                </div>
                <div class="grid grid-cols-4 gap-2">
                  <button
                    v-for="quick in [5, 10, 20, 50]"
                    :key="quick"
                    class="py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors"
                    @click="cashInput = String(quick)"
                  >
                    ${{ quick }}
                  </button>
                </div>
                <div
                  v-if="cashInput && parseFloat(cashInput) >= grandTotal"
                  class="flex justify-between items-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                >
                  <span class="text-sm font-medium text-emerald-700">Change Due</span>
                  <span class="text-lg font-bold text-emerald-600">${{ cashChange.toFixed(2) }}</span>
                </div>
                <div
                  v-else-if="cashInput && parseFloat(cashInput) < grandTotal"
                  class="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                >
                  <AlertCircle class="w-4 h-4" />
                  Insufficient amount
                </div>
              </TabsContent>

              <!-- Digital -->
              <TabsContent value="digital">
                <div class="mt-4 p-4 rounded-lg border border-border bg-muted/20 flex items-center gap-3">
                  <Smartphone class="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p class="text-sm font-medium">Digital Wallet</p>
                    <p class="text-xs text-muted-foreground">Apple Pay, Google Pay, or QR code</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <!-- Confirm button -->
            <Button
              class="w-full h-11 text-base font-semibold"
              :disabled="
                processingPayment ||
                (paymentMethod === 'cash' && (!cashInput || parseFloat(cashInput) < grandTotal))
              "
              @click="handleProcessPayment"
            >
              <Loader2 v-if="processingPayment" class="w-4 h-4 animate-spin" />
              <span v-if="processingPayment">Processing...</span>
              <span v-else>Confirm Payment · ${{ grandTotal.toFixed(2) }}</span>
            </Button>
          </div>
        </template>
      </DialogContent>
    </Dialog>
  </div>
</template>
