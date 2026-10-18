<script setup lang="ts">
import { computed, ref } from "vue";
import type { Category } from "../../core/domain/category.js";
import { HueSequence } from "../../infrastructure/three/neighborhood/HueSequence.js";
import type { NeighborhoodHover, NeighborhoodStage } from "../../infrastructure/three/neighborhood/NeighborhoodStage.js";
import { useCanvasStage } from "../../composables/useCanvasStage.js";
import { useDayClock } from "../../composables/useDayClock.js";
import { useWindowListener } from "../../composables/useWindowListener.js";
import { useWalkStore } from "../../stores/walk.js";

const props = defineProps<{ categories: Category[]; counts: Record<number, number> }>();
const emit = defineEmits<{ select: [id: number]; edit: [category: Category]; remove: [category: Category] }>();

const anchor = ref<NeighborhoodHover | null>(null);
const pickedId = ref<number | null>(null);
const entering = ref(false);
const width = ref(1200);
const walk = useWalkStore();
const knob = ref({ x: 0, y: 0 });

const { hour, manualHour, clock, isNight, scrub, followClock } = useDayClock((value) => stage.value?.setHour(value));

const { host, canvas, status, stage } = useCanvasStage<NeighborhoodStage>({
  enabled: () => props.categories.length > 0,
  onReady: (ready) => {
    walk.touch = window.matchMedia("(pointer: coarse)").matches;
    if (walk.walking) void startWalk(ready, walk.takeResume() ?? walk.lastHouseId, walk.lastHouseId !== null && walk.resumeAtDoor);
  },
  onResize: (nextWidth) => {
    width.value = nextWidth;
  },
  create: async (target, reducedMotion) => {
    const { NeighborhoodStage } = await import("../../infrastructure/three/neighborhood/NeighborhoodStage.js");
    return new NeighborhoodStage(
      target,
      props.categories.map(({ id, name }) => ({ id, name, count: countOf(id) })),
      {
        onHover: (next) => {
          anchor.value = next;
        },
        onPick: (id) => {
          pickedId.value = id;
        },
        onEnter: (id) => {
          entering.value = true;
          anchor.value = null;
          if (walk.walking) walk.enterHouse(id);
        },
        onSelect: (id) => emit("select", id),
        onHour: (next) => {
          hour.value = next;
        },
        onWalkPrompt: (next) => {
          walk.prompt = next;
        },
        onWalkLock: (locked) => {
          walk.locked = locked;
        },
      },
      { reducedMotion },
    );
  },
});

const totalItems = computed(() => Object.values(props.counts).reduce((sum, value) => sum + value, 0));
const picked = computed(() => props.categories.find((category) => category.id === pickedId.value) ?? null);
const showCard = computed(() => anchor.value?.selected === true && picked.value !== null);
const showTip = computed(() => anchor.value !== null && !anchor.value.selected);
const cardStyle = computed(() => {
  const point = anchor.value;
  if (!point) return {};
  const half = Math.min(150, width.value / 2 - 8);
  const left = Math.min(Math.max(point.x, half + 8), width.value - half - 8);
  const below = point.y < 230;
  return { left: `${left}px`, top: `${below ? point.y + 76 : point.y}px`, transform: below ? "translate(-50%, 0)" : "translate(-50%, -100%)" };
});

function countOf(id: number | undefined): number {
  return id === undefined ? 0 : (props.counts[id] ?? 0);
}

function things(count: number): string {
  if (count === 0) return "Vacía y dormida";
  return count === 1 ? "Guarda 1 cosa" : `Guarda ${count} cosas`;
}

async function startWalk(target: NeighborhoodStage, houseId: number | null, fromDoor: boolean): Promise<void> {
  try {
    await target.startWalking(houseId, fromDoor);
    walk.ready();
  } catch {
    walk.end();
  }
}

function toggleWalk(): void {
  if (!stage.value) return;
  if (walk.walking) {
    stage.value.stopWalking();
    walk.end();
    return;
  }
  walk.begin();
  void startWalk(stage.value, pickedId.value, false);
}

