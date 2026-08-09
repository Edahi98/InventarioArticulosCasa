<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ stock: number }>();

const label = computed(() => {
  if (props.stock === 1) {
    return "Artículo único";
  }
  if (props.stock <= 0) {
    return "Agotado";
  }
  return `${props.stock} unidades`;
});

const badgeClass = computed(() => {
  if (props.stock === 1) {
    return "border-2 border-black bg-purple-200 text-purple-900";
  }
  if (props.stock <= 0) {
    return "border-2 border-black bg-rose-200 text-rose-900";
  }
  return "border-2 border-black bg-amber-200 text-amber-900";
});
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
    :class="badgeClass"
  >
    {{ label }}
  </span>
</template>
