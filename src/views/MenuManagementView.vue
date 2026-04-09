<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMenuStore } from '@/stores/menu'
import type { MenuItem, Category } from '@/stores/menu'
import Button from '@/components/ui/button.vue'
import Card from '@/components/ui/card.vue'
import CardHeader from '@/components/ui/card-header.vue'
import CardContent from '@/components/ui/card-content.vue'
import Badge from '@/components/ui/badge.vue'
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
import { cn } from '@/lib/utils'
import {
  Search,
  Plus,
  Pencil,
  Loader2,
  UtensilsCrossed,
  ToggleLeft,
  ToggleRight,
  Tag,
} from 'lucide-vue-next'

const menuStore = useMenuStore()

onMounted(() => menuStore.fetchMenu())

// ── Category state ────────────────────────────────────────────────────────
const selectedCategoryId = ref<string | 'all'>('all')
const searchQuery = ref('')

const filteredItems = computed(() => {
  let list =
    selectedCategoryId.value === 'all'
      ? menuStore.items
      : menuStore.items.filter((i) => i.category_id === selectedCategoryId.value)

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(
      (i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q),
    )
  }
  return list
})

function categoryForItem(item: MenuItem): Category | undefined {
  return menuStore.categories.find((c) => c.id === item.category_id)
}

// ── Edit dialog ────────────────────────────────────────────────────────────
const dialogOpen = ref(false)
const isAdding = ref(false)

interface EditForm {
  id: string
  name: string
  description: string
  price: string
  categoryId: string
  available: boolean
}

const emptyForm = (): EditForm => ({
  id: '',
  name: '',
  description: '',
  price: '',
  categoryId: menuStore.categories[0]?.id ?? '',
  available: true,
})

const editForm = ref<EditForm>(emptyForm())
const saving = ref(false)

function openEdit(item: MenuItem) {
  isAdding.value = false
  editForm.value = {
    id: item.id,
    name: item.name,
    description: item.description,
    price: String(item.price),
    categoryId: item.category_id,
    available: item.available,
  }
  dialogOpen.value = true
}

function openAdd() {
  isAdding.value = true
  editForm.value = emptyForm()
  editForm.value.categoryId =
    selectedCategoryId.value !== 'all'
      ? selectedCategoryId.value
      : (menuStore.categories[0]?.id ?? '')
  dialogOpen.value = true
}

async function saveDialog() {
  saving.value = true
  try {
    const price = parseFloat(editForm.value.price)
    if (isNaN(price)) return

    if (!isAdding.value) {
      await menuStore.updateItem(editForm.value.id, {
        name: editForm.value.name,
        description: editForm.value.description,
        price,
        available: editForm.value.available,
      })
    } else {
      await menuStore.storeItem({
        name: editForm.value.name,
        description: editForm.value.description,
        price,
        categoryId: editForm.value.categoryId,
        available: editForm.value.available,
      })
    }
    // For "add" in a real app you'd call a createItem action — here we just close
    dialogOpen.value = false
  } finally {
    saving.value = false
  }
}

// ── Add category dialog ────────────────────────────────────────────────────
const catDialogOpen = ref(false)
const newCatName = ref('')
const newCatColor = ref('#6366f1')
const newCatIcon = ref('🍴')

function openAddCategory() {
  newCatName.value = ''
  newCatColor.value = '#6366f1'
  newCatIcon.value = '🍴'
  catDialogOpen.value = true
}

function saveCategory() {
  if (!newCatName.value.trim()) return
  try {
    menuStore.createCategory({
      name: newCatName.value.trim(),
      color: newCatColor.value,
      icon: newCatIcon.value.trim() || '🍴',
    })
    catDialogOpen.value = false
  } catch (error) {
    console.error('Failed to create category:', error)
  }
}
</script>

