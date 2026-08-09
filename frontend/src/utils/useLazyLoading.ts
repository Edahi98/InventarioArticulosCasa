import { onBeforeUnmount, onMounted, ref, type Ref } from "vue";

export interface LazyLoadingOptions {
  rootMargin?: string;
  threshold?: number;
}

export function useLazyLoading(
  targetRef: Ref<HTMLElement | null>,
  options: LazyLoadingOptions = {},
): { isVisible: Ref<boolean> } {
  const isVisible = ref(false);
  let observer: IntersectionObserver | null = null;

  onMounted(() => {
    if (!targetRef.value) return;

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          isVisible.value = true;
          observer?.disconnect();
        }
      },
      {
        rootMargin: options.rootMargin ?? "100px",
        threshold: options.threshold ?? 0,
      },
    );

    observer.observe(targetRef.value);
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
  });

  return { isVisible };
}
