import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentMethod = 'cash' | 'card' | 'digital'
export type PaymentStatus = 'completed' | 'refunded' | 'pending'

export interface PaymentLineItem {
  name: string
  quantity: number
  price: number
}

export interface Payment {
  id: string
  orderId: string
  processedAt: string     // ISO date — format for display in the view
  tableName: string
  serverName: string
  items: PaymentLineItem[]
  amount: number          // total charged
  tip: number
  tax: number
  discount: number
  method: PaymentMethod
  status: PaymentStatus
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePaymentsStore = defineStore('payments', () => {
  const payments = ref<Payment[]>([])
  const loading  = ref(false)
  const error    = ref<string | null>(null)

  // ── Actions ───────────────────────────────────────────────────────────────

  async function fetchPayments(): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      const data      = await api.get<{ payments: Payment[] }>('/payments')
      payments.value  = data.payments
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load payments.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function refundPayment(id: string, amount: number, reason: string): Promise<void> {
    const data = await api.post<{ payment: Payment }>(`/payments/${id}/refund`, { amount, reason })
    const idx  = payments.value.findIndex((p) => p.id === id)
    if (idx !== -1) payments.value[idx] = data.payment
  }

  return {
    // State
    payments,
    loading,
    error,
    // Actions
    fetchPayments,
    refundPayment,
  }
})
