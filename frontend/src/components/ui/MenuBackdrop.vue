<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { ParkStage } from "../../infrastructure/three/park/ParkStage.js";
import type { SkyVariant } from "../../infrastructure/three/sky/SkyBuilder.js";
import type { SkyStage } from "../../infrastructure/three/sky/SkyStage.js";
import { useTheme } from "../../utils/useTheme.js";

const props = withDefaults(defineProps<{ scene: SkyVariant | "parque"; celebrate?: number }>(), { celebrate: 0 });

interface Backdrop {
  setDark(dark: boolean): void;
  setPointer(x: number, y: number): void;
  resize(width: number, height: number): void;
  setVisible(visible: boolean): void;
  dispose(): void;
  celebrate?: () => void;
}

const LABELS: Record<SkyVariant | "parque", string> = {
  cielo: "Un cielo de juguete con un arcoíris, globos aerostáticos con ositos, una isla flotante, un barquito y un cohete",
  isla: "Un cielo de juguete con una isla flotante con castillo y globos aerostáticos con ositos",
  correo: "Un cielo de juguete con un cohete y globos aerostáticos con ositos pilotos",
  puerto: "Un mar de nubes de juguete con un barquito de vela, una isla flotante y un globo aerostático",
  parque: "Un parque de juguete con una rueda de la fortuna, un carrusel y un trencito",
};

const { isDark } = useTheme();
const host = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const status = ref<"loading" | "ready" | "unsupported">("loading");

let stage: Backdrop | null = null;
let resizeObserver: ResizeObserver | null = null;
let visibilityObserver: IntersectionObserver | null = null;

function handlePointer(event: PointerEvent): void {
  stage?.setPointer((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1);
}

async function createStage(target: HTMLCanvasElement): Promise<Backdrop> {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (props.scene === "parque") {
    const { ParkStage } = await import("../../infrastructure/three/park/ParkStage.js");
    return new ParkStage(target, { reducedMotion, centered: true }) as ParkStage;
  }
  const { SkyStage } = await import("../../infrastructure/three/sky/SkyStage.js");
  return new SkyStage(target, { reducedMotion, variant: props.scene }) as SkyStage;
}

onMounted(async () => {
  if (!host.value || !canvas.value) return;
  try {
    stage = await createStage(canvas.value);
    stage.setDark(isDark.value);
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

watch(isDark, (dark) => stage?.setDark(dark));
watch(
  () => props.celebrate,
  () => stage?.celebrate?.(),
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
    :class="isDark ? 'from-[#151a4a] via-[#2d2a68] to-[#5a3a78]' : 'from-[#b9a4f2] via-[#ffb3cb] to-[#ffe3d6]'"
    role="img"
    :aria-label="LABELS[scene]"
  >
    <canvas
      ref="canvas"
      class="h-full w-full transition-opacity duration-700 motion-reduce:transition-none"
      :class="status === 'ready' ? 'opacity-100' : 'opacity-0'"
    />
  </div>
</template>
