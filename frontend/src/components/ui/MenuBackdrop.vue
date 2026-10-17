<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { ScenicStage } from "../../infrastructure/three/scenes/ScenicStage.js";
import type { ScenicWorld } from "../../infrastructure/three/scenes/ScenicWorld.js";
import { useTheme } from "../../utils/useTheme.js";

type Scene = "casa" | "barrio" | "correo" | "busqueda" | "almacen" | "empaque";

const props = withDefaults(defineProps<{ scene: Scene; celebrate?: number }>(), { celebrate: 0 });

const LABELS: Record<Scene, string> = {
  casa: "La entrada de una casita de juguete con un buzón, una llave gigante y dos ositos que dan la bienvenida",
  barrio: "Una calle de juguete con casitas de colores, cada una con su osito en la puerta, y cochecitos pasando",
  correo: "Un cielo de juguete con aviones de papel, sobres, globos de conversación y un buzón gigante con un osito cartero",
  busqueda: "Una pradera de juguete con una lupa gigante, huellas, signos de interrogación y ositos escondidos tras los arbustos",
  almacen: "Un cuarto de guardado de juguete con estantes llenos de cajas, cajas apiladas, una escalera y ositos ayudando",
  empaque: "Un cuarto de empaque de juguete con una banda transportadora de paquetes y una caja abierta de la que salen estrellas",
};

const { isDark } = useTheme();
const host = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const status = ref<"loading" | "ready" | "unsupported">("loading");

let stage: ScenicStage | null = null;
let resizeObserver: ResizeObserver | null = null;
let visibilityObserver: IntersectionObserver | null = null;

function handlePointer(event: PointerEvent): void {
  stage?.setPointer((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1);
}

async function createWorld(): Promise<ScenicWorld> {
  const worlds: Record<Scene, () => Promise<ScenicWorld>> = {
    casa: async () => new (await import("../../infrastructure/three/scenes/HouseFrontWorld.js")).HouseFrontWorld(),
    barrio: async () => new (await import("../../infrastructure/three/scenes/NeighborhoodWorld.js")).NeighborhoodWorld(),
    correo: async () => new (await import("../../infrastructure/three/scenes/PostWorld.js")).PostWorld(),
    busqueda: async () => new (await import("../../infrastructure/three/scenes/SearchWorld.js")).SearchWorld(),
    almacen: async () => new (await import("../../infrastructure/three/scenes/StorageWorld.js")).StorageWorld("almacen"),
    empaque: async () => new (await import("../../infrastructure/three/scenes/StorageWorld.js")).StorageWorld("empaque"),
  };
  return worlds[props.scene]();
}

onMounted(async () => {
  if (!host.value || !canvas.value) return;
  try {
    const [{ ScenicStage }, world] = await Promise.all([import("../../infrastructure/three/scenes/ScenicStage.js"), createWorld()]);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    stage = new ScenicStage(canvas.value, { reducedMotion, world });
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
  () => stage?.celebrate(),
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
