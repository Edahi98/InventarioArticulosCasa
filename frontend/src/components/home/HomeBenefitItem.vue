<script setup lang="ts">
defineProps<{ text: string }>();
</script>

<template>
  <li class="flex items-center gap-3">
    <span class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-slate-900 bg-lime-300">
      <font-awesome-icon icon="check" class="text-xs text-slate-900" />
    </span>
    <span class="font-medium text-slate-800">{{ text }}</span>
  </li>
</template>