function moveStick(event: PointerEvent): void {
  const base = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const reach = base.width / 2;
  const dx = Math.max(-1, Math.min(1, (event.clientX - (base.left + reach)) / reach));
  const dy = Math.max(-1, Math.min(1, (event.clientY - (base.top + reach)) / reach));
  knob.value = { x: dx, y: dy };
  stage.value?.setWalkStick(dx, -dy);
}

function releaseStick(): void {
  knob.value = { x: 0, y: 0 };
  stage.value?.setWalkStick(0, 0);
}

function pick(id: number): void {
  if (pickedId.value === id) {
    stage.value?.enterHouse(id);
    return;
  }
  stage.value?.focus(id);
}

useWindowListener("keydown", (event) => {
  if (event.key === "Escape" && pickedId.value !== null) stage.value?.focus(null);
});
</script>

<template>
  <div ref="host" class="fixed inset-0 z-0 overflow-hidden bg-gradient-to-b from-[#b9a4f2] via-[#ffb3cb] to-[#ffe3d6]">
    <canvas
      v-if="categories.length > 0 && status !== 'unsupported'"
      ref="canvas"
      role="img"
      aria-label="Isla de tu casa: cada categoría es una casita de un color distinto. Arrastra para girar, usa la rueda para acercar y toca una casa para elegirla."
      class="absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none"
      :class="status === 'ready' ? 'opacity-100' : 'opacity-0'"
    />

    <div class="pointer-events-none absolute inset-x-0 top-24 flex items-start justify-between gap-2 px-3 md:px-8">
      <div class="pointer-events-auto rounded-[1.4rem] bg-white/90 px-4 py-2 text-[#2a1730] shadow-[0_4px_0_var(--l-toy-edge)]">
        <h1 class="text-xl leading-tight sm:text-3xl" style="font-family: var(--l-display)">Tu casa</h1>
        <p class="text-xs font-semibold text-[#6b5470] sm:text-sm">
          {{ categories.length }} {{ categories.length === 1 ? "cuarto" : "cuartos" }} · {{ totalItems }}
          {{ totalItems === 1 ? "cosa" : "cosas" }}
        </p>
      </div>
      <div class="pointer-events-auto flex items-center gap-2">
        <slot name="actions" />
      </div>
    </div>

    <div v-if="categories.length === 0" class="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
      <p class="pointer-events-auto max-w-sm rounded-[1.6rem] bg-white/90 px-6 py-5 text-center leading-relaxed text-[#2a1730] shadow-[0_5px_0_var(--l-toy-edge)]">
        Tu isla todavía está vacía. Construye un cuarto y aparecerá aquí como una casita con su propio color.
      </p>
    </div>
    <p v-else-if="status === 'unsupported'" class="absolute inset-0 flex items-center justify-center px-6 text-center leading-relaxed text-[#2a1730]">
      Tu navegador no puede mostrar la isla en 3D. Elige un cuarto del dock de abajo para entrar.
    </p>

    <div
      v-if="showTip && anchor"
      class="pointer-events-none absolute z-10 w-max max-w-[14rem] -translate-x-1/2 -translate-y-full rounded-2xl bg-white px-3.5 py-2 text-center text-[#2a1730] shadow-[0_4px_0_var(--l-toy-edge)]"
      :style="{ left: `${anchor.x}px`, top: `${anchor.y}px` }"
    >
      <p class="text-base leading-tight" style="font-family: var(--l-display)">{{ categories.find((category) => category.id === anchor?.id)?.name ?? anchor.name }}</p>
      <p class="text-xs font-bold text-[#6b5470]">{{ things(anchor.count) }}</p>
    </div>

    <div
      v-if="showCard && picked"
      class="absolute z-10 w-[min(18.5rem,calc(100vw-1rem))] rounded-[1.8rem] bg-white px-4 pb-4 pt-3 text-[#2a1730] shadow-[0_6px_0_var(--l-toy-edge)]"
      :style="cardStyle"
      role="dialog"
      :aria-label="`Cuarto ${picked.name}`"
    >
      <div class="flex items-start gap-3">
        <span class="mt-1 inline-block h-5 w-5 shrink-0 rounded-full border-[3px] border-[#2a1730]/15" :style="{ backgroundColor: HueSequence.cssOf(picked.id) }" aria-hidden="true" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-xl leading-tight" style="font-family: var(--l-display)">{{ picked.name }}</p>
          <p class="text-sm font-bold text-[#6b5470]">{{ things(countOf(picked.id)) }}</p>
          <p v-if="picked.location" class="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-[#6b5470]">
            <font-awesome-icon icon="location-dot" /> {{ picked.location }}
          </p>
        </div>
        <button type="button" class="ui-btn ui-btn-sm ui-btn-ghost !px-2.5" aria-label="Soltar este cuarto" @click="stage?.focus(null)">
          <font-awesome-icon icon="xmark" />
        </button>
      </div>
      <div class="mt-3 flex items-center gap-2">
        <button type="button" class="ui-btn ui-btn-primary flex-1" @click="stage?.enterHouse(picked.id)">
          <font-awesome-icon icon="door-open" /> Entrar
        </button>
        <button type="button" class="ui-btn ui-btn-ghost !px-3" aria-label="Arreglar este cuarto" @click="emit('edit', picked)">
          <font-awesome-icon icon="pen" />
        </button>
        <button type="button" class="ui-btn ui-btn-danger !px-3" aria-label="Demoler este cuarto" @click="emit('remove', picked)">
          <font-awesome-icon icon="trash" />
        </button>
      </div>
    </div>

    <template v-if="walk.walking">
      <div v-if="!walk.entering && !walk.loading" class="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90 shadow-[0_0_0_2px_rgb(42_23_48/0.35)]" aria-hidden="true" />
      <div class="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-3 pb-5">
        <p v-if="walk.loading" class="menu-slot !py-1.5 text-sm font-extrabold" role="status">Preparando el paseo...</p>
        <button v-else-if="walk.canInteract && walk.prompt" type="button" class="menu-slot pointer-events-auto !py-2 text-base font-extrabold" @click="stage?.interactWalk()">
          <span class="menu-badge menu-badge-sun !h-9 !w-9">E</span>
          Abrir la puerta de {{ walk.prompt.name }}
        </button>
        <p v-if="!walk.loading && !walk.touch" class="menu-slot !py-1 text-xs font-extrabold" role="note">
          {{ walk.locked ? "WASD moverte · Shift correr · Espacio saltar · E abrir · Esc soltar el mouse" : "Haz clic en la escena para mirar con el mouse" }}
        </p>
        <button type="button" class="ui-btn ui-btn-sm ui-btn-ghost pointer-events-auto" @click="toggleWalk">
          <font-awesome-icon icon="xmark" /> Dejar de caminar
        </button>
      </div>
      <div
        v-if="walk.touch && !walk.loading"
        class="pointer-events-auto absolute bottom-6 left-5 h-28 w-28 touch-none rounded-full border-4 border-white/80 bg-white/30"
        aria-label="Joystick para caminar"
        @pointerdown.prevent="moveStick($event); ($event.currentTarget as HTMLElement).setPointerCapture($event.pointerId)"
        @pointermove="($event.buttons || $event.pointerType === 'touch') && moveStick($event)"
        @pointerup="releaseStick"
        @pointercancel="releaseStick"
      >
        <span class="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_4px_0_var(--l-toy-edge)]" :style="{ transform: `translate(calc(-50% + ${knob.x * 2.2}rem), calc(-50% + ${knob.y * 2.2}rem))` }" />
      </div>
      <button
        v-if="walk.touch && walk.canInteract"
        type="button"
        class="ui-btn ui-btn-primary pointer-events-auto absolute bottom-10 right-5"
        @click="stage?.interactWalk()"
      >
        <font-awesome-icon icon="door-open" /> Abrir
      </button>
    </template>

    <div v-if="categories.length > 0 && !walk.walking" class="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-3 pb-4">
      <div class="pointer-events-auto flex w-full max-w-xl items-center gap-2">
        <div class="flex min-w-0 flex-1 items-center gap-2.5 rounded-full bg-white/90 px-3.5 py-1.5 text-[#2a1730] shadow-[0_4px_0_var(--l-toy-edge)]">
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
          <span class="w-[4.4rem] shrink-0 text-right text-sm font-extrabold tabular-nums">{{ clock }}</span>
          <button v-if="manualHour" type="button" class="shrink-0 rounded-full bg-[#ffe3ee] px-2 py-0.5 text-xs font-extrabold text-[#c4235f]" @click="followClock">Ahora</button>
        </div>
        <button type="button" class="ui-btn ui-btn-sm ui-btn-primary shrink-0" :disabled="status !== 'ready' || entering" @click="toggleWalk">
          <font-awesome-icon icon="person-walking" /> Caminar
        </button>
        <button type="button" class="ui-btn ui-btn-sm ui-btn-ghost shrink-0 !px-3" aria-label="Ver toda la isla" :disabled="status !== 'ready' || entering" @click="stage?.focus(null); stage?.resetView()">
          <font-awesome-icon icon="map" />
        </button>
      </div>

      <nav class="pointer-events-auto w-full max-w-full" aria-label="Cuartos de tu casa">
        <ul class="mx-auto flex w-max max-w-full items-end gap-3 overflow-x-auto rounded-[2rem] bg-white/85 px-4 pb-2 pt-5 shadow-[0_5px_0_var(--l-toy-edge)] [scrollbar-width:none]">
          <li v-for="category in categories" :key="category.id" class="relative shrink-0">
            <button
              type="button"
              class="group relative flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-white shadow-[0_4px_0_rgb(42_23_48/0.18)] outline-offset-4 transition-transform duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-2 hover:scale-110 focus-visible:-translate-y-2 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#2a1730] motion-reduce:transition-none"
              :class="pickedId === category.id ? '-translate-y-3 scale-125' : ''"
              :style="{ backgroundColor: HueSequence.cssOf(category.id) }"
              :aria-label="`${category.name}, ${things(countOf(category.id))}`"
              :aria-pressed="pickedId === category.id"
              @click="pick(category.id)"
              @mouseenter="stage?.highlight(category.id)"
              @mouseleave="stage?.highlight(null)"
              @focus="stage?.highlight(category.id)"
              @blur="stage?.highlight(null)"
            >
              <svg viewBox="0 0 24 24" class="h-6 w-6 text-white drop-shadow-[0_1px_0_rgb(42_23_48/0.35)]" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3.5 11.5 12 4l8.5 7.5" />
                <path d="M6 10.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8.5" />
                <path d="M10 20v-5a2 2 0 0 1 4 0v5" />
              </svg>
              <span class="absolute -right-1.5 -top-2 min-w-[1.35rem] rounded-full bg-[#2a1730] px-1 text-center text-[0.7rem] font-extrabold leading-[1.35rem] text-white tabular-nums">
                {{ countOf(category.id) }}
              </span>
            </button>
            <span
              class="pointer-events-none absolute -top-9 left-1/2 w-max max-w-[8rem] -translate-x-1/2 truncate rounded-full bg-[#2a1730] px-2.5 py-0.5 text-xs font-extrabold text-white opacity-0 transition-opacity group-hover:opacity-100"
              :class="pickedId === category.id ? '!opacity-100' : ''"
              aria-hidden="true"
            >
              {{ category.name }}
            </span>
          </li>
          <li class="shrink-0">
            <router-link
              to="/categories/new"
              class="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-dashed border-[#c4235f]/50 text-[#c4235f] transition-transform duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-2 hover:scale-110 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#2a1730] motion-reduce:transition-none"
              aria-label="Construir un cuarto nuevo"
            >
              <font-awesome-icon icon="plus" />
            </router-link>
          </li>
        </ul>
      </nav>
    </div>

    <div
      class="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_50%_58%,#fff6dc_0%,#ffd37a_26%,#ffb3cb_75%)] opacity-0 transition-opacity duration-[650ms] ease-in motion-reduce:transition-none"
      :class="entering ? 'opacity-100 delay-[700ms]' : ''"
      aria-hidden="true"
    />
  </div>
</template>
