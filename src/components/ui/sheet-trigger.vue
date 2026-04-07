<script setup lang="ts">
import { DialogTrigger } from 'radix-vue'

interface Props {
  asChild?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  asChild: true,
})

defineOptions({ inheritAttrs: false })
</script>

<template>
  <DialogTrigger v-bind="$attrs" :as-child="asChild">
    <slot />
  </DialogTrigger>
</template>
