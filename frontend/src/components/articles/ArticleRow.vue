<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Article } from "../../core/domain/article.js";
import ItemFigure from "./ItemFigure.vue";

const props = defineProps<{
  article: Pick<Article, "name" | "description" | "imageUrl" | "stock" | "needsRepair"> & { location?: string | null };
}>();

const broken = ref(false);
const showPhoto = computed(() => Boolean(props.article.imageUrl) && !broken.value);
const stockLabel = computed(() => (props.article.stock <= 0 ? "Agotado" : props.article.stock === 1 ? "Único" : `x${props.article.stock}`));

watch(
  () => props.article.imageUrl,
  () => {
    broken.value = false;
  },
);
</script>

<template>
  <article class="slot-card" :class="{ 'is-empty': article.stock <= 0 }">
    <div class="slot-frame">
      <img
        v-if="showPhoto"
        :src="article.imageUrl"
        :alt="article.name"
        class="h-full w-full object-cover"
        loading="lazy"
        @error="broken = true"
      />
      <ItemFigure v-else :name="article.name" />
      <span class="slot-qty" :class="{ 'is-zero': article.stock <= 0 }">{{ stockLabel }}</span>
      <span v-if="article.needsRepair" class="slot-repair" title="Para reparar">
        <font-awesome-icon icon="wrench" />
        <span class="sr-only">Para reparar</span>
      </span>
    </div>
    <div class="slot-plate">
      <h3 class="text-lg font-extrabold leading-snug tracking-tight">{{ article.name }}</h3>
      <p class="line-clamp-2 text-sm font-semibold leading-relaxed text-[var(--l-muted)]">
        {{ article.description || "Sin descripción" }}
      </p>
      <p v-if="article.location" class="slot-where">
        <font-awesome-icon icon="location-dot" />
        <span class="truncate">{{ article.location }}</span>
      </p>
    </div>
  </article>
</template>

<style scoped>
.slot-card {
  display: flex;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  border-radius: 26px;
  border: 4px solid var(--l-ink);
  background: var(--l-surface);
  text-align: left;
  box-shadow: 0 6px 0 var(--l-toy-edge);
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s;
}
.slot-card:hover {
  transform: translateY(-4px) rotate(-0.6deg);
  box-shadow: 0 10px 0 var(--l-accent-edge);
}
.slot-card.is-empty { opacity: 0.75; }
.slot-frame {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-bottom: 4px solid var(--l-ink);
  background:
    radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--l-accent) 22%, transparent), transparent 65%),
    var(--l-bg);
}
.slot-qty {
  position: absolute;
  right: 0.6rem;
  top: 0.6rem;
  padding: 0.15rem 0.7rem;
  border-radius: 999px;
  border: 3px solid var(--l-ink);
  background: #bfe9d5;
  color: #2a1730;
  font-size: 0.85rem;
  font-weight: 900;
}
.slot-qty.is-zero { background: #ffb3cb; }
.slot-repair {
  position: absolute;
  left: 0.6rem;
  top: 0.6rem;
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 3px solid var(--l-ink);
  background: #ffe98a;
  color: #2a1730;
  font-size: 0.8rem;
}
.slot-plate {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 1.1rem 1.1rem;
}
.slot-where {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: 0.45rem;
  margin-top: auto;
  padding: 0.25rem 0.75rem;
  align-self: flex-start;
  border-radius: 999px;
  background: var(--l-bg);
  border: 3px solid var(--l-toy-edge);
  font-size: 0.8rem;
  font-weight: 800;
}
@media (prefers-reduced-motion: reduce) {
  .slot-card { transition: none; }
  .slot-card:hover { transform: none; }
}
</style>
