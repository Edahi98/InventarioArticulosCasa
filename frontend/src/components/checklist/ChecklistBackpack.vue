<script setup lang="ts">
import { computed } from "vue";
import type { ChecklistStatus, ChecklistSummary } from "../../core/domain/checklist.js";
import { STATUS_LABELS } from "../../constantes/checklist_constantes.js";

const props = defineProps<{ summary: ChecklistSummary; statuses: ChecklistStatus[]; title: string; compact?: boolean }>();

const pending = computed(() => props.summary.revisar + props.summary.falta);
const ratio = computed(() => (props.summary.total === 0 ? 0 : props.summary.tengo / props.summary.total));
const headline = computed(() => {
  if (props.summary.complete) return props.title ? `¡Tienes todo para ${props.title}!` : "¡Tienes todo!";
  if (props.summary.tengo === 0) return "La mochila va vacía";
  return pending.value === 1 ? "Solo falta una cosa" : `Faltan ${pending.value} cosas`;
});
const subline = computed(() =>
  props.summary.complete ? "Los guardianes ya cerraron el cierre." : "Toca un objeto para abrir su etiqueta.",
);
</script>

<template>
  <div class="pack" :class="{ 'is-full': summary.complete }">
    <svg v-if="!compact" class="pack-art" viewBox="0 0 240 250" role="img" :aria-label="`Mochila con ${summary.tengo} de ${summary.total} cosas`">
      <defs>
        <clipPath id="pack-body"><rect x="40" y="46" width="160" height="186" rx="54" /></clipPath>
      </defs>
      <ellipse cx="120" cy="238" rx="84" ry="9" class="pack-shadow" />

      <g class="pack-bob">
        <circle cx="64" cy="48" r="22" class="pack-ear" />
        <circle cx="176" cy="48" r="22" class="pack-ear" />
        <circle cx="64" cy="48" r="10" class="pack-ear-in" />
        <circle cx="176" cy="48" r="10" class="pack-ear-in" />
        <path d="M88 52 C88 12 152 12 152 52" class="pack-handle" />

        <rect x="40" y="46" width="160" height="186" rx="54" class="pack-body" />
        <g clip-path="url(#pack-body)">
          <rect x="40" y="46" width="160" height="186" class="pack-fill" :style="{ transform: `scaleY(${ratio})` }" />
        </g>
        <rect x="40" y="46" width="160" height="186" rx="54" class="pack-outline" />

        <path d="M40 104 Q120 132 200 104 L200 92 Q200 46 120 46 Q40 46 40 92 Z" class="pack-flap" />
        <circle cx="120" cy="116" r="9" class="pack-buckle" />

        <rect x="66" y="158" width="108" height="62" rx="24" class="pack-pocket" />
        <path d="M82 170 H158" class="pack-zip" />
        <text x="120" y="204" text-anchor="middle" class="pack-count">{{ summary.tengo }}/{{ summary.total }}</text>
      </g>

      <g class="pack-sparks">
        <path d="M24 70 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 z" class="pack-star" />
        <path d="M212 40 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" class="pack-star" />
      </g>
    </svg>

    <p class="pack-title">{{ headline }}</p>
    <p class="text-center text-sm font-semibold text-[var(--l-muted)]">{{ subline }}</p>

    <div class="mt-3 flex flex-wrap justify-center gap-1.5" role="img" :aria-label="`${summary.tengo} de ${summary.total} cosas listas`">
      <span v-for="(status, index) in statuses" :key="index" class="bead" :class="`bead-${status}`" :title="STATUS_LABELS[status]" :style="{ animationDelay: `${index * 45}ms` }" />
    </div>
  </div>
</template>

<style scoped>
.pack {
  padding: 1rem 1rem 1.25rem;
  border-radius: 32px;
  border: 4px solid var(--l-ink);
  background: var(--l-surface);
  box-shadow: 0 8px 0 var(--l-toy-edge), 0 24px 40px -20px rgb(0 0 0 / 0.35);
}
.pack-art {
  display: block;
  width: min(100%, 15rem);
  margin: 0 auto;
}
.pack-title {
  margin-top: 0.25rem;
  text-align: center;
  font-family: var(--l-display);
  font-size: 1.6rem;
  line-height: 1.1;
}
.pack-shadow { fill: rgb(0 0 0 / 0.16); }
.pack-body { fill: var(--l-surface-2); }
.pack-fill {
  fill: #bfe9d5;
  transform-box: fill-box;
  transform-origin: 50% 100%;
  transition: transform 0.9s cubic-bezier(0.34, 1.2, 0.64, 1);
}
.pack-outline { fill: none; stroke: var(--l-ink); stroke-width: 5; }
.pack-ear { fill: #ff8fb7; stroke: var(--l-ink); stroke-width: 5; }
.pack-ear-in { fill: #ffd0e0; }
.pack-handle { fill: none; stroke: var(--l-ink); stroke-width: 7; stroke-linecap: round; }
.pack-flap { fill: #ff8fb7; stroke: var(--l-ink); stroke-width: 5; stroke-linejoin: round; }
.pack-buckle { fill: #ffe35c; stroke: var(--l-ink); stroke-width: 4; }
.pack-pocket { fill: #ffd0e0; stroke: var(--l-ink); stroke-width: 5; }
.pack-zip { stroke: var(--l-ink); stroke-width: 4; stroke-dasharray: 3 7; stroke-linecap: round; opacity: 0.6; }
.pack-count { fill: #2a1730; font-family: var(--l-display); font-size: 22px; }
.pack-star { fill: #ffe35c; stroke: #c9a416; stroke-width: 2; stroke-linejoin: round; opacity: 0; transition: opacity 0.4s; }
.is-full .pack-star { opacity: 1; animation: pack-twinkle 1.6s ease-in-out infinite; }
.is-full .pack-bob { animation: pack-hop 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) 2; transform-origin: 120px 232px; }

.bead {
  width: 1.05rem;
  height: 1.05rem;
  border-radius: 999px;
  border: 3px solid var(--l-ink);
  animation: bead-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.bead-tengo { background: #bfe9d5; }
.bead-revisar { background: #ffe98a; }
.bead-falta { background: transparent; border-style: dashed; border-color: color-mix(in srgb, var(--l-ink) 50%, transparent); }

@keyframes bead-pop { from { transform: scale(0); } }
@keyframes pack-hop { 40% { transform: translateY(-14px) scale(1.03, 0.97); } }
@keyframes pack-twinkle { 50% { opacity: 0.4; } }
@media (prefers-reduced-motion: reduce) {
  .pack-fill { transition: none; }
  .bead, .is-full .pack-star, .is-full .pack-bob { animation: none; }
}
</style>
