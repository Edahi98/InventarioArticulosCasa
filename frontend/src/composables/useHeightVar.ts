import { onBeforeUnmount, onMounted, type Ref } from "vue";

/**
 * Publica el alto de un elemento como variable CSS en `:root` mientras el componente está montado.
 *
 * @param target - Referencia al elemento que se mide.
 * @param name - Nombre de la variable CSS (por ejemplo, `--header-h`).
 */
export function useHeightVar(target: Ref<HTMLElement | null>, name: string): void {
  let observer: ResizeObserver | null = null;

  onMounted(() => {
    const element = target.value;
    if (!element) return;
    const publish = (): void => document.documentElement.style.setProperty(name, `${element.offsetHeight}px`);
    publish();
    observer = new ResizeObserver(publish);
    observer.observe(element);
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
    document.documentElement.style.removeProperty(name);
  });
}
