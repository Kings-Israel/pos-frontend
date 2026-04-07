<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  class?: string
}

const props = defineProps<Props>()

defineOptions({ inheritAttrs: false })
</script>

<template>
  <div
    v-bind="$attrs"
    :class="cn('rounded-xl border border-border bg-card text-card-foreground shadow', props.class)"
  >
    <slot />
  </div>
</template>
