<script setup lang="ts">
import { watch } from "vue";
import type { InventoryBear } from "../../core/domain/inventoryBear.js";
import type { BearStage } from "../../infrastructure/three/BearStage.js";
import { useCanvasStage } from "../../composables/useCanvasStage.js";

const props = withDefaults(
  defineProps<{
    bears: InventoryBear[];
    activeId?: string | null;
    label: string;
  }>(),
  { activeId: null },
);

const { host, canvas, status, stage, handlePointer, handleLeave } = useCanvasStage<BearStage>({
  pointer: "host",
  create: async (target, reducedMotion) => {
    const { BearStage } = await import("../../infrastructure/three/BearStage.js");
    return new BearStage(target, props.bears, { reducedMotion });
  },
  onReady: (ready) => ready.setActive(props.activeId),
});

watch(
  () => props.activeId,
  (id) => stage.value?.setActive(id),
);
</script>

<template>
  <div
    ref="host"
    class="relative h-full w-full"
    role="img"
    :aria-label="label"
    @pointermove="handlePointer"
    @pointerleave="handleLeave"
  >
    <canvas
      ref="canvas"
      class="h-full w-full transition-opacity duration-700 motion-reduce:transition-none"
      :class="status === 'ready' ? 'opacity-100' : 'opacity-0'"
    />
    <div
      v-if="status === 'loading'"
      class="absolute inset-0 flex items-end justify-center gap-4 pb-10"
      aria-hidden="true"
    >
      <span
        v-for="n in bears.length"
        :key="n"
        class="h-28 w-24 animate-pulse rounded-[16px] bg-[var(--l-surface-2)] motion-reduce:animate-none"
      ></span>
    </div>
    <p
      v-if="status === 'unsupported'"
      class="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-[var(--l-muted)]"
    >
      Tu navegador no puede mostrar la escena en 3D. El inventario funciona igual.
    </p>
  </div>
</template>
