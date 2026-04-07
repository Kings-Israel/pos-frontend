<script setup lang="ts">
import { cn } from '@/lib/utils'
import { TabsContent } from 'radix-vue'

interface Props {
  class?: string
  value: string
}

const props = defineProps<Props>()

defineOptions({ inheritAttrs: false })
</script>

<template>
  <TabsContent
    v-bind="$attrs"
    :value="value"
    :class="cn('mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', props.class)"
  >
    <slot />
  </TabsContent>
</template>
