<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ stock: number }>();

const label = computed(() => {
  if (props.stock === 1) return "Artículo único";
  if (props.stock <= 0) return "Agotado";
  return `${props.stock} unidades`;
});

const tone = computed(() => {
  if (props.stock === 1) return "ui-chip-lilac";
  if (props.stock <= 0) return "ui-chip-rose";
  return "ui-chip-mint";
});
</script>

<template>
  <span class="ui-chip" :class="tone">{{ label }}</span>
</template>
