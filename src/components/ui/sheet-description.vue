<script setup lang="ts">
import { cn } from '@/lib/utils'
import { DialogDescription } from 'radix-vue'

interface Props {
  class?: string
}

const props = defineProps<Props>()

defineOptions({ inheritAttrs: false })
</script>

<template>
  <DialogDescription
    v-bind="$attrs"
    :class="cn('text-sm text-muted-foreground', props.class)"
  >
    <slot />
  </DialogDescription>
</template>
