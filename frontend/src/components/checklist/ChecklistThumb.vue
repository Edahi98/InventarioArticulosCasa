<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { ArticleMatch } from "../../core/domain/checklist.js";
import ItemFigure from "../articles/ItemFigure.vue";

const props = defineProps<{ match: ArticleMatch | null }>();

const broken = ref(false);
const showPhoto = computed(() => Boolean(props.match?.imageUrl) && !broken.value);

watch(
  () => props.match?.imageUrl,
  () => {
    broken.value = false;
  },
);
</script>

<template>
  <img v-if="showPhoto && match" :src="match.imageUrl" :alt="match.name" class="h-full w-full object-cover" loading="lazy" @error="broken = true" />
  <ItemFigure v-else-if="match" :name="match.name" />
  <span v-else class="thumb-ghost" aria-hidden="true">?</span>
</template>

<style scoped>
.thumb-ghost {
  display: grid;
  height: 100%;
  place-items: center;
  font-family: var(--l-display);
  font-size: 2.6rem;
  color: color-mix(in srgb, var(--l-ink) 35%, transparent);
  animation: ghost-bob 2.8s ease-in-out infinite;
}
@keyframes ghost-bob {
  50% { transform: translateY(-5px) rotate(6deg); }
}
@media (prefers-reduced-motion: reduce) {
  .thumb-ghost { animation: none; }
}
</style>
