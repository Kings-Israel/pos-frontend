<script setup lang="ts">
import { cn } from '@/lib/utils'
import { DropdownMenuTrigger } from 'radix-vue'

interface Props {
  class?: string
  asChild?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  asChild: true,
})

defineOptions({ inheritAttrs: false })
</script>

<template>
  <DropdownMenuTrigger
    v-bind="$attrs"
    :as-child="asChild"
    :disabled="disabled"
    :class="props.class"
  >
    <slot />
  </DropdownMenuTrigger>
</template>
