<script setup lang="ts">
import { cn } from '@/lib/utils'
import { AvatarImage } from 'radix-vue'

interface Props {
  class?: string
  src?: string
  alt?: string
}

const props = defineProps<Props>()

defineOptions({ inheritAttrs: false })
</script>

<template>
  <AvatarImage
    v-bind="$attrs"
    :src="src ?? ''"
    :alt="alt"
    :class="cn('aspect-square h-full w-full object-cover', props.class)"
  />
</template>
