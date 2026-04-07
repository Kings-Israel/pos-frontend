<script setup lang="ts">
import { ref, computed } from 'vue'
import Card from '@/components/ui/card.vue'
import CardContent from '@/components/ui/card-content.vue'
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
import Avatar from '@/components/ui/avatar.vue'
import AvatarFallback from '@/components/ui/avatar-fallback.vue'
import Tabs from '@/components/ui/tabs.vue'
import TabsList from '@/components/ui/tabs-list.vue'
import TabsTrigger from '@/components/ui/tabs-trigger.vue'
import { cn } from '@/lib/utils'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  UserCircle2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-vue-next'

// ── Types ──────────────────────────────────────────────────────────────────
type UserRole = 'admin' | 'manager' | 'waiter' | 'kitchen' | 'cashier'
type UserStatus = 'active' | 'inactive'

interface AppUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  lastLogin: string
  initials: string
}

// ── Role helpers ───────────────────────────────────────────────────────────
const roleBadgeClass: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  manager: 'bg-blue-100 text-blue-700 border-blue-200',
  waiter: 'bg-green-100 text-green-700 border-green-200',
  kitchen: 'bg-orange-100 text-orange-700 border-orange-200',
  cashier: 'bg-teal-100 text-teal-700 border-teal-200',
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  waiter: 'Waiter',
  kitchen: 'Kitchen',
  cashier: 'Cashier',
}

// ── Mock users ─────────────────────────────────────────────────────────────
const users = ref<AppUser[]>([
  {
    id: 'usr-001',
    name: 'Alex Admin',
    email: 'alex@restaurant.com',
    role: 'admin',
    status: 'active',
    lastLogin: '2026-04-07 09:14',
    initials: 'AA',
  },
  {
    id: 'usr-002',
    name: 'Jane Waiter',
    email: 'jane@restaurant.com',
    role: 'waiter',
    status: 'active',
    lastLogin: '2026-04-07 10:02',
    initials: 'JW',
  },
  {
    id: 'usr-003',
    name: 'Mike Floor',
    email: 'mike@restaurant.com',
    role: 'manager',
    status: 'active',
    lastLogin: '2026-04-06 22:48',
    initials: 'MF',
  },
  {
    id: 'usr-004',
    name: 'Alice Cashier',
    email: 'alice@restaurant.com',
    role: 'cashier',
    status: 'active',
    lastLogin: '2026-04-07 08:55',
    initials: 'AC',
  },
  {
    id: 'usr-005',
    name: 'Carlos Kitchen',
    email: 'carlos@restaurant.com',
    role: 'kitchen',
    status: 'active',
    lastLogin: '2026-04-07 11:30',
    initials: 'CK',
  },
  {
    id: 'usr-006',
    name: 'Sofia Manager',
    email: 'sofia@restaurant.com',
    role: 'manager',
    status: 'inactive',
    lastLogin: '2026-03-28 14:10',
    initials: 'SM',
  },
  {
    id: 'usr-007',
    name: 'Tom Waiter',
    email: 'tom@restaurant.com',
    role: 'waiter',
    status: 'inactive',
    lastLogin: '2026-04-01 19:20',
    initials: 'TW',
  },
])

// ── Filters ────────────────────────────────────────────────────────────────
const roleFilter = ref<UserRole | 'all'>('all')
const searchQuery = ref('')

const filteredUsers = computed(() => {
  let list = users.value
  if (roleFilter.value !== 'all') {
    list = list.filter((u) => u.role === roleFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    )
  }
  return list
})

// ── Add / Edit dialog ─────────────────────────────────────────────────────
const dialogOpen = ref(false)
const isAdding = ref(false)

interface UserForm {
  id: string
  name: string
  email: string
  role: UserRole
  password: string
  status: UserStatus
}

const emptyForm = (): UserForm => ({
  id: '',
  name: '',
  email: '',
  role: 'waiter',
  password: '',
  status: 'active',
})

const form = ref<UserForm>(emptyForm())

function openAdd() {
  isAdding.value = true
  form.value = emptyForm()
  dialogOpen.value = true
}

function openEdit(user: AppUser) {
  isAdding.value = false
  form.value = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    password: '',
    status: user.status,
  }
  dialogOpen.value = true
}

function saveUser() {
  if (isAdding.value) {
    const initials = form.value.name
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('')

    users.value.push({
      id: `usr-${Date.now()}`,
      name: form.value.name,
      email: form.value.email,
      role: form.value.role,
      status: form.value.status,
      lastLogin: 'Never',
      initials,
    })
  } else {
    const idx = users.value.findIndex((u) => u.id === form.value.id)
    if (idx !== -1) {
      users.value[idx] = {
        ...users.value[idx]!,
        name: form.value.name,
        email: form.value.email,
        role: form.value.role,
        status: form.value.status,
      }
    }
  }
  dialogOpen.value = false
}

function deleteUser(id: string) {
  users.value = users.value.filter((u) => u.id !== id)
}

