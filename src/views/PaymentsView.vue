<script setup lang="ts">
import { ref, computed } from 'vue'
import Card from '@/components/ui/card.vue'
import CardContent from '@/components/ui/card-content.vue'
import CardHeader from '@/components/ui/card-header.vue'
import CardTitle from '@/components/ui/card-title.vue'
import Badge from '@/components/ui/badge.vue'
import Button from '@/components/ui/button.vue'
import Input from '@/components/ui/input.vue'
import Label from '@/components/ui/label.vue'
import Dialog from '@/components/ui/dialog.vue'
import DialogContent from '@/components/ui/dialog-content.vue'
import DialogHeader from '@/components/ui/dialog-header.vue'
import DialogTitle from '@/components/ui/dialog-title.vue'
import DialogFooter from '@/components/ui/dialog-footer.vue'
import Select from '@/components/ui/select.vue'
import SelectTrigger from '@/components/ui/select-trigger.vue'
import SelectValue from '@/components/ui/select-value.vue'
import SelectContent from '@/components/ui/select-content.vue'
import SelectItem from '@/components/ui/select-item.vue'
import Separator from '@/components/ui/separator.vue'
import { cn } from '@/lib/utils'
import {
  DollarSign,
  Banknote,
  CreditCard,
  Smartphone,
  RotateCcw,
  Receipt,
  Search,
  Filter,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Printer,
} from 'lucide-vue-next'

// ── Types ──────────────────────────────────────────────────────────────────
type PaymentMethod = 'cash' | 'card' | 'digital'
type PaymentStatus = 'completed' | 'refunded' | 'pending'

interface PaymentItem {
  name: string
  qty: number
  price: number
}

interface Payment {
  id: string
  time: string
  table: string
  items: PaymentItem[]
  total: number
  method: PaymentMethod
  status: PaymentStatus
  tip: number
  server: string
}

// ── Mock data ──────────────────────────────────────────────────────────────
const payments = ref<Payment[]>([
  {
    id: 'TXN-4821',
    time: '21:34',
    table: 'Table 3',
    items: [
      { name: 'Grilled Ribeye Steak', qty: 2, price: 38.0 },
      { name: 'Cappuccino', qty: 2, price: 4.75 },
    ],
    total: 87.5,
    method: 'card',
    status: 'completed',
    tip: 13.0,
    server: 'Jane Waiter',
  },
  {
    id: 'TXN-4820',
    time: '21:11',
    table: 'Table 7',
    items: [
      { name: 'Margherita Pizza', qty: 1, price: 18.0 },
      { name: 'Fresh Orange Juice', qty: 2, price: 5.5 },
    ],
    total: 29.0,
    method: 'cash',
    status: 'completed',
    tip: 4.0,
    server: 'Mike Floor',
  },
  {
    id: 'TXN-4819',
    time: '20:58',
    table: 'Takeaway',
    items: [{ name: 'Mushroom Risotto', qty: 1, price: 22.0 } ],
    total: 22.0,
    method: 'digital',
    status: 'completed',
    tip: 2.5,
    server: 'Alice Cashier',
  },
  {
    id: 'TXN-4818',
    time: '20:43',
    table: 'Table 1',
    items: [
      { name: 'Pan-Seared Salmon', qty: 2, price: 26.0 },
      { name: 'Calamari Fritti', qty: 2, price: 13.5 },
      { name: 'Tiramisu', qty: 2, price: 9.5 },
    ],
    total: 98.0,
    method: 'card',
    status: 'refunded',
    tip: 0,
    server: 'Jane Waiter',
  },
  {
    id: 'TXN-4817',
    time: '20:29',
    table: 'Table 9',
    items: [
      { name: 'Caesar Salad', qty: 1, price: 12.0 },
      { name: 'Bruschetta al Pomodoro', qty: 2, price: 9.0 },
      { name: 'Espresso', qty: 2, price: 3.5 },
    ],
    total: 37.0,
    method: 'card',
    status: 'completed',
    tip: 6.0,
    server: 'Mike Floor',
  },
  {
    id: 'TXN-4816',
    time: '20:05',
    table: 'Table 2',
    items: [
      { name: 'Chocolate Lava Cake', qty: 2, price: 11.0 },
      { name: 'Cappuccino', qty: 2, price: 4.75 },
    ],
    total: 31.5,
    method: 'digital',
    status: 'completed',
    tip: 5.0,
    server: 'Jane Waiter',
  },
  {
    id: 'TXN-4815',
    time: '19:50',
    table: 'Table 5',
    items: [{ name: 'Grilled Ribeye Steak', qty: 1, price: 38.0 }],
    total: 38.0,
    method: 'cash',
    status: 'pending',
    tip: 0,
    server: 'Mike Floor',
  },
])

