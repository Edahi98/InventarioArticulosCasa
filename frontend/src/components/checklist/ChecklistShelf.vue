<script setup lang="ts">
import type { ChecklistEntry } from "../../core/domain/checklist.js";
import { SECTION_TITLES } from "../../constantes/checklist_constantes.js";
import ChecklistThumb from "./ChecklistThumb.vue";

defineProps<{ entries: ChecklistEntry[]; selected: number | null }>();
const emit = defineEmits<{ select: [index: number] }>();
</script>

<template>
  <section class="shelf-zone" aria-label="Lo que ya tienes">
    <header class="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1">
      <p class="ui-chip" :class="SECTION_TITLES.tengo.chip">{{ SECTION_TITLES.tengo.title }} · {{ entries.length }}</p>
      <p class="text-sm font-semibold text-[var(--l-muted)]">{{ SECTION_TITLES.tengo.hint }}</p>
    </header>

    <div class="shelf">
      <button
        v-for="(entry, position) in entries"
        :key="entry.index"
        type="button"
        class="toy"
        :class="{ 'is-selected': selected === entry.index }"
        :aria-pressed="selected === entry.index"
        :style="{ '--d': `${position * 55}ms` }"
        @click="emit('select', entry.index)"
      >
        <span class="toy-figure"><ChecklistThumb :match="entry.match" /></span>
        <span class="toy-plank" aria-hidden="true" />
        <span class="toy-name">{{ entry.match?.name }}</span>
        <span class="toy-term">{{ entry.item.term }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.shelf-zone {
  padding: 1.5rem 1.4rem 1.6rem;
  border-radius: 32px;
  border: 4px solid var(--l-ink);
  background: var(--l-surface);
  box-shadow: 0 8px 0 var(--l-toy-edge), 0 24px 40px -20px rgb(0 0 0 / 0.35);
}
.shelf {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8.8rem, 1fr));
  gap: 1.6rem 1rem;
}
.toy {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: toy-drop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: var(--d);
}
.toy:focus-visible { outline: 3px solid var(--l-ink); outline-offset: 4px; border-radius: 18px; }
.toy-figure {
  position: relative;
  z-index: 1;
  width: 7rem;
  height: 6rem;
  margin-bottom: -1.05rem;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toy:hover .toy-figure,
.toy.is-selected .toy-figure { transform: translateY(-8px) rotate(-3deg) scale(1.06); }
.toy-plank {
  width: 100%;
  height: 1.15rem;
  border-radius: 999px;
  border: 3px solid var(--l-ink);
  background: linear-gradient(#d79e63, #b57a46);
  box-shadow: 0 4px 0 var(--l-toy-edge);
}
.toy.is-selected .toy-plank { background: linear-gradient(#ffd27a, #f0a93c); }
.toy-name {
  margin-top: 0.6rem;
  font-size: 0.95rem;
  font-weight: 900;
  line-height: 1.15;
}
.toy-term {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--l-muted);
}
@keyframes toy-drop { from { opacity: 0; transform: translateY(-18px) scale(0.9); } }
@media (prefers-reduced-motion: reduce) {
  .toy { animation: none; }
  .toy-figure { transition: none; }
}
</style>
