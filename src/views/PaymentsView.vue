<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
  Loader2,
} from 'lucide-vue-next'
import { usePaymentsStore } from '@/stores/payments'
import type { Payment, PaymentMethod, PaymentStatus } from '@/stores/payments'

// ── Store ──────────────────────────────────────────────────────────────────
const store = usePaymentsStore()
onMounted(() => store.fetchPayments())

// ── Stats ──────────────────────────────────────────────────────────────────
const todayTotal = computed(() =>
  store.payments
    .filter((p) => p.status !== 'refunded')
    .reduce((s, p) => s + p.amount, 0),
)
const cashTotal = computed(() =>
  store.payments
    .filter((p) => p.method === 'cash' && p.status !== 'refunded')
    .reduce((s, p) => s + p.amount, 0),
)
const cardTotal = computed(() =>
  store.payments
    .filter((p) => p.method === 'card' && p.status !== 'refunded')
    .reduce((s, p) => s + p.amount, 0),
)
const digitalTotal = computed(() =>
  store.payments
    .filter((p) => p.method === 'digital' && p.status !== 'refunded')
    .reduce((s, p) => s + p.amount, 0),
)
const refundTotal = computed(() =>
  store.payments
    .filter((p) => p.status === 'refunded')
    .reduce((s, p) => s + p.amount, 0),
)

// ── Filters ────────────────────────────────────────────────────────────────
const methodFilter = ref<PaymentMethod | 'all'>('all')
const searchQuery  = ref('')

function setMethodFilter(v: unknown) { methodFilter.value = v as PaymentMethod | 'all' }

const filteredPayments = computed(() => {
  let list = store.payments
  if (methodFilter.value !== 'all') {
    list = list.filter((p) => p.method === methodFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.tableName.toLowerCase().includes(q) ||
        p.serverName.toLowerCase().includes(q),
    )
  }
  return list
})

// ── Method helpers ─────────────────────────────────────────────────────────
const methodIcon = { cash: Banknote, card: CreditCard, digital: Smartphone }
const methodLabel: Record<PaymentMethod, string> = { cash: 'Cash', card: 'Card', digital: 'Digital' }
const methodClass: Record<PaymentMethod, string> = {
  cash:    'text-green-600 bg-green-50',
  card:    'text-blue-600 bg-blue-50',
  digital: 'text-purple-600 bg-purple-50',
}

// ── Status helpers ─────────────────────────────────────────────────────────
const statusIcon = { completed: CheckCircle2, refunded: RotateCcw, pending: Clock }
const statusBadgeClass: Record<PaymentStatus, string> = {
  completed: 'bg-green-100 text-green-700 border-green-200',
  refunded:  'bg-amber-100 text-amber-700 border-amber-200',
  pending:   'bg-gray-100 text-gray-600 border-gray-200',
}

// ── Receipt panel ──────────────────────────────────────────────────────────
const selectedPayment = ref<Payment | null>(null)

function selectPayment(p: Payment) {
  selectedPayment.value = selectedPayment.value?.id === p.id ? null : p
}

// ── Refund dialog ──────────────────────────────────────────────────────────
const refundDialogOpen = ref(false)
const refundPayment    = ref<Payment | null>(null)
const refundReason     = ref('')
const refunding        = ref(false)

function openRefund(p: Payment) {
  refundPayment.value  = p
  refundReason.value   = ''
  refundDialogOpen.value = true
}

async function confirmRefund() {
  if (!refundPayment.value) return
  refunding.value = true
  try {
    await store.refundPayment(
      refundPayment.value.id,
      refundPayment.value.amount,
      refundReason.value,
    )
    // Refresh selected payment panel with updated record.
    if (selectedPayment.value?.id === refundPayment.value.id) {
      selectedPayment.value =
        store.payments.find((p) => p.id === refundPayment.value!.id) ?? null
    }
    refundDialogOpen.value = false
  } finally {
    refunding.value = false
  }
}

// ── Receipt helpers ────────────────────────────────────────────────────────
function receiptSubtotal(p: Payment): number {
  return p.items.reduce((s, i) => s + i.quantity * i.price, 0)
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
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

    <!-- Error banner -->
    <div
      v-if="store.error"
      class="rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm px-4 py-3"
    >
      {{ store.error }}
    </div>

    <!-- Loading -->
    <div v-if="store.loading && store.payments.length === 0" class="flex justify-center py-20">
      <Loader2 class="w-8 h-8 animate-spin text-muted-foreground" />
    </div>

    <template v-else>
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
              <Select :model-value="methodFilter" @update:model-value="setMethodFilter($event)">
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
                    <tr v-if="filteredPayments.length === 0" class="text-center">
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
                      <td class="px-4 py-3 font-mono text-xs">{{ formatTime(payment.processedAt) }}</td>
                      <td class="px-4 py-3 font-medium">{{ payment.tableName }}</td>
                      <td class="px-4 py-3 text-right font-semibold">${{ payment.amount.toFixed(2) }}</td>
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
        <div v-if="selectedPayment" class="w-72 shrink-0 sticky top-6">
          <Card class="border-2 border-primary/20">
            <CardHeader class="pb-2">
              <div class="flex items-center justify-between">
                <CardTitle class="text-base flex items-center gap-1.5">
                  <Receipt class="w-4 h-4 text-primary" />
                  Receipt
                </CardTitle>
                <Button variant="ghost" size="icon" class="h-7 w-7" @click="selectedPayment = null">
                  <X class="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent class="pt-0">
              <!-- Receipt header -->
              <div class="text-center py-3 border-y border-dashed border-border mb-3">
                <p class="font-bold text-lg">The Restaurant</p>
                <p class="text-xs text-muted-foreground">123 Main Street</p>
                <p class="text-xs text-muted-foreground mt-2">
                  {{ selectedPayment.tableName }} &bull; {{ formatTime(selectedPayment.processedAt) }}
                </p>
                <p class="text-xs text-muted-foreground">Server: {{ selectedPayment.serverName }}</p>
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
                    <span class="font-medium">{{ item.quantity }}x</span>
                    <span class="ml-1.5">{{ item.name }}</span>
                  </div>
                  <span class="shrink-0 font-medium">${{ (item.quantity * item.price).toFixed(2) }}</span>
                </div>
              </div>

              <Separator class="my-2" />

              <!-- Totals -->
              <div class="space-y-1.5 text-sm">
                <div class="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${{ receiptSubtotal(selectedPayment).toFixed(2) }}</span>
                </div>
                <div v-if="selectedPayment.discount > 0" class="flex justify-between text-muted-foreground">
                  <span>Discount</span>
                  <span>-${{ selectedPayment.discount.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between text-muted-foreground">
                  <span>Tax (8%)</span>
                  <span>${{ selectedPayment.tax.toFixed(2) }}</span>
                </div>
                <div v-if="selectedPayment.tip > 0" class="flex justify-between text-muted-foreground">
                  <span>Tip</span>
                  <span>${{ selectedPayment.tip.toFixed(2) }}</span>
                </div>
              </div>

              <Separator class="my-2" />

              <div class="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>${{ selectedPayment.amount.toFixed(2) }}</span>
              </div>

              <!-- Method + status -->
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
    </template>

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
            <span class="font-bold">${{ refundPayment?.amount.toFixed(2) }}</span>
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
            :disabled="refunding"
            @click="confirmRefund"
          >
            <Loader2 v-if="refunding" class="w-4 h-4 animate-spin" />
            <RotateCcw v-else class="w-4 h-4" />
            Process Refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
