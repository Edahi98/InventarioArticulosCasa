<script setup lang="ts">
defineProps<{ title: string }>();
defineEmits<{ close: [] }>();
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-end justify-center bg-[rgb(21_15_24/0.55)] px-4 pb-4 sm:items-center sm:pb-0"
    role="dialog"
    aria-modal="true"
    :aria-label="title"
    @click.self="$emit('close')"
    @keydown.esc="$emit('close')"
  >
    <div class="ui-stitch w-full max-w-md rounded-[var(--l-radius)] bg-[var(--l-surface)] p-8 text-[var(--l-ink)]">
      <h2 class="mb-4 text-2xl font-semibold tracking-tight">{{ title }}</h2>
      <slot />
      <div v-if="$slots.actions" class="mt-7 flex flex-wrap justify-end gap-2">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
