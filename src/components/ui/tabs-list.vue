<script setup lang="ts">
import { cn } from '@/lib/utils'
import { TabsList } from 'radix-vue'

interface Props {
  class?: string
}

const props = defineProps<Props>()

defineOptions({ inheritAttrs: false })
</script>

<template>
  <TabsList
    v-bind="$attrs"
    :class="cn('inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground', props.class)"
  >
    <slot />
  </TabsList>
</template>
