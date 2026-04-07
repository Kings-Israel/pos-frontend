<script setup lang="ts">
import { DropdownMenuRoot } from 'radix-vue'

interface Props {
  open?: boolean
  defaultOpen?: boolean
  modal?: boolean
  dir?: 'ltr' | 'rtl'
}

const props = withDefaults(defineProps<Props>(), {
  modal: true,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()
</script>

<template>
  <DropdownMenuRoot
    :open="open"
    :default-open="defaultOpen"
    :modal="modal"
    :dir="dir"
    @update:open="emit('update:open', $event)"
  >
    <slot />
  </DropdownMenuRoot>
</template>
