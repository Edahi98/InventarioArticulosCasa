<script setup lang="ts">
import { computed } from "vue";
import type { ChecklistEntry } from "../../core/domain/checklist.js";
import { STATUS_ICONS, STATUS_LABELS } from "../../constantes/checklist_constantes.js";
import ChecklistThumb from "./ChecklistThumb.vue";

const props = defineProps<{ entry: ChecklistEntry }>();
const emit = defineEmits<{ choose: [index: number | null]; close: [] }>();

const others = computed(() => props.entry.item.matches.map((match, index) => ({ match, index })).filter(({ index }) => index !== props.entry.item.choice));
const note = computed(() => {
  const match = props.entry.match;
  if (!match) return props.entry.item.matches.length > 0 ? "Elige cuál de los guardados es." : "Nadie lo tiene guardado todavía.";
  if (match.stock <= 0) return "Se acabó, hay que reponerlo.";
  if (match.needsRepair) return "Está roto o necesita reparación.";
  return match.stock === 1 ? "Solo queda uno." : `Hay ${match.stock}.`;
});
</script>

<template>
  <article class="tag" :class="`is-${entry.status}`" aria-live="polite">
    <span class="tag-loop" aria-hidden="true" />
    <span class="tag-hole" aria-hidden="true" />
    <button type="button" class="tag-close" aria-label="Cerrar la etiqueta" @click="emit('close')">
      <font-awesome-icon icon="xmark" />
    </button>

    <div class="tag-figure"><ChecklistThumb :match="entry.match" /></div>

    <span class="tag-stamp" :class="`stamp-${entry.status}`">
      <font-awesome-icon :icon="STATUS_ICONS[entry.status]" /> {{ STATUS_LABELS[entry.status] }}
    </span>

    <p class="menu-label mt-4 text-center">Pedido: {{ entry.item.term }}</p>
    <h3 class="tag-name">{{ entry.match ? entry.match.name : "Sin guardar" }}</h3>
    <p class="text-center text-sm font-semibold text-[var(--l-muted)]">{{ note }}</p>

    <p v-if="entry.match" class="tag-where">
      <font-awesome-icon icon="location-dot" />
      <span class="truncate">{{ entry.match.location || entry.match.categoryName }}</span>
    </p>

    <div v-if="entry.match || others.length" class="mt-4 flex flex-wrap items-center justify-center gap-2">
      <span v-if="others.length" class="text-xs font-extrabold text-[var(--l-muted)]">¿Será otro?</span>
      <button v-for="other in others" :key="other.match.articleId" type="button" class="ui-chip ui-chip-lilac" :title="`Cambiar a ${other.match.name}`" @click="emit('choose', other.index)">
        {{ other.match.name }}
      </button>
      <button v-if="entry.match" type="button" class="ui-chip ui-chip-rose" @click="emit('choose', null)">No es ninguno</button>
    </div>
  </article>
</template>

<style scoped>
.tag {
  position: relative;
  margin-top: 1.6rem;
  padding: 3.4rem 1.2rem 1.4rem;
  border-radius: 3rem 3rem 1.4rem 1.4rem;
  border: 4px solid var(--l-ink);
  background: var(--l-surface);
  box-shadow: 0 8px 0 var(--l-toy-edge), 0 24px 40px -20px rgb(0 0 0 / 0.35);
  animation: tag-swing 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  transform-origin: 50% -1.6rem;
}
.tag-loop {
  position: absolute;
  top: -2.1rem;
  left: 50%;
  width: 3.4rem;
  height: 3.4rem;
  border: 5px solid #d9a066;
  border-radius: 999px;
  transform: translateX(-50%);
}
.tag-hole {
  position: absolute;
  top: 0.9rem;
  left: 50%;
  width: 1.3rem;
  height: 1.3rem;
  border: 4px solid var(--l-ink);
  border-radius: 999px;
  background: var(--l-bg);
  transform: translateX(-50%);
}
.tag-close {
  position: absolute;
  top: 0.8rem;
  right: 1rem;
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 3px solid var(--l-ink);
  background: var(--l-surface-2);
  font-size: 0.8rem;
}
.tag-close:focus-visible { outline: 3px solid var(--l-ink); outline-offset: 2px; }
.tag-figure {
  width: 9rem;
  height: 9rem;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 28px;
  border: 4px solid var(--l-ink);
  background:
    radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--l-accent) 22%, transparent), transparent 65%),
    var(--l-bg);
}
.is-falta .tag-figure { border-style: dashed; }
.tag-stamp {
  position: absolute;
  top: 8.2rem;
  right: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.8rem;
  border-radius: 999px;
  border: 3px solid var(--l-ink);
  color: #2a1730;
  font-size: 0.8rem;
  font-weight: 900;
  transform: rotate(6deg);
}
.stamp-tengo { background: #bfe9d5; }
.stamp-revisar { background: #ffe98a; }
.stamp-falta { background: #ffb3cb; }
.tag-name {
  margin-top: 0.2rem;
  text-align: center;
  font-family: var(--l-display);
  font-size: 1.6rem;
  line-height: 1.1;
}
.tag-where {
  display: flex;
  width: fit-content;
  max-width: 100%;
  align-items: center;
  gap: 0.45rem;
  margin: 0.6rem auto 0;
  padding: 0.2rem 0.8rem;
  border-radius: 999px;
  background: var(--l-bg);
  border: 3px solid var(--l-toy-edge);
  font-size: 0.8rem;
  font-weight: 800;
}
@keyframes tag-swing {
  from { transform: rotate(-9deg) translateY(-8px); opacity: 0; }
  60% { transform: rotate(3deg); }
}
@media (prefers-reduced-motion: reduce) {
  .tag { animation: none; }
}
</style>
