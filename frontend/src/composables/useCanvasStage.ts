import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import { useWindowListener } from "./useWindowListener.js";

export type StageStatus = "loading" | "ready" | "unsupported";

export interface CanvasStage {
  resize(width: number, height: number): void;
  setVisible(visible: boolean): void;
  setPointer?(x: number, y: number): void;
  dispose(): void;
}

export interface CanvasStageOptions<T extends CanvasStage> {
  create: (canvas: HTMLCanvasElement, reducedMotion: boolean) => Promise<T>;
  onReady?: (stage: T) => void;
  onResize?: (width: number, height: number) => void;
  enabled?: () => boolean;
  pointer?: "window" | "host";
}

/**
 * Maneja el ciclo de vida de un escenario 3D dentro de un componente: lo crea al montar (respetando
 * `prefers-reduced-motion`), ajusta su tamaño, lo pausa cuando no se ve, le pasa la posición del puntero y
 * lo libera al desmontar.
 *
 * @param options - `create` arma el escenario; `onReady` lo configura al quedar listo; `onResize` avisa del
 * ancho y alto; `enabled` evita montarlo mientras devuelva `false`; `pointer` indica si el puntero se mide
 * respecto a la ventana (`window`) o al contenedor (`host`).
 * @returns Las referencias `host` y `canvas` para la plantilla, el `status` (`loading`, `ready` o
 * `unsupported`), el `stage` actual, `remount` para recrearlo y `handlePointer`/`handleLeave` para
 * enlazarlos al contenedor cuando `pointer` es `host`.
 */
export function useCanvasStage<T extends CanvasStage>(options: CanvasStageOptions<T>) {
  const host = ref<HTMLElement | null>(null);
  const canvas = ref<HTMLCanvasElement | null>(null);
  const status = ref<StageStatus>("loading");
  const stage = shallowRef<T | null>(null);

  let resizeObserver: ResizeObserver | null = null;
  let visibilityObserver: IntersectionObserver | null = null;

  async function mount(): Promise<void> {
    if (!host.value || !canvas.value || options.enabled?.() === false) return;
    const element = host.value;

    let created: T;
    try {
      created = await options.create(canvas.value, window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch {
      status.value = "unsupported";
      return;
    }
    if (!host.value) {
      created.dispose();
      return;
    }

    stage.value = created;
    options.onReady?.(created);
    resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) return;
      options.onResize?.(entry.contentRect.width, entry.contentRect.height);
      stage.value?.resize(entry.contentRect.width, entry.contentRect.height);
    });
    resizeObserver.observe(element);
    visibilityObserver = new IntersectionObserver(([entry]) => stage.value?.setVisible(Boolean(entry?.isIntersecting)));
    visibilityObserver.observe(element);
    status.value = "ready";
  }

  function unmount(): void {
    resizeObserver?.disconnect();
    visibilityObserver?.disconnect();
    resizeObserver = null;
    visibilityObserver = null;
    stage.value?.dispose();
    stage.value = null;
  }

  async function remount(): Promise<void> {
    unmount();
    status.value = "loading";
    await mount();
  }

  function handlePointer(event: PointerEvent): void {
    const target = stage.value;
    if (!target?.setPointer) return;
    if (options.pointer === "host" && host.value) {
      const box = host.value.getBoundingClientRect();
      target.setPointer(((event.clientX - box.left) / box.width) * 2 - 1, ((event.clientY - box.top) / box.height) * 2 - 1);
      return;
    }
    target.setPointer((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1);
  }

  function handleLeave(): void {
    stage.value?.setPointer?.(0, 0);
  }

  if (options.pointer === "window") useWindowListener("pointermove", handlePointer, { passive: true });
  onMounted(mount);
  onBeforeUnmount(unmount);

  return { host, canvas, status, stage, remount, handlePointer, handleLeave };
}
