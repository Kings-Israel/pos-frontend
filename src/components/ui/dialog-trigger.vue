<script setup lang="ts">
import { cn } from '@/lib/utils'
import { DialogTrigger } from 'radix-vue'

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
  <DialogTrigger
    v-bind="$attrs"
    :as-child="asChild"
    :class="props.class"
  >
    <slot />
  </DialogTrigger>
</template>