// ── Stats ──────────────────────────────────────────────────────────────────
const todayTotal = computed(() =>
  payments.value
    .filter((p) => p.status !== 'refunded')
    .reduce((s, p) => s + p.total, 0),
)
const cashTotal = computed(() =>
  payments.value
    .filter((p) => p.method === 'cash' && p.status !== 'refunded')
    .reduce((s, p) => s + p.total, 0),
)
const cardTotal = computed(() =>
  payments.value
    .filter((p) => p.method === 'card' && p.status !== 'refunded')
    .reduce((s, p) => s + p.total, 0),
)
const digitalTotal = computed(() =>
  payments.value
    .filter((p) => p.method === 'digital' && p.status !== 'refunded')
    .reduce((s, p) => s + p.total, 0),
)
const refundTotal = computed(() =>
  payments.value
    .filter((p) => p.status === 'refunded')
    .reduce((s, p) => s + p.total, 0),
)

// ── Filters ────────────────────────────────────────────────────────────────
const methodFilter = ref<PaymentMethod | 'all'>('all')
const searchQuery = ref('')

const filteredPayments = computed(() => {
  let list = payments.value
  if (methodFilter.value !== 'all') {
    list = list.filter((p) => p.method === methodFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.table.toLowerCase().includes(q) ||
        p.server.toLowerCase().includes(q),
    )
  }
  return list
})

// ── Method helpers ─────────────────────────────────────────────────────────
const methodIcon = { cash: Banknote, card: CreditCard, digital: Smartphone }
const methodLabel: Record<PaymentMethod, string> = { cash: 'Cash', card: 'Card', digital: 'Digital' }
const methodClass: Record<PaymentMethod, string> = {
  cash: 'text-green-600 bg-green-50',
  card: 'text-blue-600 bg-blue-50',
  digital: 'text-purple-600 bg-purple-50',
}

// ── Status helpers ─────────────────────────────────────────────────────────
const statusIcon = { completed: CheckCircle2, refunded: RotateCcw, pending: Clock }
const statusClass: Record<PaymentStatus, string> = {
  completed: 'text-green-600',
  refunded: 'text-amber-600',
  pending: 'text-gray-400',
}
const statusBadgeClass: Record<PaymentStatus, string> = {
  completed: 'bg-green-100 text-green-700 border-green-200',
  refunded: 'bg-amber-100 text-amber-700 border-amber-200',
  pending: 'bg-gray-100 text-gray-600 border-gray-200',
}

// ── Receipt panel ──────────────────────────────────────────────────────────
const selectedPayment = ref<Payment | null>(null)

function selectPayment(p: Payment) {
  selectedPayment.value = selectedPayment.value?.id === p.id ? null : p
}

// ── Refund dialog ──────────────────────────────────────────────────────────
const refundDialogOpen = ref(false)
const refundPayment = ref<Payment | null>(null)
const refundReason = ref('')

function openRefund(p: Payment) {
  refundPayment.value = p
  refundReason.value = ''
  refundDialogOpen.value = true
}

function confirmRefund() {
  if (!refundPayment.value) return
  const idx = payments.value.findIndex((p) => p.id === refundPayment.value!.id)
  if (idx !== -1) {
    const payment = payments.value[idx]!
    payment.status = 'refunded'
    payment.tip = 0
    if (selectedPayment.value?.id === refundPayment.value.id) {
      selectedPayment.value = { ...payment }
    }
  }
  refundDialogOpen.value = false
}

// ── Receipt subtotal ───────────────────────────────────────────────────────
function receiptSubtotal(p: Payment): number {
  return p.items.reduce((s, i) => s + i.qty * i.price, 0)
}
</script>

