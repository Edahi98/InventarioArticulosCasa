<script setup lang="ts">
import type { ChecklistEntry } from "../../core/domain/checklist.js";
import { SECTION_TITLES, STAMP_LABELS, TILTS } from "../../constantes/checklist_constantes.js";
import ChecklistThumb from "./ChecklistThumb.vue";

defineProps<{ entries: ChecklistEntry[]; selected: number | null }>();
const emit = defineEmits<{ select: [index: number] }>();
</script>

<template>
  <section class="line-zone" aria-label="Lo que hay que revisar">
    <header class="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
      <p class="ui-chip" :class="SECTION_TITLES.revisar.chip">{{ SECTION_TITLES.revisar.title }} · {{ entries.length }}</p>
      <p class="text-sm font-semibold text-[var(--l-muted)]">{{ SECTION_TITLES.revisar.hint }}</p>
    </header>

    <div class="rope" aria-hidden="true" />
    <div class="photos">
      <button
        v-for="(entry, position) in entries"
        :key="entry.index"
        type="button"
        class="photo"
        :class="{ 'is-selected': selected === entry.index }"
        :aria-pressed="selected === entry.index"
        :style="{ '--tilt': `${TILTS[position % TILTS.length]}deg`, '--d': `${position * -0.9}s` }"
        @click="emit('select', entry.index)"
      >
        <span class="pin" aria-hidden="true" />
        <span class="photo-frame"><ChecklistThumb :match="entry.match" /></span>
        <span class="photo-stamp">{{ entry.match && entry.match.stock <= 0 ? STAMP_LABELS.agotado : STAMP_LABELS.roto }}</span>
        <span class="photo-name">{{ entry.match?.name }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.line-zone {
  padding: 1.5rem 1.4rem 1.8rem;
  border-radius: 32px;
  border: 4px solid var(--l-ink);
  background: var(--l-surface);
  box-shadow: 0 8px 0 var(--l-toy-edge), 0 24px 40px -20px rgb(0 0 0 / 0.35);
}
.rope {
  height: 3px;
  margin: 1.4rem -0.4rem 0;
  border-radius: 3px;
  background: var(--l-ink);
  opacity: 0.8;
}
.photos {
  display: flex;
  flex-wrap: wrap;
  gap: 1.4rem 1.1rem;
  margin-top: -3px;
}
.photo {
  position: relative;
  width: 9.2rem;
  padding: 0.55rem 0.55rem 0.7rem;
  margin-top: 0.25rem;
  background: #fffaf2;
  color: var(--l-tag-ink);
  border-radius: 6px;
  text-align: center;
  box-shadow: 0 16px 24px -14px rgb(0 0 0 / 0.55), 0 5px 0 rgb(0 0 0 / 0.08);
  transform-origin: 50% -0.3rem;
  transform: rotate(var(--tilt));
  animation: photo-sway 5.5s ease-in-out infinite;
  animation-delay: var(--d);
}
.photo:hover,
.photo:focus-visible,
.photo.is-selected {
  animation: none;
  transform: rotate(0deg) scale(1.05);
}
.photo:focus-visible { outline: 3px solid var(--l-ink); outline-offset: 4px; }
.photo.is-selected { box-shadow: 0 0 0 4px var(--l-accent), 0 16px 24px -14px rgb(0 0 0 / 0.55); }
.pin {
  position: absolute;
  top: -0.8rem;
  left: 50%;
  width: 1.1rem;
  height: 1.9rem;
  border: 3px solid var(--l-ink);
  border-radius: 5px;
  background: linear-gradient(90deg, #e0b27a 48%, #c98f5a 52%);
  transform: translateX(-50%);
}
.photo-frame {
  display: block;
  aspect-ratio: 1;
  overflow: hidden;
  border: 3px solid #2a1730;
  border-radius: 4px;
  background: #f6e9ee;
}
.photo-stamp {
  position: absolute;
  right: -0.5rem;
  top: 5.4rem;
  padding: 0.1rem 0.6rem;
  border: 3px solid var(--l-ink);
  border-radius: 8px;
  background: #ffe98a;
  color: #2a1730;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  transform: rotate(-8deg);
}
.photo-name {
  display: block;
  margin-top: 0.5rem;
  font-family: var(--l-display);
  font-size: 0.95rem;
  line-height: 1.1;
}
@keyframes photo-sway {
  0%, 100% { transform: rotate(calc(var(--tilt) - 1.2deg)); }
  50% { transform: rotate(calc(var(--tilt) + 1.2deg)); }
}
@media (prefers-reduced-motion: reduce) {
  .photo { animation: none; }
}
</style>
