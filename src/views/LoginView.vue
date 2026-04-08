<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import Button from '@/components/ui/button.vue'
import Card from '@/components/ui/card.vue'
import CardContent from '@/components/ui/card-content.vue'
import CardHeader from '@/components/ui/card-header.vue'
import CardTitle from '@/components/ui/card-title.vue'
import CardDescription from '@/components/ui/card-description.vue'
import Input from '@/components/ui/input.vue'
import Label from '@/components/ui/label.vue'
import { UtensilsCrossed, Loader2, Mail, Lock, AlertCircle } from 'lucide-vue-next'

const authStore = useAuthStore()

const email = ref('')
const password = ref('')

const canSubmit = computed(() => email.value.trim() !== '' && password.value !== '')

async function handleLogin() {
  if (!canSubmit.value || authStore.loading) return
  authStore.clearError()
  try {
    await authStore.login(email.value.trim(), password.value)
  } catch {
    // Error is set on the store
  }
}

interface DemoAccount {
  label: string
  email: string
  password: string
  variant: 'default' | 'outline' | 'secondary'
}

const demoAccounts: DemoAccount[] = [
  { label: 'Admin', email: 'admin@pos.com', password: 'admin', variant: 'default' },
  { label: 'Waiter', email: 'waiter@pos.com', password: 'waiter', variant: 'outline' },
  { label: 'Kitchen', email: 'kitchen@pos.com', password: 'kitchen', variant: 'outline' },
  { label: 'Cashier', email: 'cashier@pos.com', password: 'cashier', variant: 'outline' },
]

async function loginAs(account: DemoAccount) {
  if (authStore.loading) return
  authStore.clearError()
  email.value = account.email
  password.value = account.password
  try {
    await authStore.login(account.email, account.password)
  } catch {
    // Error is set on the store
  }
}
</script>

<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4"
  >
    <!-- Background decorations -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
    </div>

    <div class="relative w-full max-w-md space-y-6">
      <!-- Brand header -->
      <div class="text-center space-y-3">
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg shadow-primary/30"
        >
          <UtensilsCrossed class="w-8 h-8 text-primary-foreground" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-white">Bake & Brew Coffee Shop & Bakery</h1>
          <p class="text-slate-400 mt-1">Restaurant Point of Sale</p>
        </div>
      </div>

      <!-- Login Card -->
      <Card class="border-slate-700 bg-slate-800/80 backdrop-blur-sm shadow-2xl">
        <CardHeader class="pb-4">
          <CardTitle class="text-white text-xl">Sign In</CardTitle>
          <CardDescription class="text-slate-400">
            Enter your credentials to access the system
          </CardDescription>
        </CardHeader>

        <CardContent class="space-y-5">
          <!-- Error alert -->
          <Transition name="slide-down">
            <div
              v-if="authStore.error"
              class="flex items-center gap-3 px-4 py-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive"
            >
              <AlertCircle class="w-4 h-4 shrink-0" />
              <span class="text-sm">{{ authStore.error }}</span>
            </div>
          </Transition>

          <!-- Login form -->
          <form class="space-y-4" @submit.prevent="handleLogin">
            <!-- Email -->
            <div class="space-y-1.5">
              <Label for="email" class="text-slate-300">Email address</Label>
              <div class="relative">
                <Mail
                  class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
                />
                <Input
                  id="email"
                  v-model="email"
                  type="email"
                  placeholder="you@restaurant.com"
                  autocomplete="email"
                  class="pl-9 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-primary"
                  :disabled="authStore.loading"
                />
              </div>
            </div>

            <!-- Password -->
            <div class="space-y-1.5">
              <Label for="password" class="text-slate-300">Password</Label>
              <div class="relative">
                <Lock
                  class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
                />
                <Input
                  id="password"
                  v-model="password"
                  type="password"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  class="pl-9 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-primary"
                  :disabled="authStore.loading"
                />
              </div>
            </div>

            <!-- Submit -->
            <Button
              type="submit"
              class="w-full h-11 text-base font-semibold"
              :disabled="!canSubmit || authStore.loading"
            >
              <Loader2 v-if="authStore.loading" class="w-4 h-4 animate-spin" />
              <span v-if="authStore.loading">Signing in...</span>
              <span v-else>Sign In</span>
            </Button>
          </form>

          <!-- Divider -->
          <div class="flex items-center gap-3">
            <div class="flex-1 h-px bg-slate-700" />
            <span class="text-xs text-slate-500 font-medium">QUICK DEMO ACCESS</span>
            <div class="flex-1 h-px bg-slate-700" />
          </div>

          <!-- Demo accounts -->
          <div class="grid grid-cols-2 gap-2">
            <Button
              v-for="account in demoAccounts"
              :key="account.email"
              :variant="account.variant"
              size="sm"
              class="h-9 text-xs font-medium border-slate-600 text-slate-300 hover:text-white hover:border-slate-400"
              :disabled="authStore.loading"
              @click="loginAs(account)"
            >
              <Loader2
                v-if="authStore.loading && email === account.email"
                class="w-3 h-3 animate-spin"
              />
              {{ 'Login as ' + account.label }}
            </Button>
          </div>
        </CardContent>
      </Card>

      <p class="text-center text-xs text-slate-500">
        Demo system &mdash; for illustration purposes only
      </p>
    </div>
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
