<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import type { BadgeStage } from "../infrastructure/three/BadgeStage.js";

const SIZE = 44;

const canvas = ref<HTMLCanvasElement | null>(null);
const ready = ref(false);

let stage: BadgeStage | null = null;

function handlePointer(event: PointerEvent): void {
  stage?.setPointer((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1);
}

onMounted(async () => {
  if (!canvas.value) return;
  try {
    const { BadgeStage } = await import("../infrastructure/three/BadgeStage.js");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    stage = new BadgeStage(canvas.value, { tone: "rose", reducedMotion });
  } catch {
    return;
  }
  stage.resize(SIZE);
  stage.start();
  window.addEventListener("pointermove", handlePointer, { passive: true });
  ready.value = true;
});

onBeforeUnmount(() => {
  window.removeEventListener("pointermove", handlePointer);
  stage?.dispose();
  stage = null;
});
</script>

<template>
  <span class="relative flex h-11 w-11 items-center justify-center" aria-hidden="true">
    <font-awesome-icon v-if="!ready" icon="box" class="text-xl text-[#ff8fb7]" />
    <canvas
      ref="canvas"
      class="absolute inset-0 h-11 w-11 transition-opacity duration-500"
      :class="ready ? 'opacity-100' : 'opacity-0'"
    />
  </span>
</template>
