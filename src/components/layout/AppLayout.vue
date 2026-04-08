<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useInventoryStore } from '@/stores/inventory'
import Avatar from '@/components/ui/avatar.vue'
import AvatarFallback from '@/components/ui/avatar-fallback.vue'
import AvatarImage from '@/components/ui/avatar-image.vue'
import Badge from '@/components/ui/badge.vue'
import Button from '@/components/ui/button.vue'
import Separator from '@/components/ui/separator.vue'
import {
  LayoutDashboard,
  Table2,
  ShoppingCart,
  ChefHat,
  BookOpen,
  BarChart3,
  Package,
  Users,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
} from 'lucide-vue-next'

const authStore = useAuthStore()
const inventoryStore = useInventoryStore()
const route = useRoute()
const router = useRouter()

const sidebarExpanded = ref(true)

const stockAlertCount = computed(() => inventoryStore.alertCount)

const navItems = computed(() => {
  const base = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, badge: 0 },
    { name: 'Tables', path: '/tables', icon: Table2, badge: 0 },
    { name: 'Orders', path: '/orders', icon: ShoppingCart, badge: 0 },
    { name: 'Kitchen', path: '/kitchen', icon: ChefHat, badge: 0 },
    { name: 'Menu', path: '/menu', icon: BookOpen, badge: 0 },
    { name: 'Inventory', path: '/inventory', icon: Package, badge: stockAlertCount.value },
    { name: 'Reports', path: '/reports', icon: BarChart3, badge: 0 },
  ]
  const adminOnly = [{ name: 'Users', path: '/users', icon: Users, badge: 0 }]
  const role = authStore.user?.role
  if (role === 'admin' || role === 'manager') {
    return [...base, ...adminOnly]
  }
  return base
})

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/')
}

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})

