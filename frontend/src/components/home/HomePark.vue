<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { ParkStage } from "../../infrastructure/three/park/ParkStage.js";

const props = defineProps<{ dark: boolean }>();

const host = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const status = ref<"loading" | "ready" | "unsupported">("loading");

let stage: ParkStage | null = null;
let resizeObserver: ResizeObserver | null = null;
let visibilityObserver: IntersectionObserver | null = null;

function handlePointer(event: PointerEvent): void {
  stage?.setPointer((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1);
}

onMounted(async () => {
  if (!host.value || !canvas.value) return;
  try {
    const { ParkStage } = await import("../../infrastructure/three/park/ParkStage.js");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    stage = new ParkStage(canvas.value, { reducedMotion });
    stage.setDark(props.dark);
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
  window.addEventListener("pointermove", handlePointer, { passive: true });
  status.value = "ready";
});

watch(
  () => props.dark,
  (dark) => stage?.setDark(dark),
);

onBeforeUnmount(() => {
  window.removeEventListener("pointermove", handlePointer);
  resizeObserver?.disconnect();
  visibilityObserver?.disconnect();
  stage?.dispose();
  stage = null;
});
</script>

<template>
  <div
    ref="host"
    class="bg-gradient-to-b"
    :class="dark ? 'from-[#151a4a] via-[#2d2a68] to-[#5a3a78]' : 'from-[#b9a4f2] via-[#ffb3cb] to-[#ffe3d6]'"
    role="img"
    aria-label="Un parque de juguete con una rueda de la fortuna, un carrusel y un trencito, con los ositos guardianes de paseo"
  >
    <canvas
      ref="canvas"
      class="h-full w-full transition-opacity duration-700 motion-reduce:transition-none"
      :class="status === 'ready' ? 'opacity-100' : 'opacity-0'"
    />
  </div>
</template>
