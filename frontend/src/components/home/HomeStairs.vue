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

const TINTS = ["#ff8fb7", "#7fd0ea", "#ffe35c", "#b89cf2", "#86d6a8", "#ffb066"] as const;

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
      <div class="pointer-events-none absolute inset-x-0 top-24 mx-auto flex max-w-7xl flex-col items-end gap-3 px-4 md:px-8">
        <div class="step-sign" role="img" :aria-label="`Escalón ${step} de ${STEPS}`">
          <p class="step-label" aria-hidden="true">Escalón</p>
          <p class="step-number" aria-hidden="true">
            <span :key="step" class="step-digit">{{ step }}</span><small>/{{ STEPS }}</small>
          </p>
          <div class="step-meter" aria-hidden="true">
            <span
              v-for="index in STEPS"
              :key="index"
              class="step-bar"
              :class="{ 'is-done': index <= step, 'is-now': index === step }"
              :style="{ '--h': `${(STEPS + 1 - index) * 0.2 + 0.3}rem`, '--tint': TINTS[(index - 1) % TINTS.length] }"
            >
              <i v-if="index === step" :key="step" class="step-bear" />
            </span>
          </div>
        </div>
      </div>
      <div class="pointer-events-none absolute inset-x-0 bottom-8 mx-auto max-w-7xl px-4 md:px-8">
        <h2 class="step-phrase" aria-live="polite">{{ phrase }}</h2>
      </div>
    </div>
  </section>
</template>

<style scoped>
.step-phrase {
  display: inline-block;
  max-width: 19rem;
  padding: 0.8rem 1.2rem 0.9rem;
  border-radius: 1.4rem;
  border: 4px solid var(--l-ink);
  background: var(--l-surface);
  box-shadow: 0 6px 0 var(--l-accent-edge);
  font-family: var(--l-display);
  font-size: 1.5rem;
  line-height: 1.1;
  color: var(--l-ink);
  transform: rotate(-1.2deg);
}
@media (min-width: 768px) {
  .step-phrase {
    font-size: 1.9rem;
    max-width: 24rem;
  }
}
.step-sign {
  position: relative;
  min-width: 11.5rem;
  padding: 0.7rem 1.1rem 0.9rem;
  border-radius: 1.4rem;
  border: 4px solid var(--l-ink);
  background: var(--l-surface);
  box-shadow: 0 6px 0 var(--l-toy-edge), 0 18px 30px -18px rgb(0 0 0 / 0.5);
  text-align: center;
  transform-origin: 50% -5rem;
  animation: step-swing 5.5s ease-in-out infinite;
}
.step-sign::before,
.step-sign::after {
  content: "";
  position: absolute;
  bottom: calc(100% - 4px);
  width: 4px;
  height: 80vh;
  background: var(--l-ink);
}
.step-sign::before { left: 1.3rem; }
.step-sign::after { right: 1.3rem; }
.step-label {
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--l-muted);
}
.step-number {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.2rem;
  line-height: 1;
  font-family: var(--l-display);
  color: var(--l-ink);
}
.step-digit {
  display: inline-block;
  min-width: 1.2ch;
  font-size: 3.2rem;
  text-shadow: 0 3px 0 var(--l-sign-shadow);
  animation: step-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.step-number small {
  font-size: 1.1rem;
  color: var(--l-muted);
}
.step-meter {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
  height: 3.3rem;
  margin-top: 0.5rem;
}
.step-bar {
  position: relative;
  width: 0.58rem;
  height: var(--h);
  border-radius: 0.2rem 0.2rem 0.1rem 0.1rem;
  border: 2px solid color-mix(in srgb, var(--l-ink) 35%, transparent);
  background: transparent;
  transition: background-color 0.25s, border-color 0.25s;
}
.step-bar.is-done {
  border-color: var(--l-ink);
  background: var(--tint);
}
.step-bar.is-now {
  box-shadow: 0 -3px 0 var(--l-ink);
}
.step-bear {
  position: absolute;
  bottom: calc(100% + 0.25rem);
  left: 50%;
  width: 0.95rem;
  height: 0.85rem;
  margin-left: -0.475rem;
  border-radius: 50%;
  border: 2px solid var(--l-ink);
  background: #ffb3cb;
  animation: step-hop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.step-bear::before,
.step-bear::after {
  content: "";
  position: absolute;
  top: -0.32rem;
  width: 0.34rem;
  height: 0.34rem;
  border-radius: 50%;
  border: 2px solid var(--l-ink);
  background: #ffb3cb;
}
.step-bear::before { left: -0.15rem; }
.step-bear::after { right: -0.15rem; }
@keyframes step-swing {
  50% { transform: rotate(1.6deg); }
}
@keyframes step-pop {
  from { transform: translateY(0.7rem) scale(0.6); opacity: 0; }
}
@keyframes step-hop {
  from { transform: translateY(-1.2rem); }
}
@media (prefers-reduced-motion: reduce) {
  .step-sign, .step-digit, .step-bear { animation: none; }
  .step-bar { transition: none; }
}
</style>
