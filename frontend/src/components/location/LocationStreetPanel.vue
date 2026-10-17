<script setup lang="ts">
import { watch } from "vue";
import type { StreetStage } from "../../infrastructure/three/StreetStage.js";
import { useCanvasStage } from "../../composables/useCanvasStage.js";

const props = defineProps<{ location: string; eyebrow: string }>();

const { host, canvas, status, stage, remount, handlePointer } = useCanvasStage<StreetStage>({
  pointer: "host",
  create: async (target, reducedMotion) => {
    const { StreetStage } = await import("../../infrastructure/three/StreetStage.js");
    return new StreetStage(target, props.location, { reducedMotion });
  },
});

watch(() => props.location, remount);
</script>

<template>
  <div
    ref="host"
    class="relative isolate h-44 overflow-hidden rounded-[var(--l-radius)] bg-gradient-to-b from-[#b9a4f2] via-[#ffb3cb] to-[#ffe3d6] shadow-[0_8px_0_var(--l-toy-edge)] sm:h-56"
    @pointermove="handlePointer"
    @pointerleave="stage?.setPointer(0, 0)"
  >
    <canvas
      ref="canvas"
      aria-hidden="true"
      class="absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none"
      :class="status === 'ready' ? 'opacity-100' : 'opacity-0'"
    />
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-1 bg-gradient-to-t from-[#2a1730]/70 via-[#2a1730]/30 to-transparent px-5 pb-4 pt-12"
    >
      <span class="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#2a1730]">
        <font-awesome-icon icon="location-dot" /> {{ eyebrow }}
      </span>
      <p class="ui-sign text-3xl leading-tight text-white [text-shadow:0_3px_0_#c4235f] sm:text-4xl" style="font-family: var(--l-display)">
        {{ location }}
      </p>
    </div>
  </div>
</template>
