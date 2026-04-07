<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useKitchenStore } from '@/stores/kitchen'
import type { KitchenTicket, KitchenItemStatus } from '@/stores/kitchen'
import Badge from '@/components/ui/badge.vue'
import Button from '@/components/ui/button.vue'
import { cn } from '@/lib/utils'
import {
  Clock,
  AlertTriangle,
  ChefHat,
  CheckCircle2,
  Circle,
  Loader2,
} from 'lucide-vue-next'

const kitchenStore = useKitchenStore()

// ── Clock ──────────────────────────────────────────────────────────────────
const currentTime = ref('')

function updateClock() {
  currentTime.value = new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// ── Elapsed ────────────────────────────────────────────────────────────────
let clockInterval: ReturnType<typeof setInterval> | null = null
let elapsedInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  updateClock()
  clockInterval = setInterval(updateClock, 1000)
  elapsedInterval = setInterval(() => kitchenStore.tickElapsed(), 1000)
  await kitchenStore.fetchTickets()
})

onUnmounted(() => {
  if (clockInterval) clearInterval(clockInterval)
  if (elapsedInterval) clearInterval(elapsedInterval)
})

// ── Computed summary ───────────────────────────────────────────────────────
const totalTickets = computed(() => kitchenStore.tickets.length)

const pendingCount = computed(() =>
  kitchenStore.tickets.filter((t) => t.items.every((i) => i.status === 'pending')).length,
)

const preparingCount = computed(() =>
  kitchenStore.tickets.filter((t) =>
    t.items.some((i) => i.status === 'preparing') &&
    !t.items.every((i) => i.status === 'ready'),
  ).length,
)

const readyCount = computed(() =>
  kitchenStore.tickets.filter((t) => t.items.every((i) => i.status === 'ready')).length,
)

// ── Helpers ────────────────────────────────────────────────────────────────
function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function isOverdue(seconds: number): boolean {
  return seconds > 15 * 60
}

function ticketBorderClass(ticket: KitchenTicket): string {
  if (ticket.items.every((i) => i.status === 'ready')) return 'border-green-500'
  if (ticket.items.some((i) => i.status === 'preparing')) return 'border-blue-500'
  return 'border-yellow-500'
}

function ticketGlowClass(ticket: KitchenTicket): string {
  if (ticket.items.every((i) => i.status === 'ready')) return 'shadow-green-500/20'
  if (ticket.items.some((i) => i.status === 'preparing')) return 'shadow-blue-500/20'
  return 'shadow-yellow-500/20'
}

function itemStatusIcon(status: KitchenItemStatus) {
  if (status === 'ready') return CheckCircle2
  if (status === 'preparing') return Loader2
  return Circle
}

function itemStatusColor(status: KitchenItemStatus): string {
  if (status === 'ready') return 'text-green-400'
  if (status === 'preparing') return 'text-blue-400'
  return 'text-gray-500'
}

function allItemsReady(ticket: KitchenTicket): boolean {
  return ticket.items.every((i) => i.status === 'ready')
}