<template>
  <div class="flex h-[calc(100vh-4rem)] bg-background overflow-hidden">
    <!-- ── Left: category sidebar ──────────────────────────────────────── -->
    <aside class="w-56 shrink-0 border-r border-border bg-muted/30 flex flex-col">
      <div class="p-4 border-b border-border">
        <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Categories
        </p>
        <Button size="sm" class="w-full gap-2" @click="openAddCategory">
          <Plus class="w-4 h-4" />
          Add Category
        </Button>
      </div>

      <nav class="flex-1 overflow-y-auto p-2 space-y-1">
        <!-- All -->
        <button
          :class="
            cn(
              'w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              selectedCategoryId === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground',
            )
          "
          @click="selectedCategoryId = 'all'"
        >
          <UtensilsCrossed class="w-4 h-4 shrink-0" />
          <span>All Items</span>
          <span class="ml-auto text-xs opacity-70">{{ menuStore.items.length }}</span>
        </button>

        <button
          v-for="cat in menuStore.categories"
          :key="cat.id"
          :class="
            cn(
              'w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              selectedCategoryId === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground',
            )
          "
          @click="selectedCategoryId = cat.id"
        >
          <span class="text-base leading-none">{{ cat.icon }}</span>
          <span class="truncate">{{ cat.name }}</span>
          <span class="ml-auto text-xs opacity-70">
            {{ menuStore.items.filter((i) => i.category_id === cat.id).length }}
          </span>
        </button>
      </nav>
    </aside>

    <!-- ── Right: items area ───────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Toolbar -->
      <div class="px-6 py-4 border-b border-border flex items-center gap-4">
        <div class="relative flex-1 max-w-sm">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input v-model="searchQuery" placeholder="Search items…" class="pl-9" />
        </div>

        <div class="ml-auto flex items-center gap-2">
          <Loader2 v-if="menuStore.loading" class="w-5 h-5 animate-spin text-muted-foreground" />
          <Button @click="openAdd">
            <Plus class="w-4 h-4" />
            Add Item
          </Button>
        </div>
      </div>

      <!-- Grid -->
      <div class="flex-1 overflow-y-auto p-6">
        <div
          v-if="!menuStore.loading && filteredItems.length === 0"
          class="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground"
        >
          <UtensilsCrossed class="w-12 h-12 opacity-30" />
          <p class="text-sm">No items found</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          <Card v-for="item in filteredItems" :key="item.id" class="flex flex-col overflow-hidden">
            <!-- Image placeholder -->
            <div
              class="h-32 bg-muted flex items-center justify-center shrink-0"
              :style="{ backgroundColor: categoryForItem(item)?.color + '20' }"
            >
              <span class="text-4xl">{{ categoryForItem(item)?.icon ?? '🍽️' }}</span>
            </div>

            <CardContent class="flex-1 p-4 flex flex-col gap-2">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-sm leading-tight truncate">{{ item.name }}</p>
                  <p class="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {{ item.description }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 mt-auto pt-2">
                <!-- Price -->
                <span class="font-bold text-base text-primary"
                  >KES {{ new Intl.NumberFormat().format(item.price) }}</span
                >

                <!-- Category pill -->
                <Badge variant="outline" class="text-xs flex items-center gap-1 ml-1">
                  <Tag class="w-3 h-3" />
                  {{ item.category_name ?? 'Unknown' }}
                </Badge>
              </div>

              <div class="flex items-center justify-between pt-1">
                <!-- Availability toggle -->
                <button
                  class="flex items-center gap-1.5 text-xs font-medium transition-colors"
                  :class="item.available ? 'text-green-600' : 'text-muted-foreground'"
                  @click="menuStore.toggleAvailability(item.id)"
                >
                  <component :is="item.available ? ToggleRight : ToggleLeft" class="w-5 h-5" />
                  {{ item.available ? 'Available' : 'Unavailable' }}
                </button>

                <!-- Edit button -->
                <Button variant="ghost" size="icon" class="h-8 w-8" @click="openEdit(item)">
                  <Pencil class="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <!-- ── Edit / Add Item Dialog ─────────────────────────────────────── -->
    <Dialog :open="dialogOpen" @update:open="dialogOpen = $event">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>{{ isAdding ? 'Add Item' : 'Edit Item' }}</DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="space-y-1.5">
            <Label>Name</Label>
            <Input v-model="editForm.name" placeholder="Item name" />
          </div>

          <div class="space-y-1.5">
            <Label>Description</Label>
            <Input v-model="editForm.description" placeholder="Short description" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label>Price (KES)</Label>
              <Input
                v-model="editForm.price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div class="space-y-1.5">
              <Label>Category</Label>

              <Select
                :model-value="editForm.categoryId"
                @update:model-value="editForm.categoryId = $event"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent class="pointer-events-auto">
                  <SelectItem v-for="cat in menuStore.categories" :key="cat.id" :value="cat.id">
                    {{ cat.icon }} {{ cat.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="flex items-center gap-3 pt-1">
            <button
              class="flex items-center gap-2 text-sm font-medium transition-colors"
              :class="editForm.available ? 'text-green-600' : 'text-muted-foreground'"
              @click="editForm.available = !editForm.available"
            >
              <component :is="editForm.available ? ToggleRight : ToggleLeft" class="w-6 h-6" />
              {{ editForm.available ? 'Available' : 'Unavailable' }}
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="dialogOpen = false">Cancel</Button>
          <Button :disabled="saving" @click="saveDialog">
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
            {{ isAdding ? 'Add Item' : 'Save Changes' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- ── Add Category Dialog ────────────────────────────────────────── -->
    <Dialog :open="catDialogOpen" @update:open="catDialogOpen = $event">
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="space-y-1.5">
            <Label>Name</Label>
            <Input v-model="newCatName" placeholder="e.g. Specials" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label>Icon (emoji)</Label>
              <Input v-model="newCatIcon" placeholder="🍴" maxlength="2" />
            </div>
            <div class="space-y-1.5">
              <Label>Color</Label>
              <input
                v-model="newCatColor"
                type="color"
                class="w-full h-9 rounded-md border border-input cursor-pointer"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="catDialogOpen = false">Cancel</Button>
          <Button @click="saveCategory">Add Category</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
