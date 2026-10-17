<script setup lang="ts">
import { watch } from "vue";
import type { InventoryBear } from "../core/domain/inventoryBear.js";
import type { LoginMood, LoginStage } from "../infrastructure/three/LoginStage.js";
import { useCanvasStage } from "../composables/useCanvasStage.js";

const props = defineProps<{
  bears: InventoryBear[];
  gazeX: number;
  covering: boolean;
  mood: LoginMood;
}>();

const { host, canvas, status, stage } = useCanvasStage<LoginStage>({
  create: async (target, reducedMotion) => {
    const { LoginStage } = await import("../infrastructure/three/LoginStage.js");
    return new LoginStage(target, props.bears, { reducedMotion });
  },
  onReady: (ready) => {
    ready.setGaze(props.gazeX, 0);
    ready.setCovering(props.covering);
    ready.setMood(props.mood);
  },
});

watch(
  () => props.gazeX,
  (x) => stage.value?.setGaze(x, 0),
);
watch(
  () => props.covering,
  (covering) => stage.value?.setCovering(covering),
);
watch(
  () => props.mood,
  (mood) => stage.value?.setMood(mood),
);
</script>

<template>
  <div ref="host" class="h-full w-full" role="img" aria-label="Tres ositos asomados que siguen tu cursor">
    <canvas
      ref="canvas"
      class="h-full w-full transition-opacity duration-700 motion-reduce:transition-none"
      :class="status === 'ready' ? 'opacity-100' : 'opacity-0'"
    />
  </div>
</template>