const userInitials = computed(() => {
  const name = authStore.user?.name ?? ''
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const roleBadgeVariant = computed(() => {
  const role = authStore.user?.role
  if (role === 'admin') return 'destructive'
  if (role === 'manager') return 'default'
  return 'secondary'
})

async function handleLogout() {
  await authStore.logout()
}
</script>

<template>
  <div class="flex h-screen bg-background overflow-hidden">
    <!-- Sidebar -->
    <aside
      :class="[
        'flex flex-col fixed inset-y-0 left-0 z-40 bg-card border-r border-border transition-all duration-300',
        sidebarExpanded ? 'w-60' : 'w-16',
      ]"
    >
      <!-- Logo / Brand -->
      <div class="flex items-center h-16 px-3 border-b border-border shrink-0">
        <div class="flex items-center gap-3 overflow-hidden">
          <div
            class="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shrink-0"
          >
            <UtensilsCrossed class="w-4 h-4" />
          </div>
          <Transition name="fade-slide">
            <span v-if="sidebarExpanded" class="font-bold text-sm whitespace-nowrap">
              Bake & Brew Coffee Shop & Bakery
            </span>
          </Transition>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <ul class="space-y-1 px-2">
          <li v-for="item in navItems" :key="item.path">
            <button
              class="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-colors"
              :class="[
                isActive(item.path)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                !sidebarExpanded && 'justify-center',
              ]"
              :title="
                !sidebarExpanded
                  ? item.badge
                    ? `${item.name} (${item.badge} alerts)`
                    : item.name
                  : undefined
              "
              @click="router.push(item.path)"
            >
              <span class="relative shrink-0">
                <component :is="item.icon" class="w-4 h-4" />
                <span
                  v-if="item.badge && !sidebarExpanded"
                  class="absolute -top-1.5 -right-1.5 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold"
                  >{{ item.badge > 9 ? '9+' : item.badge }}</span
                >
              </span>
              <Transition name="fade-slide">
                <span
                  v-if="sidebarExpanded"
                  class="flex items-center gap-2 whitespace-nowrap truncate flex-1 min-w-0"
                >
                  <span class="truncate">{{ item.name }}</span>
                  <span
                    v-if="item.badge"
                    class="ml-auto shrink-0 flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-bold"
                    :class="
                      isActive(item.path)
                        ? 'bg-white/20 text-white'
                        : 'bg-destructive text-destructive-foreground'
                    "
                    >{{ item.badge > 99 ? '99+' : item.badge }}</span
                  >
                </span>
              </Transition>
            </button>
          </li>
        </ul>
      </nav>

      <Separator />

      <!-- User section -->
      <div class="p-3 space-y-2">
        <div
          class="flex items-center gap-3 overflow-hidden"
          :class="!sidebarExpanded && 'justify-center'"
        >
          <Avatar class="w-8 h-8 shrink-0">
            <AvatarImage :src="authStore.user?.avatar" :alt="authStore.user?.name" />
            <AvatarFallback class="text-xs">{{ userInitials }}</AvatarFallback>
          </Avatar>
          <Transition name="fade-slide">
            <div v-if="sidebarExpanded" class="min-w-0 flex-1">
              <p class="text-sm font-medium truncate leading-tight">
                {{ authStore.user?.name }}
              </p>
              <Badge :variant="roleBadgeVariant" class="mt-0.5 text-xs capitalize">
                {{ authStore.user?.role }}
              </Badge>
            </div>
          </Transition>
        </div>

        <button
          class="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          :class="!sidebarExpanded && 'justify-center'"
          :title="!sidebarExpanded ? 'Logout' : undefined"
          :disabled="authStore.loading"
          @click="handleLogout"
        >
          <LogOut class="w-4 h-4 shrink-0" />
          <Transition name="fade-slide">
            <span v-if="sidebarExpanded" class="whitespace-nowrap">Logout</span>
          </Transition>
        </button>
      </div>
    </aside>

    <!-- Main area -->
    <div
      class="flex flex-col flex-1 min-w-0 transition-all duration-300"
      :class="sidebarExpanded ? 'ml-60' : 'ml-16'"
    >
      <!-- Top Header -->
      <header
        class="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-card border-b border-border shrink-0"
      >
        <!-- Toggle button -->
        <button
          class="flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent transition-colors text-muted-foreground"
          @click="sidebarExpanded = !sidebarExpanded"
        >
          <ChevronLeft v-if="sidebarExpanded" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>

        <!-- Greeting (center) -->
        <p class="hidden md:block text-sm text-muted-foreground">
          {{ greeting }},
          <span class="font-semibold text-foreground">{{ authStore.user?.name }}</span>
        </p>

        <!-- Right side -->
        <div class="flex items-center gap-3">
          <!-- Notification bell -->
          <button
            class="relative flex items-center justify-center w-9 h-9 rounded-md hover:bg-accent transition-colors text-muted-foreground"
            :title="
              stockAlertCount
                ? `${stockAlertCount} stock alert${stockAlertCount > 1 ? 's' : ''}`
                : 'No alerts'
            "
            @click="router.push('/inventory')"
          >
            <Bell class="w-4 h-4" />
            <span
              v-if="stockAlertCount"
              class="absolute top-1 right-1 flex items-center justify-center min-w-[14px] h-3.5 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold leading-none"
              >{{ stockAlertCount > 9 ? '9+' : stockAlertCount }}</span
            >
          </button>

          <!-- User info -->
          <div class="flex items-center gap-2">
            <Avatar class="w-8 h-8">
              <AvatarImage :src="authStore.user?.avatar" :alt="authStore.user?.name" />
              <AvatarFallback class="text-xs">{{ userInitials }}</AvatarFallback>
            </Avatar>
            <div class="hidden sm:block">
              <p class="text-sm font-medium leading-tight">{{ authStore.user?.name }}</p>
              <Badge :variant="roleBadgeVariant" class="text-xs capitalize">
                {{ authStore.user?.role }}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-auto bg-muted/30">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}
</style>
