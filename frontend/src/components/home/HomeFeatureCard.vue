<script setup lang="ts">
defineProps<{
  icon: string;
  title: string;
  description: string;
  iconBg: string;
}>();
</script>

<template>
  <div class="cartoon-card flex flex-col items-center p-8 text-center transition-transform duration-300 hover:-translate-y-1">
    <div :class="['mb-5 flex h-16 w-16 items-center justify-center rounded-full border-4 border-slate-900', iconBg]">
      <font-awesome-icon :icon="icon" class="text-2xl text-slate-900" />
    </div>
    <h3 class="mb-2 text-lg font-extrabold text-slate-900">{{ title }}</h3>
    <p class="text-sm text-slate-600">{{ description }}</p>
  </div>
</template>
