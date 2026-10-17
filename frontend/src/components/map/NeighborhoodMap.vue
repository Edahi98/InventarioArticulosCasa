<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { Category } from "../../core/domain/category.js";
import type { NeighborhoodHover, NeighborhoodStage } from "../../infrastructure/three/neighborhood/NeighborhoodStage.js";

const props = defineProps<{ categories: Category[]; counts: Record<number, number> }>();
const emit = defineEmits<{ select: [id: number] }>();

const host = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const status = ref<"loading" | "ready" | "unsupported">("loading");
const hover = ref<NeighborhoodHover | null>(null);
const hour = ref(12);
const manualHour = ref(false);
const entering = ref(false);

let stage: NeighborhoodStage | null = null;
let resizeObserver: ResizeObserver | null = null;
let visibilityObserver: IntersectionObserver | null = null;

const clock = computed(() => {
  const moment = new Date();
  moment.setHours(Math.floor(hour.value), Math.round((hour.value % 1) * 60), 0, 0);
  return moment.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
});
const isNight = computed(() => hour.value < 6 || hour.value >= 19);
const totalItems = computed(() => Object.values(props.counts).reduce((sum, value) => sum + value, 0));

function countOf(id: number | undefined): number {
  return id === undefined ? 0 : (props.counts[id] ?? 0);
}

function describeCount(count: number): string {
  if (count === 0) return "Vacía y dormida: despierta con su primer artículo";
  return count === 1 ? "Guarda 1 artículo" : `Guarda ${count} artículos`;
}

function describe(id: number | undefined): string {
  return props.categories.find((category) => category.id === id)?.description ?? "";
}

function scrub(event: Event): void {
  manualHour.value = true;
  stage?.setHour(Number((event.target as HTMLInputElement).value));
}

function followClock(): void {
  manualHour.value = false;
  stage?.setHour(null);
}

function highlight(id: number | null): void {
  stage?.highlight(id);
}

defineExpose({ highlight });

onMounted(async () => {
  if (!host.value || !canvas.value || props.categories.length === 0) return;
  try {
    const { NeighborhoodStage } = await import("../../infrastructure/three/neighborhood/NeighborhoodStage.js");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    stage = new NeighborhoodStage(
      canvas.value,
      props.categories.map(({ id, name }) => ({ id, name, count: countOf(id) })),
      {
        onHover: (next) => {
          hover.value = next;
        },
        onEnter: () => {
          entering.value = true;
          hover.value = null;
        },
        onSelect: (id) => emit("select", id),
        onHour: (next) => {
          hour.value = next;
        },
      },
      { reducedMotion },
    );
  } catch {
    status.value = "unsupported";
    return;
  }
  resizeObserver = new ResizeObserver(([entry]) => {
    if (entry) stage?.resize(entry.contentRect.width, entry.contentRect.height);
  });
  resizeObserver.observe(host.value);
  visibilityObserver = new IntersectionObserver(([entry]) => stage?.setVisible(Boolean(entry?.isIntersecting)));
  visibilityObserver.observe(host.value);
  status.value = "ready";
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  visibilityObserver?.disconnect();
  stage?.dispose();
  stage = null;
});
</script>

