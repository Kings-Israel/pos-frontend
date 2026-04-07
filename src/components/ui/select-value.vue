<script setup lang="ts">
import { SelectValue } from 'radix-vue'

interface Props {
  placeholder?: string
}

const props = defineProps<Props>()
</script>

<template>
  <SelectValue :placeholder="placeholder">
    <slot />
  </SelectValue>
</template>