function cycleItemStatus(ticket: KitchenTicket, itemIdx: number) {
  const item = ticket.items[itemIdx]
  if (!item) return
  const current = item.status
  let next: KitchenItemStatus
  if (current === 'pending') next = 'preparing'
  else if (current === 'preparing') next = 'ready'
  else next = 'pending'
  kitchenStore.updateItemStatus(ticket.id, itemIdx, next)
}
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-white flex flex-col">
    <!-- Header -->
    <header class="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <ChefHat class="w-7 h-7 text-orange-400" />
        <span class="text-xl font-bold tracking-wide text-white">Kitchen Display System</span>
      </div>

      <div class="flex items-center gap-2 text-gray-300">
        <Clock class="w-5 h-5 text-orange-400" />
        <span class="text-2xl font-mono font-semibold tracking-widest">{{ currentTime }}</span>
      </div>
    </header>

    <!-- Summary bar -->
    <div class="bg-gray-900/60 border-b border-gray-800 px-6 py-2 flex items-center gap-6 text-sm">
      <div class="flex items-center gap-2">
        <span class="text-gray-400">Total</span>
        <span class="font-bold text-white text-lg">{{ totalTickets }}</span>
      </div>
      <div class="w-px h-5 bg-gray-700" />
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
        <span class="text-gray-400">Pending</span>
        <span class="font-bold text-yellow-400">{{ pendingCount }}</span>
      </div>
      <div class="w-px h-5 bg-gray-700" />
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />
        <span class="text-gray-400">Preparing</span>
        <span class="font-bold text-blue-400">{{ preparingCount }}</span>
      </div>
      <div class="w-px h-5 bg-gray-700" />
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
        <span class="text-gray-400">Ready</span>
        <span class="font-bold text-green-400">{{ readyCount }}</span>
      </div>

      <div class="ml-auto">
        <Button
          v-if="kitchenStore.loading"
          variant="ghost"
          size="sm"
          disabled
          class="text-gray-400"
        >
          <Loader2 class="w-4 h-4 animate-spin" />
          Loading…
        </Button>
      </div>
    </div>

    <!-- Tickets grid -->
    <main class="flex-1 p-5 overflow-auto">
      <div
        v-if="!kitchenStore.loading && kitchenStore.tickets.length === 0"
        class="flex flex-col items-center justify-center h-64 gap-3 text-gray-600"
      >
        <ChefHat class="w-16 h-16" />
        <p class="text-xl font-medium">No active kitchen tickets</p>
      </div>

      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <div
          v-for="ticket in kitchenStore.sortedTickets"
          :key="ticket.id"
          :class="cn(
            'rounded-xl border-2 bg-gray-900 flex flex-col shadow-lg transition-all duration-300',
            ticketBorderClass(ticket),
            ticketGlowClass(ticket),
          )"
        >
          <!-- Ticket header -->
          <div class="px-4 pt-4 pb-3 border-b border-gray-800 flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-lg font-bold text-white">
                  {{ ticket.tableNumber ? `Table ${ticket.tableNumber}` : 'Takeaway' }}
                </span>
                <!-- Priority badge -->
                <Badge
                  v-if="ticket.priority === 'high'"
                  class="bg-red-600 text-white border-0 animate-pulse text-xs px-1.5 py-0"
                >
                  <AlertTriangle class="w-3 h-3 mr-0.5" />
                  HIGH
                </Badge>
              </div>
              <p class="text-xs text-gray-500 mt-0.5">Order #{{ ticket.orderId }}</p>
            </div>

            <!-- Elapsed time -->
            <div
              :class="cn(
                'font-mono text-sm font-semibold px-2 py-1 rounded-md',
                isOverdue(ticket.elapsed)
                  ? 'bg-red-900/60 text-red-400 animate-pulse'
                  : 'bg-gray-800 text-gray-300',
              )"
            >
              {{ formatElapsed(ticket.elapsed) }}
            </div>
          </div>

          <!-- Items list -->
          <div class="flex-1 px-4 py-3 space-y-2">
            <button
              v-for="(item, idx) in ticket.items"
              :key="idx"
              class="w-full flex items-start gap-3 group cursor-pointer rounded-lg p-2 hover:bg-gray-800/70 transition-colors text-left"
              @click="cycleItemStatus(ticket, idx)"
            >
              <component
                :is="itemStatusIcon(item.status)"
                :class="cn('w-5 h-5 mt-0.5 shrink-0 transition-colors', itemStatusColor(item.status), item.status === 'preparing' && 'animate-spin')"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5">
                  <span
                    :class="cn(
                      'font-medium text-sm leading-tight',
                      item.status === 'ready' ? 'text-gray-500 line-through' : 'text-white',
                    )"
                  >
                    {{ item.quantity }}x {{ item.name }}
                  </span>
                </div>
                <div
                  v-if="item.modifiers.length"
                  class="flex flex-wrap gap-1 mt-1"
                >
                  <span
                    v-for="mod in item.modifiers"
                    :key="mod"
                    class="text-xs text-gray-400 bg-gray-800 rounded px-1.5 py-0.5"
                  >
                    {{ mod }}
                  </span>
                </div>
                <p
                  v-if="item.notes"
                  class="text-xs text-amber-400 mt-1 italic"
                >
                  {{ item.notes }}
                </p>
              </div>
            </button>
          </div>

          <!-- Footer / Mark all ready -->
          <div class="px-4 pb-4">
            <Button
              v-if="!allItemsReady(ticket)"
              size="sm"
              class="w-full bg-green-600 hover:bg-green-500 text-white border-0 mt-1"
              @click="kitchenStore.markTicketReady(ticket.id)"
            >
              <CheckCircle2 class="w-4 h-4" />
              Mark All Ready
            </Button>
            <div
              v-else
              class="flex items-center justify-center gap-1.5 text-green-400 text-sm font-semibold py-1"
            >
              <CheckCircle2 class="w-4 h-4" />
              All Ready
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