function toggleStatus(user: AppUser) {
  user.status = user.status === 'active' ? 'inactive' : 'active'
}

// ── Role tab counts ────────────────────────────────────────────────────────
const allRoles: Array<{ value: UserRole | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'waiter', label: 'Waiter' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'cashier', label: 'Cashier' },
]

function countForRole(role: UserRole | 'all'): number {
  if (role === 'all') return users.value.length
  return users.value.filter((u) => u.role === role).length
}
</script>

<template>
  <div class="p-6 bg-background min-h-screen flex flex-col gap-6">
    <!-- Page header -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <UserCircle2 class="w-7 h-7 text-primary" />
          User Management
        </h1>
        <p class="text-sm text-muted-foreground mt-0.5">{{ users.length }} total users</p>
      </div>
      <Button @click="openAdd">
        <Plus class="w-4 h-4" />
        Add User
      </Button>
    </div>

    <!-- Role filter tabs + search -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <Tabs
        :model-value="roleFilter"
        @update:model-value="roleFilter = $event as UserRole | 'all'"
        class="flex-1"
      >
        <TabsList class="flex-wrap h-auto gap-1">
          <TabsTrigger
            v-for="tab in allRoles"
            :key="tab.value"
            :value="tab.value"
            class="gap-1.5"
          >
            {{ tab.label }}
            <span class="text-xs opacity-60">({{ countForRole(tab.value) }})</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div class="relative w-full sm:w-64">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input v-model="searchQuery" placeholder="Search users…" class="pl-9" />
      </div>
    </div>

    <!-- Users table -->
    <Card>
      <CardContent class="p-0">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border bg-muted/40">
                <th class="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th class="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                <th class="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th class="text-left px-4 py-3 font-medium text-muted-foreground">Last Login</th>
                <th class="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr
                v-if="filteredUsers.length === 0"
                class="text-center"
              >
                <td colspan="5" class="py-12 text-muted-foreground">
                  No users found
                </td>
              </tr>

              <tr
                v-for="user in filteredUsers"
                :key="user.id"
                class="hover:bg-muted/20 transition-colors"
              >
                <!-- Avatar + name/email -->
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <Avatar class="w-9 h-9">
                      <AvatarFallback
                        :class="cn('text-xs font-semibold', roleBadgeClass[user.role])"
                      >
                        {{ user.initials }}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p class="font-medium leading-tight">{{ user.name }}</p>
                      <p class="text-xs text-muted-foreground">{{ user.email }}</p>
                    </div>
                  </div>
                </td>

                <!-- Role badge -->
                <td class="px-4 py-3">
                  <Badge
                    :class="cn('border font-medium text-xs', roleBadgeClass[user.role])"
                  >
                    <ShieldCheck class="w-3 h-3 mr-1" />
                    {{ roleLabels[user.role] }}
                  </Badge>
                </td>

                <!-- Status -->
                <td class="px-4 py-3">
                  <button
                    class="flex items-center gap-1.5 text-xs font-medium transition-colors"
                    :class="user.status === 'active' ? 'text-green-600' : 'text-muted-foreground'"
                    @click="toggleStatus(user)"
                  >
                    <CheckCircle2 v-if="user.status === 'active'" class="w-4 h-4" />
                    <XCircle v-else class="w-4 h-4" />
                    {{ user.status === 'active' ? 'Active' : 'Inactive' }}
                  </button>
                </td>

                <!-- Last login -->
                <td class="px-4 py-3 text-muted-foreground font-mono text-xs">
                  {{ user.lastLogin }}
                </td>

                <!-- Actions -->
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8"
                      @click="openEdit(user)"
                    >
                      <Pencil class="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8 text-destructive hover:text-destructive"
                      @click="deleteUser(user.id)"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <!-- ── Add / Edit User Dialog ──────────────────────────────────────── -->
    <Dialog :open="dialogOpen" @update:open="dialogOpen = $event">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>{{ isAdding ? 'Add User' : 'Edit User' }}</DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="space-y-1.5">
            <Label>Full Name</Label>
            <Input v-model="form.name" placeholder="e.g. Jane Smith" />
          </div>

          <div class="space-y-1.5">
            <Label>Email</Label>
            <Input v-model="form.email" type="email" placeholder="jane@restaurant.com" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label>Role</Label>
              <Select :model-value="form.role" @update:model-value="form.role = $event as UserRole">
                <SelectTrigger>
                  <SelectValue placeholder="Select role…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="waiter">Waiter</SelectItem>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-1.5">
              <Label>Status</Label>
              <Select :model-value="form.status" @update:model-value="form.status = $event as UserStatus">
                <SelectTrigger>
                  <SelectValue placeholder="Status…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div v-if="isAdding" class="space-y-1.5">
            <Label>Password</Label>
            <Input v-model="form.password" type="password" placeholder="Set initial password" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="dialogOpen = false">Cancel</Button>
          <Button @click="saveUser">
            {{ isAdding ? 'Add User' : 'Save Changes' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
