<script setup lang="ts">
import { cn } from '@/lib/utils'
import { computed } from 'vue'

interface Props {
  class?: string
  value?: number
  max?: number
}

const props = withDefaults(defineProps<Props>(), {
  value: 0,
  max: 100,
})

defineOptions({ inheritAttrs: false })

const percentage = computed(() => {
  const val = Math.min(Math.max(props.value ?? 0, 0), props.max ?? 100)
  return (val / (props.max ?? 100)) * 100
})
</script>

<template>
  <div
    v-bind="$attrs"
    role="progressbar"
    :aria-valuemin="0"
    :aria-valuemax="max"
    :aria-valuenow="value"
    :class="cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', props.class)"
  >
    <div
      class="h-full w-full flex-1 bg-primary transition-all"
      :style="{ transform: `translateX(-${100 - percentage}%)` }"
    />
  </div>
</template>