<template>
  <div class="p-6 bg-background min-h-screen flex flex-col gap-6">
    <!-- Page header -->
    <div>
      <h1 class="text-2xl font-bold flex items-center gap-2">
        <Receipt class="w-7 h-7 text-primary" />
        Payments
      </h1>
      <p class="text-sm text-muted-foreground mt-0.5">Transaction history and payment processing</p>
    </div>

    <!-- ── Stats cards ──────────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <Card class="lg:col-span-1">
        <CardContent class="p-4">
          <div class="flex items-center gap-2 mb-1">
            <DollarSign class="w-4 h-4 text-green-600" />
            <span class="text-xs text-muted-foreground">Today's Total</span>
          </div>
          <p class="text-xl font-bold">${{ todayTotal.toFixed(2) }}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center gap-2 mb-1">
            <Banknote class="w-4 h-4 text-green-600" />
            <span class="text-xs text-muted-foreground">Cash</span>
          </div>
          <p class="text-xl font-bold">${{ cashTotal.toFixed(2) }}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center gap-2 mb-1">
            <CreditCard class="w-4 h-4 text-blue-600" />
            <span class="text-xs text-muted-foreground">Card</span>
          </div>
          <p class="text-xl font-bold">${{ cardTotal.toFixed(2) }}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center gap-2 mb-1">
            <Smartphone class="w-4 h-4 text-purple-600" />
            <span class="text-xs text-muted-foreground">Digital</span>
          </div>
          <p class="text-xl font-bold">${{ digitalTotal.toFixed(2) }}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center gap-2 mb-1">
            <RotateCcw class="w-4 h-4 text-amber-600" />
            <span class="text-xs text-muted-foreground">Refunds</span>
          </div>
          <p class="text-xl font-bold text-amber-600">-${{ refundTotal.toFixed(2) }}</p>
        </CardContent>
      </Card>
    </div>

    <!-- Main area: table + receipt panel -->
    <div class="flex gap-5 items-start">
      <!-- ── Transaction table ──────────────────────────────────────────── -->
      <div class="flex-1 flex flex-col gap-3 min-w-0">
        <!-- Toolbar -->
        <div class="flex items-center gap-3 flex-wrap">
          <div class="relative flex-1 min-w-40 max-w-xs">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input v-model="searchQuery" placeholder="Search…" class="pl-9" />
          </div>

          <div class="flex items-center gap-1.5">
            <Filter class="w-4 h-4 text-muted-foreground" />
            <Select :model-value="methodFilter" @update:model-value="methodFilter = $event as PaymentMethod | 'all'">
              <SelectTrigger class="w-36">
                <SelectValue placeholder="All methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Table -->
        <Card>
          <CardContent class="p-0">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-border bg-muted/40">
                    <th class="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                    <th class="text-left px-4 py-3 font-medium text-muted-foreground">Time</th>
                    <th class="text-left px-4 py-3 font-medium text-muted-foreground">Table</th>
                    <th class="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                    <th class="text-left px-4 py-3 font-medium text-muted-foreground">Method</th>
                    <th class="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th class="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  <tr
                    v-if="filteredPayments.length === 0"
                    class="text-center"
                  >
                    <td colspan="7" class="py-12 text-muted-foreground">No transactions found</td>
                  </tr>

                  <tr
                    v-for="payment in filteredPayments"
                    :key="payment.id"
                    :class="cn(
                      'cursor-pointer transition-colors',
                      selectedPayment?.id === payment.id
                        ? 'bg-primary/5'
                        : 'hover:bg-muted/20',
                    )"
                    @click="selectPayment(payment)"
                  >
                    <td class="px-4 py-3 font-mono text-xs text-muted-foreground">{{ payment.id }}</td>
                    <td class="px-4 py-3 font-mono text-xs">{{ payment.time }}</td>
                    <td class="px-4 py-3 font-medium">{{ payment.table }}</td>
                    <td class="px-4 py-3 text-right font-semibold">${{ payment.total.toFixed(2) }}</td>
                    <td class="px-4 py-3">
                      <span
                        :class="cn(
                          'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                          methodClass[payment.method],
                        )"
                      >
                        <component :is="methodIcon[payment.method]" class="w-3 h-3" />
                        {{ methodLabel[payment.method] }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <Badge
                        :class="cn('border text-xs font-medium', statusBadgeClass[payment.status])"
                      >
                        <component :is="statusIcon[payment.status]" class="w-3 h-3 mr-1" />
                        {{ payment.status.charAt(0).toUpperCase() + payment.status.slice(1) }}
                      </Badge>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <div class="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          class="h-7 w-7"
                          @click.stop="selectPayment(payment)"
                          title="View receipt"
                        >
                          <Receipt class="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          v-if="payment.status === 'completed'"
                          variant="ghost"
                          size="icon"
                          class="h-7 w-7 text-amber-600 hover:text-amber-700"
                          @click.stop="openRefund(payment)"
                          title="Refund"
                        >
                          <RotateCcw class="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- ── Receipt preview panel ─────────────────────────────────────── -->
      <div
        v-if="selectedPayment"
        class="w-72 shrink-0 sticky top-6"
      >
        <Card class="border-2 border-primary/20">
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
              <CardTitle class="text-base flex items-center gap-1.5">
                <Receipt class="w-4 h-4 text-primary" />
                Receipt
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                class="h-7 w-7"
                @click="selectedPayment = null"
              >
                <X class="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent class="pt-0">
            <!-- Receipt header info -->
            <div class="text-center py-3 border-y border-dashed border-border mb-3">
              <p class="font-bold text-lg">The Restaurant</p>
              <p class="text-xs text-muted-foreground">123 Main Street</p>
              <p class="text-xs text-muted-foreground mt-2">
                {{ selectedPayment.table }} &bull; {{ selectedPayment.time }}
              </p>
              <p class="text-xs text-muted-foreground">Server: {{ selectedPayment.server }}</p>
              <p class="font-mono text-xs text-muted-foreground mt-1">{{ selectedPayment.id }}</p>
            </div>

            <!-- Items -->
            <div class="space-y-1.5 mb-3">
              <div
                v-for="(item, i) in selectedPayment.items"
                :key="i"
                class="flex items-start justify-between gap-2 text-sm"
              >
                <div class="flex-1 min-w-0">
                  <span class="font-medium">{{ item.qty }}x</span>
                  <span class="ml-1.5">{{ item.name }}</span>
                </div>
                <span class="shrink-0 font-medium">${{ (item.qty * item.price).toFixed(2) }}</span>
              </div>
            </div>

            <Separator class="my-2" />

            <!-- Totals -->
            <div class="space-y-1.5 text-sm">
              <div class="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${{ receiptSubtotal(selectedPayment).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-muted-foreground">
                <span>Tax (8%)</span>
                <span>${{ (receiptSubtotal(selectedPayment) * 0.08).toFixed(2) }}</span>
              </div>
              <div v-if="selectedPayment.tip > 0" class="flex justify-between text-muted-foreground">
                <span>Tip</span>
                <span>${{ selectedPayment.tip.toFixed(2) }}</span>
              </div>
            </div>

            <Separator class="my-2" />

            <div class="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>${{ selectedPayment.total.toFixed(2) }}</span>
            </div>

            <!-- Payment method + status -->
            <div class="mt-3 flex items-center justify-between text-xs">
              <span
                :class="cn(
                  'inline-flex items-center gap-1 font-medium px-2 py-1 rounded-full',
                  methodClass[selectedPayment.method],
                )"
              >
                <component :is="methodIcon[selectedPayment.method]" class="w-3 h-3" />
                {{ methodLabel[selectedPayment.method] }}
              </span>
              <Badge :class="cn('border', statusBadgeClass[selectedPayment.status])">
                {{ selectedPayment.status }}
              </Badge>
            </div>

            <!-- Actions -->
            <div class="mt-4 flex gap-2">
              <Button size="sm" variant="outline" class="flex-1 gap-1.5">
                <Printer class="w-3.5 h-3.5" />
                Print
              </Button>
              <Button
                v-if="selectedPayment.status === 'completed'"
                size="sm"
                variant="outline"
                class="flex-1 gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50"
                @click="openRefund(selectedPayment)"
              >
                <RotateCcw class="w-3.5 h-3.5" />
                Refund
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- ── Refund dialog ──────────────────────────────────────────────── -->
    <Dialog :open="refundDialogOpen" @update:open="refundDialogOpen = $event">
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <AlertCircle class="w-5 h-5 text-amber-500" />
            Confirm Refund
          </DialogTitle>
        </DialogHeader>

        <div class="py-2 space-y-4">
          <div class="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            You are about to refund
            <span class="font-bold">${{ refundPayment?.total.toFixed(2) }}</span>
            for order <span class="font-mono font-semibold">{{ refundPayment?.id }}</span>.
          </div>

          <div class="space-y-1.5">
            <Label>Reason for Refund</Label>
            <Input
              v-model="refundReason"
              placeholder="e.g. Customer complaint, wrong order…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="refundDialogOpen = false">Cancel</Button>
          <Button
            class="bg-amber-600 hover:bg-amber-500 text-white"
            @click="confirmRefund"
          >
            <RotateCcw class="w-4 h-4" />
            Process Refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
