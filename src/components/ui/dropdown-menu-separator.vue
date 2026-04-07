<script setup lang="ts">
import { cn } from '@/lib/utils'
import { DropdownMenuSeparator } from 'radix-vue'

interface Props {
  class?: string
}

const props = defineProps<Props>()

defineOptions({ inheritAttrs: false })
</script>

<template>
  <DropdownMenuSeparator
    v-bind="$attrs"
    :class="cn('-mx-1 my-1 h-px bg-muted', props.class)"
  />
</template>
