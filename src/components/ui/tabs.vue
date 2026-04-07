<script setup lang="ts">
import { cn } from '@/lib/utils'
import { TabsRoot } from 'radix-vue'

interface Props {
  class?: string
  defaultValue?: string
  modelValue?: string
  orientation?: 'horizontal' | 'vertical'
  activationMode?: 'automatic' | 'manual'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

defineOptions({ inheritAttrs: false })
</script>

<template>
  <TabsRoot
    v-bind="$attrs"
    :default-value="defaultValue"
    :model-value="modelValue"
    :orientation="orientation"
    :activation-mode="activationMode"
    :class="cn('', props.class)"
    @update:model-value="emit('update:modelValue', $event as string)"
  >
    <slot />
  </TabsRoot>
</template>
