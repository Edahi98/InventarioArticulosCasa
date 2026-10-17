<script setup lang="ts">
import type { ChecklistEntry } from "../../core/domain/checklist.js";
import { POSTIT_TONES, SECTION_TITLES, TILTS } from "../../constantes/checklist_constantes.js";

defineProps<{ entries: ChecklistEntry[]; selected: number | null }>();
const emit = defineEmits<{ select: [index: number] }>();
</script>

<template>
  <section class="cork" aria-label="Lo que falta conseguir">
    <header class="cork-label">
      <p class="font-extrabold">{{ SECTION_TITLES.falta.title }} · {{ entries.length }}</p>
      <p class="text-sm font-semibold text-[var(--l-muted)]">{{ SECTION_TITLES.falta.hint }}</p>
    </header>

    <div class="notes">
      <button
        v-for="(entry, position) in entries"
        :key="entry.index"
        type="button"
        class="note"
        :class="{ 'is-selected': selected === entry.index }"
        :aria-pressed="selected === entry.index"
        :style="{ '--tone': POSTIT_TONES[position % POSTIT_TONES.length], '--tilt': `${TILTS[(position + 2) % TILTS.length]}deg`, '--d': `${position * 60}ms` }"
        @click="emit('select', entry.index)"
      >
        <span class="tack" aria-hidden="true" />
        <span class="note-term">{{ entry.item.term }}</span>
        <span class="note-hint">{{ entry.item.matches.length > 0 ? "¿Habrá algo parecido?" : "Anotado para conseguir" }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.cork {
  position: relative;
  padding: 1.4rem 1.2rem 1.8rem;
  border-radius: 28px;
  border: 12px solid #9a6a3f;
  outline: 4px solid var(--l-ink);
  background:
    radial-gradient(circle at 20% 30%, rgb(0 0 0 / 0.1) 0 2px, transparent 3px) 0 0 / 23px 23px,
    radial-gradient(circle at 70% 60%, rgb(255 255 255 / 0.14) 0 2px, transparent 3px) 0 0 / 31px 31px,
    color-mix(in srgb, #d9a066 78%, var(--l-surface-2));
  box-shadow: inset 0 6px 14px rgb(0 0 0 / 0.25), 0 8px 0 var(--l-toy-edge), 0 24px 40px -20px rgb(0 0 0 / 0.35);
}
.cork-label {
  display: inline-block;
  margin-bottom: 1.6rem;
  padding: 0.5rem 1rem;
  border-radius: 6px 6px 18px 6px;
  background: var(--l-surface);
  color: var(--l-ink);
  box-shadow: 0 8px 14px -8px rgb(0 0 0 / 0.5);
  transform: rotate(-1.5deg);
}
.notes {
  display: flex;
  flex-wrap: wrap;
  gap: 1.6rem 1.2rem;
}
.note {
  position: relative;
  display: flex;
  width: 9.6rem;
  min-height: 7.4rem;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 1.3rem 0.8rem 0.8rem;
  border-radius: 4px 4px 22px 4px;
  background: linear-gradient(160deg, color-mix(in srgb, var(--tone) 88%, white), var(--tone));
  color: #2a1730;
  text-align: left;
  box-shadow: 0 14px 18px -10px rgb(0 0 0 / 0.55), 0 4px 0 rgb(0 0 0 / 0.08);
  transform: rotate(var(--tilt));
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: note-slap 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: var(--d);
}
.note:hover,
.note:focus-visible,
.note.is-selected { transform: rotate(0deg) translateY(-4px) scale(1.05); }
.note:focus-visible { outline: 3px solid var(--l-ink); outline-offset: 4px; }
.note.is-selected { box-shadow: 0 0 0 4px var(--l-accent), 0 14px 18px -10px rgb(0 0 0 / 0.55); }
.tack {
  position: absolute;
  top: 0.35rem;
  left: 50%;
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 999px;
  border: 3px solid var(--l-ink);
  background: #ff4f8b;
  box-shadow: 0 3px 0 rgb(0 0 0 / 0.25);
  transform: translateX(-50%);
}
.note-term {
  font-family: var(--l-display);
  font-size: 1.05rem;
  line-height: 1.1;
  overflow-wrap: anywhere;
}
.note-hint {
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1.2;
  opacity: 0.7;
}
@keyframes note-slap { from { opacity: 0; transform: rotate(var(--tilt)) scale(1.5); } }
@media (prefers-reduced-motion: reduce) {
  .note { animation: none; transition: none; }
}
</style>
