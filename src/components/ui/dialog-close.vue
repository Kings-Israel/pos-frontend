<script setup lang="ts">
import { cn } from '@/lib/utils'
import { DialogClose } from 'radix-vue'

interface Props {
  class?: string
  asChild?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  asChild: true,
})

defineOptions({ inheritAttrs: false })
</script>

<template>
  <DialogClose
    v-bind="$attrs"
    :as-child="asChild"
    :class="props.class"
  >
    <slot />
  </DialogClose>
</template>
