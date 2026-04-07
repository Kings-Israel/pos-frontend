<script setup lang="ts">
import { cn } from '@/lib/utils'
import { DropdownMenuItem } from 'radix-vue'

interface Props {
  class?: string
  disabled?: boolean
  inset?: boolean
  asChild?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [event: Event]
}>()

defineOptions({ inheritAttrs: false })
</script>

<template>
  <DropdownMenuItem
    v-bind="$attrs"
    :disabled="disabled"
    :as-child="asChild"
    :class="cn(
      'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
      inset && 'pl-8',
      props.class
    )"
    @select="emit('select', $event)"
  >
    <slot />
  </DropdownMenuItem>
</template>
