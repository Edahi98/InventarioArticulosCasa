<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { Category } from "../../core/domain/category.js";
import { HueSequence } from "../../infrastructure/three/neighborhood/HueSequence.js";
import type { NeighborhoodHover, NeighborhoodStage } from "../../infrastructure/three/neighborhood/NeighborhoodStage.js";

const props = defineProps<{ categories: Category[]; counts: Record<number, number> }>();
const emit = defineEmits<{ select: [id: number] }>();

const host = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const status = ref<"loading" | "ready" | "unsupported">("loading");
const hover = ref<NeighborhoodHover | null>(null);
const hour = ref(12);
const manualHour = ref(false);
const entering = ref<Category | null>(null);

let stage: NeighborhoodStage | null = null;
let resizeObserver: ResizeObserver | null = null;
let visibilityObserver: IntersectionObserver | null = null;

const clock = computed(() => {
  const moment = new Date();
  moment.setHours(Math.floor(hour.value), Math.round((hour.value % 1) * 60), 0, 0);
  return moment.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
});
const isNight = computed(() => hour.value < 6 || hour.value >= 19);
const enteringGlow = computed(() => (entering.value ? HueSequence.cssOf(entering.value.id) : "transparent"));

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
        onEnter: (id) => {
          entering.value = props.categories.find((category) => category.id === id) ?? null;
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
  <div class="flex flex-col gap-6">
    <div
      v-if="categories.length > 0 && status !== 'unsupported'"
      ref="host"
      class="relative isolate h-[62vh] min-h-[440px] overflow-hidden rounded-[var(--l-radius)] bg-gradient-to-b from-[#b9a4f2] via-[#ffb3cb] to-[#ffe3d6] shadow-[0_8px_0_var(--l-toy-edge)]"
    >
      <canvas
        ref="canvas"
        role="img"
        aria-label="Mapa del barrio: cada categoría es una casa de un color distinto. Arrastra para girar, usa la rueda para acercar y toca una casa para entrar."
        class="absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none"
        :class="status === 'ready' ? 'opacity-100' : 'opacity-0'"
      />

      <p
        class="pointer-events-none absolute left-4 top-4 hidden max-w-[17rem] rounded-full bg-white/85 px-3 py-1.5 text-xs font-extrabold text-[#2a1730] sm:block"
      >
        Arrastra para girar · rueda para acercar · toca una casa
      </p>
      <button
        type="button"
        class="ui-btn ui-btn-sm ui-btn-ghost absolute right-4 top-4"
        :disabled="status !== 'ready' || entering !== null"
        @click="stage?.resetView()"
      >
        <font-awesome-icon icon="map" /> Ver todo
      </button>

      <div
        class="absolute bottom-4 left-4 right-4 flex max-w-sm items-center gap-3 rounded-full bg-white/90 px-4 py-2 text-[#2a1730] shadow-[0_4px_0_var(--l-toy-edge)] sm:right-auto"
      >
        <font-awesome-icon :icon="isNight ? 'moon' : 'sun'" class="shrink-0 text-[#c4235f]" />
        <label class="sr-only" for="neighborhood-hour">Hora del día en el barrio</label>
        <input
          id="neighborhood-hour"
          type="range"
          min="0"
          max="24"
          step="0.25"
          :value="hour"
          class="h-2 min-w-0 flex-1 accent-[#c4235f]"
          :disabled="status !== 'ready' || entering !== null"
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
        class="pointer-events-none absolute inset-0 z-20 transition-opacity duration-[650ms] ease-in motion-reduce:transition-none"
        :class="entering ? 'opacity-100 delay-[700ms]' : 'opacity-0'"
        :style="{ background: `radial-gradient(circle at 50% 58%, #fff6dc 0%, #ffd37a 22%, ${enteringGlow} 70%)` }"
        aria-hidden="true"
      />
    </div>

    <p v-else-if="categories.length === 0" class="max-w-[52ch] leading-relaxed text-[var(--l-muted)]">
      Todavía no hay casas en el barrio. Construye un cuarto y aparecerá aquí con su propio color.
    </p>
    <p v-else class="max-w-[52ch] leading-relaxed text-[var(--l-muted)]">
      Tu navegador no puede mostrar el barrio en 3D. Los cuartos de abajo funcionan igual.
    </p>

    <ul v-if="categories.length > 0" class="flex flex-wrap gap-2" aria-label="Los cuartos del barrio">
      <li v-for="category in categories" :key="category.id">
        <router-link
          :to="`/categories/${category.id}/articles`"
          class="ui-btn ui-btn-sm ui-btn-ghost gap-2"
          @mouseenter="stage?.highlight(category.id)"
          @mouseleave="stage?.highlight(null)"
          @focus="stage?.highlight(category.id)"
          @blur="stage?.highlight(null)"
        >
          <span
            class="inline-block h-3.5 w-3.5 rounded-full border-2 border-[var(--l-ink)]/20"
            :style="{ backgroundColor: HueSequence.cssOf(category.id) }"
            aria-hidden="true"
          />
          {{ category.name }}
          <span class="text-xs font-extrabold tabular-nums text-[var(--l-muted)]">{{ countOf(category.id) }}</span>
        </router-link>
      </li>
    </ul>
  </div>
</template>