<template>
  <div ref="host" class="fixed inset-0 z-0 overflow-hidden bg-gradient-to-b from-[#b9a4f2] via-[#ffb3cb] to-[#ffe3d6]">
    <canvas
      v-if="categories.length > 0 && status !== 'unsupported'"
      ref="canvas"
      role="img"
      aria-label="Mapa de tu casa: cada categoría es una casa de un color distinto en una isla. Arrastra para girar, usa la rueda para acercar y toca una casa para entrar."
      class="absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none"
      :class="status === 'ready' ? 'opacity-100' : 'opacity-0'"
    />

    <div class="pointer-events-none absolute inset-x-0 top-24 flex flex-wrap items-start justify-between gap-3 px-4 md:px-8">
      <div class="pointer-events-auto max-w-[19rem] rounded-[1.6rem] bg-white/90 px-5 py-3 text-[#2a1730] shadow-[0_5px_0_var(--l-toy-edge)]">
        <h1 class="text-2xl leading-tight sm:text-3xl" style="font-family: var(--l-display)">Los cuartos de tu casa</h1>
        <p class="mt-0.5 text-sm font-semibold text-[#6b5470]">
          {{ categories.length }} {{ categories.length === 1 ? "cuarto" : "cuartos" }} · {{ totalItems }}
          {{ totalItems === 1 ? "cosa guardada" : "cosas guardadas" }}
        </p>
      </div>
      <div class="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
        <slot name="actions" />
      </div>
    </div>

    <div v-if="categories.length === 0" class="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
      <p class="pointer-events-auto max-w-sm rounded-[1.6rem] bg-white/90 px-6 py-5 text-center leading-relaxed text-[#2a1730] shadow-[0_5px_0_var(--l-toy-edge)]">
        Tu isla todavía está vacía. Construye un cuarto y aparecerá aquí como una casita con su propio color.
      </p>
    </div>
    <p
      v-else-if="status === 'unsupported'"
      class="absolute inset-0 flex items-center justify-center px-6 text-center leading-relaxed text-[#2a1730]"
    >
      Tu navegador no puede mostrar la isla en 3D. Abre la lista de cuartos para entrar a cada uno.
    </p>

    <div
      v-if="categories.length > 0"
      class="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 px-4 pb-5 md:px-8"
    >
      <div
        class="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-full bg-white/90 px-4 py-2 text-[#2a1730] shadow-[0_4px_0_var(--l-toy-edge)]"
      >
        <font-awesome-icon :icon="isNight ? 'moon' : 'sun'" class="shrink-0 text-[#c4235f]" />
        <label class="sr-only" for="neighborhood-hour">Hora del día en la isla</label>
        <input
          id="neighborhood-hour"
          type="range"
          min="0"
          max="24"
          step="0.25"
          :value="hour"
          class="h-2 min-w-0 flex-1 accent-[#c4235f]"
          :disabled="status !== 'ready' || entering"
          @input="scrub"
        />
        <span class="w-[4.6rem] shrink-0 text-right text-sm font-extrabold tabular-nums">{{ clock }}</span>
        <button
          v-if="manualHour"
          type="button"
          class="shrink-0 rounded-full bg-[#ffe3ee] px-2.5 py-1 text-xs font-extrabold text-[#c4235f]"
          @click="followClock"
        >
          Ahora
        </button>
      </div>
      <div class="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
        <button type="button" class="ui-btn ui-btn-sm ui-btn-ghost" :disabled="status !== 'ready' || entering" @click="stage?.resetView()">
          <font-awesome-icon icon="map" /> Ver todo
        </button>
        <slot name="dock" />
      </div>
    </div>

    <div
      v-if="hover"
      class="pointer-events-none absolute z-10 w-max max-w-[15rem] -translate-x-1/2 -translate-y-full rounded-2xl bg-white px-4 py-2.5 text-center text-[#2a1730] shadow-[0_5px_0_var(--l-toy-edge)]"
      :style="{ left: `${hover.x}px`, top: `${hover.y}px` }"
    >
      <p class="text-lg leading-tight" style="font-family: var(--l-display)">{{ hover.name }}</p>
      <p v-if="describe(hover.id)" class="mt-0.5 line-clamp-2 text-xs text-[#6b5470]">{{ describe(hover.id) }}</p>
      <p class="mt-1 text-xs font-bold text-[#2a1730]">{{ describeCount(hover.count) }}</p>
      <p class="mt-1 text-[0.7rem] font-extrabold uppercase tracking-wide text-[#c4235f]">Toca para entrar</p>
    </div>

    <div
      class="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_50%_58%,#fff6dc_0%,#ffd37a_26%,#ffb3cb_75%)] opacity-0 transition-opacity duration-[650ms] ease-in motion-reduce:transition-none"
      :class="entering ? 'opacity-100 delay-[700ms]' : ''"
      aria-hidden="true"
    />
  </div>
</template>
