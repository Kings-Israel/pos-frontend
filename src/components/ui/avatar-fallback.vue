<script setup lang="ts">
import { cn } from '@/lib/utils'
import { AvatarFallback } from 'radix-vue'

interface Props {
  class?: string
  delayMs?: number
}

const props = defineProps<Props>()

defineOptions({ inheritAttrs: false })
</script>

<template>
  <AvatarFallback
    v-bind="$attrs"
    :delay-ms="delayMs"
    :class="cn('flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium uppercase text-muted-foreground', props.class)"
  >
    <slot />
  </AvatarFallback>
</template>
