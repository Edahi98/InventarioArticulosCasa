<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import type { InventoryBear } from "../../core/domain/inventoryBear.js";
import type { DollhouseStage } from "../../infrastructure/three/DollhouseStage.js";

const props = defineProps<{ bears: InventoryBear[]; label: string }>();

const host = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const status = ref<"loading" | "ready" | "unsupported">("loading");

let stage: DollhouseStage | null = null;
let resizeObserver: ResizeObserver | null = null;

function handlePointer(event: PointerEvent): void {
  if (!host.value) return;
  const box = host.value.getBoundingClientRect();
  stage?.setPointer(((event.clientX - box.left) / box.width) * 2 - 1, ((event.clientY - box.top) / box.height) * 2 - 1);
}

onMounted(async () => {
  if (!host.value || !canvas.value) return;
  try {
    const { DollhouseStage } = await import("../../infrastructure/three/DollhouseStage.js");
    stage = new DollhouseStage(canvas.value, props.bears);
  } catch {
    status.value = "unsupported";
    return;
  }
  resizeObserver = new ResizeObserver(([entry]) => {
    if (entry) stage?.resize(entry.contentRect.width, entry.contentRect.height);
  });
  resizeObserver.observe(host.value);
  status.value = "ready";
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
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
    @pointerleave="stage?.setPointer(0, 0)"
  >
    <canvas ref="canvas" class="h-full w-full" :class="status === 'ready' ? 'opacity-100' : 'opacity-0'" />
    <p
      v-if="status === 'unsupported'"
      class="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-[var(--l-muted)]"
    >
      Tu navegador no puede mostrar la casa en 3D. El inventario funciona igual.
    </p>
  </div>
</template>
