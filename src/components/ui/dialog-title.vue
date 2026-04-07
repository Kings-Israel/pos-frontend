<script setup lang="ts">
import { cn } from '@/lib/utils'
import { DialogTitle } from 'radix-vue'

interface Props {
  class?: string
}

const props = defineProps<Props>()

defineOptions({ inheritAttrs: false })
</script>

<template>
  <DialogTitle
    v-bind="$attrs"
    :class="cn('text-lg font-semibold leading-none tracking-tight', props.class)"
  >
    <slot />
  </DialogTitle>
</template>
