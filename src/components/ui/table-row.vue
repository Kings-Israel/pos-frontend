<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  class?: string
}

const props = defineProps<Props>()

defineOptions({ inheritAttrs: false })
</script>

<template>
  <tr
    v-bind="$attrs"
    :class="cn('border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', props.class)"
  >
    <slot />
  </tr>
</template>
