<script setup lang="ts">
import { SelectRoot } from 'radix-vue'

interface Props {
  modelValue?: string
  defaultValue?: string
  open?: boolean
  defaultOpen?: boolean
  disabled?: boolean
  name?: string
  required?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:open': [value: boolean]
}>()
</script>

<template>
  <SelectRoot
    :model-value="modelValue"
    :default-value="defaultValue"
    :open="open"
    :default-open="defaultOpen"
    :disabled="disabled"
    :name="name"
    :required="required"
    @update:model-value="emit('update:modelValue', $event)"
    @update:open="emit('update:open', $event)"
  >
    <slot />
  </SelectRoot>
</template>
