<script setup lang="ts">
defineProps<{ label: string; forId: string; hint?: string; error?: string }>();
</script>

<template>
  <div class="flex flex-col gap-2">
    <label class="ui-label" :for="forId">{{ label }}</label>
    <slot />
    <p v-if="error" role="alert" class="ui-error">{{ error }}</p>
    <p v-if="hint && !error" class="text-sm text-[var(--l-muted)]">{{ hint }}</p>
  </div>
</template>
