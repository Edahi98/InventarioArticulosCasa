<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { InventoryBear } from "../../core/domain/inventoryBear.js";
import type { BearStage } from "../../infrastructure/three/BearStage.js";

const props = withDefaults(
  defineProps<{
    bears: InventoryBear[];
    activeId?: string | null;
    label: string;
  }>(),
  { activeId: null },
);

const host = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const status = ref<"loading" | "ready" | "unsupported">("loading");

let stage: BearStage | null = null;
let resizeObserver: ResizeObserver | null = null;
let visibilityObserver: IntersectionObserver | null = null;

function handlePointer(event: PointerEvent): void {
  if (!host.value || !stage) return;
  const box = host.value.getBoundingClientRect();
  stage.setPointer(((event.clientX - box.left) / box.width) * 2 - 1, ((event.clientY - box.top) / box.height) * 2 - 1);
}

function handleLeave(): void {
  stage?.setPointer(0, 0);
}

onMounted(async () => {
  if (!host.value || !canvas.value) return;
  try {
    const { BearStage } = await import("../../infrastructure/three/BearStage.js");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    stage = new BearStage(canvas.value, props.bears, { reducedMotion });
  } catch {
    status.value = "unsupported";
    return;
  }

  stage.setActive(props.activeId);
  resizeObserver = new ResizeObserver(([entry]) => {
    if (entry) stage?.resize(entry.contentRect.width, entry.contentRect.height);
  });
  resizeObserver.observe(host.value);
  visibilityObserver = new IntersectionObserver(([entry]) => stage?.setVisible(Boolean(entry?.isIntersecting)));
  visibilityObserver.observe(host.value);
  status.value = "ready";
});

watch(
  () => props.activeId,
  (id) => stage?.setActive(id),
);

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  visibilityObserver?.disconnect();
  stage?.dispose();
  stage = null;
});
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
