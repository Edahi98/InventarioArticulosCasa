<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { StreetStage } from "../../infrastructure/three/StreetStage.js";

const props = defineProps<{ location: string; eyebrow: string }>();

const host = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const status = ref<"loading" | "ready" | "unsupported">("loading");

let stage: StreetStage | null = null;
let resizeObserver: ResizeObserver | null = null;
let visibilityObserver: IntersectionObserver | null = null;

async function mountStage(): Promise<void> {
  if (!host.value || !canvas.value) return;
  try {
    const { StreetStage } = await import("../../infrastructure/three/StreetStage.js");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    stage = new StreetStage(canvas.value, props.location, { reducedMotion });
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
  status.value = "ready";
}

function unmountStage(): void {
  resizeObserver?.disconnect();
  visibilityObserver?.disconnect();
  stage?.dispose();
  stage = null;
}

function handlePointer(event: PointerEvent): void {
  if (!host.value) return;
  const box = host.value.getBoundingClientRect();
  stage?.setPointer(((event.clientX - box.left) / box.width) * 2 - 1, ((event.clientY - box.top) / box.height) * 2 - 1);
}

onMounted(mountStage);

watch(
  () => props.location,
  async () => {
    unmountStage();
    status.value = "loading";
    await mountStage();
  },
);

onBeforeUnmount(unmountStage);
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
