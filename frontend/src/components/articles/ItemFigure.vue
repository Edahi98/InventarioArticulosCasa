<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ name: string }>();

const PALETTES = [
  { main: "#ff8fb7", dark: "#c4235f", light: "#ffd0e0" },
  { main: "#7fd0ea", dark: "#2f8fb0", light: "#c4ecf8" },
  { main: "#ffe35c", dark: "#c9a416", light: "#fff3ac" },
  { main: "#b89cf2", dark: "#7a58c9", light: "#dccffa" },
  { main: "#86d6a8", dark: "#3d9b68", light: "#c5ecd6" },
  { main: "#ffb066", dark: "#c47320", light: "#ffd9b0" },
] as const;
const SHAPES = ["chest", "gift", "jar", "lamp", "book", "bag"] as const;

const seed = computed(() => [...props.name].reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 7));
const palette = computed(() => PALETTES[seed.value % PALETTES.length] as (typeof PALETTES)[number]);
const shape = computed(() => SHAPES[(Math.imul(seed.value, 2654435761) >>> 16) % SHAPES.length] as (typeof SHAPES)[number]);
</script>

<template>
  <svg
    class="item-figure"
    viewBox="0 0 200 160"
    role="img"
    :aria-label="`Figura de juguete para ${name}`"
    :style="{ '--fm': palette.main, '--fd': palette.dark, '--fl': palette.light }"
  >
    <ellipse cx="100" cy="142" rx="62" ry="9" class="shadow" />

    <g v-if="shape === 'chest'" class="bob">
      <rect x="40" y="70" width="120" height="66" rx="14" class="body" />
      <path d="M40 84 Q40 40 100 40 Q160 40 160 84 Z" class="lid" />
      <rect x="86" y="74" width="28" height="26" rx="8" class="trim" />
      <circle cx="100" cy="86" r="5" class="dot" />
    </g>

    <g v-else-if="shape === 'gift'" class="bob">
      <rect x="46" y="68" width="108" height="68" rx="12" class="body" />
      <rect x="40" y="52" width="120" height="30" rx="12" class="lid" />
      <rect x="90" y="52" width="20" height="84" class="trim" />
      <path d="M100 52 C70 20 52 40 78 52 Z M100 52 C130 20 148 40 122 52 Z" class="lid" />
    </g>

    <g v-else-if="shape === 'jar'" class="bob">
      <rect x="62" y="52" width="76" height="86" rx="22" class="body" />
      <rect x="70" y="34" width="60" height="24" rx="10" class="lid" />
      <rect x="74" y="78" width="52" height="30" rx="10" class="trim" />
      <circle cx="100" cy="93" r="6" class="dot" />
    </g>

    <g v-else-if="shape === 'lamp'" class="bob">
      <path d="M64 86 L82 36 H118 L136 86 Z" class="lid" />
      <rect x="94" y="86" width="12" height="38" rx="5" class="trim" />
      <ellipse cx="100" cy="130" rx="32" ry="10" class="body" />
      <circle cx="100" cy="62" r="9" class="dot" />
    </g>

    <g v-else-if="shape === 'book'" class="bob">
      <rect x="48" y="44" width="104" height="92" rx="12" class="body" />
      <rect x="48" y="44" width="18" height="92" rx="8" class="lid" />
      <rect x="82" y="64" width="54" height="10" rx="5" class="trim" />
      <rect x="82" y="84" width="38" height="10" rx="5" class="trim" />
    </g>

    <g v-else class="bob">
      <path d="M58 66 Q100 48 142 66 L150 132 Q100 146 50 132 Z" class="body" />
      <path d="M76 66 Q78 28 100 28 Q122 28 124 66" class="handle" />
      <rect x="82" y="92" width="36" height="22" rx="8" class="trim" />
    </g>

    <g class="spark">
      <path d="M26 36 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 z" class="star" />
      <path d="M168 24 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" class="star" />
    </g>
  </svg>
</template>

<style scoped>
.item-figure {
  width: 100%;
  height: 100%;
}
.shadow { fill: rgb(0 0 0 / 0.14); }
.body { fill: var(--fm); stroke: var(--fd); stroke-width: 5; }
.lid { fill: var(--fl); stroke: var(--fd); stroke-width: 5; stroke-linejoin: round; }
.trim { fill: #fffaf2; stroke: var(--fd); stroke-width: 4; }
.dot { fill: var(--fd); }
.handle { fill: none; stroke: var(--fd); stroke-width: 6; stroke-linecap: round; }
.star { fill: #ffe35c; stroke: #c9a416; stroke-width: 2; stroke-linejoin: round; }
.bob { animation: figure-bob 3.6s ease-in-out infinite; transform-origin: 100px 136px; }
.spark { animation: figure-twinkle 2.4s ease-in-out infinite; transform-origin: 100px 80px; }
@keyframes figure-bob {
  50% { transform: translateY(-5px) scale(1.02, 0.98); }
}
@keyframes figure-twinkle {
  50% { opacity: 0.45; }
}
@media (prefers-reduced-motion: reduce) {
  .bob, .spark { animation: none; }
}
</style>
