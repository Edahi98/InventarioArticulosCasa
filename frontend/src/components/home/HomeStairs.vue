<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useCanvasStage } from "../../composables/useCanvasStage.js";
import { useTheme } from "../../composables/useTheme.js";
import { useWindowListener } from "../../composables/useWindowListener.js";
import type { StairsStage } from "../../infrastructure/three/stairs/StairsStage.js";

const STEPS = 12;
const PHRASES = [
  "Arriba empieza el recorrido.",
  "Cada escalón es un cuarto por revisar.",
  "El guardián baja y anota lo que encuentra.",
  "Abajo todo queda en su lugar.",
] as const;

const { isDark } = useTheme();
const track = ref<HTMLElement | null>(null);
const progress = ref(0);

const step = computed(() => Math.round(progress.value * (STEPS - 1)) + 1);
const phrase = computed(() => PHRASES[Math.min(Math.floor(progress.value * PHRASES.length), PHRASES.length - 1)]);

const { host, canvas, status, stage } = useCanvasStage<StairsStage>({
  create: async (target, reducedMotion) => {
    const { StairsStage } = await import("../../infrastructure/three/stairs/StairsStage.js");
    return new StairsStage(target, { reducedMotion });
  },
  onReady: (ready) => {
    ready.setDark(isDark.value);
    updateProgress();
  },
});

function updateProgress(): void {
  if (!track.value) return;
  const box = track.value.getBoundingClientRect();
  const span = Math.max(box.height - window.innerHeight, 1);
  progress.value = Math.min(Math.max(-box.top / span, 0), 1);
  stage.value?.setProgress(progress.value);
}

useWindowListener("scroll", updateProgress, { passive: true });
watch(isDark, (dark) => stage.value?.setDark(dark));
</script>

<template>
  <section ref="track" class="relative h-[320vh]" aria-label="El osito baja por la escalera mientras avanzas">
    <div ref="host" class="sticky top-0 h-dvh overflow-hidden">
      <canvas
        ref="canvas"
        class="h-full w-full transition-opacity duration-700 motion-reduce:transition-none"
        :class="status === 'ready' ? 'opacity-100' : 'opacity-0'"
        aria-hidden="true"
      />
      <div class="pointer-events-none absolute inset-x-0 top-24 mx-auto flex max-w-7xl flex-col items-end gap-3 px-4 text-right md:px-8">
        <p class="menu-slot !py-1.5 text-sm font-extrabold">
          <span class="menu-badge menu-badge-sun !h-8 !w-8">{{ step }}</span>
          Escalón {{ step }} de {{ STEPS }}
        </p>
        <h2 class="ui-sign max-w-md text-4xl leading-none text-[var(--l-ink)] md:text-5xl" aria-live="polite">{{ phrase }}</h2>
      </div>
    </div>
  </section>
</template>
