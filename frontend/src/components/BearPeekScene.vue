<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { InventoryBear } from "../core/domain/inventoryBear.js";
import type { LoginMood, LoginStage } from "../infrastructure/three/LoginStage.js";

const props = defineProps<{
  bears: InventoryBear[];
  gazeX: number;
  covering: boolean;
  mood: LoginMood;
}>();

const host = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const ready = ref(false);

let stage: LoginStage | null = null;
let resizeObserver: ResizeObserver | null = null;
let visibilityObserver: IntersectionObserver | null = null;

onMounted(async () => {
  if (!host.value || !canvas.value) return;
  try {
    const { LoginStage } = await import("../infrastructure/three/LoginStage.js");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    stage = new LoginStage(canvas.value, props.bears, { reducedMotion });
  } catch {
    return;
  }

  stage.setGaze(props.gazeX, 0);
  stage.setCovering(props.covering);
  stage.setMood(props.mood);
  resizeObserver = new ResizeObserver(([entry]) => {
    if (entry) stage?.resize(entry.contentRect.width, entry.contentRect.height);
  });
  resizeObserver.observe(host.value);
  visibilityObserver = new IntersectionObserver(([entry]) => stage?.setVisible(Boolean(entry?.isIntersecting)));
  visibilityObserver.observe(host.value);
  ready.value = true;
});

watch(
  () => props.gazeX,
  (x) => stage?.setGaze(x, 0),
);
watch(
  () => props.covering,
  (covering) => stage?.setCovering(covering),
);
watch(
  () => props.mood,
  (mood) => stage?.setMood(mood),
);

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  visibilityObserver?.disconnect();
  stage?.dispose();
  stage = null;
});
</script>

<template>
  <div ref="host" class="h-full w-full" role="img" aria-label="Tres ositos asomados que siguen tu cursor">
    <canvas
      ref="canvas"
      class="h-full w-full transition-opacity duration-700 motion-reduce:transition-none"
      :class="ready ? 'opacity-100' : 'opacity-0'"
    />
  </div>
</template>
