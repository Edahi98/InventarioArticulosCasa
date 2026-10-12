<script setup lang="ts">
defineProps<{ label: string; forId: string; hint?: string }>();
</script>

<template>
  <div class="flex flex-col gap-2">
    <label class="ui-label" :for="forId">{{ label }}</label>
    <slot />
    <p v-if="hint" class="text-sm text-[var(--l-muted)]">{{ hint }}</p>
  </div>
</template>
