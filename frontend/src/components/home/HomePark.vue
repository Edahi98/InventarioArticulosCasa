<script setup lang="ts">
import { watch } from "vue";
import type { ParkStage } from "../../infrastructure/three/park/ParkStage.js";
import { useCanvasStage } from "../../composables/useCanvasStage.js";

const props = defineProps<{ dark: boolean }>();

const { host, canvas, status, stage } = useCanvasStage<ParkStage>({
  pointer: "window",
  create: async (target, reducedMotion) => {
    const { ParkStage } = await import("../../infrastructure/three/park/ParkStage.js");
    return new ParkStage(target, { reducedMotion });
  },
  onReady: (ready) => ready.setDark(props.dark),
});

watch(
  () => props.dark,
  (dark) => stage.value?.setDark(dark),
);
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
