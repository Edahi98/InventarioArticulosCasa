import { computed, ref, type ComputedRef } from "vue";

export type ThemeName = "light" | "dark";

const STORAGE_KEY = "inventario_theme";

function readStoredTheme(): ThemeName | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

function systemTheme(): ThemeName {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const theme = ref<ThemeName>(readStoredTheme() ?? systemTheme());

function apply(name: ThemeName): void {
  document.documentElement.dataset.theme = name;
}

/**
 * Tema de color de la aplicación: arranca con la preferencia guardada o la del sistema.
 *
 * @returns El tema actual, si es oscuro y la función para alternarlo (se guarda en `localStorage`).
 */
export function useTheme(): { theme: ComputedRef<ThemeName>; isDark: ComputedRef<boolean>; toggle: () => void } {
  apply(theme.value);

  function toggle(): void {
    theme.value = theme.value === "dark" ? "light" : "dark";
    apply(theme.value);
    try {
      localStorage.setItem(STORAGE_KEY, theme.value);
    } catch {
      return;
    }
  }

  return {
    theme: computed(() => theme.value),
    isDark: computed(() => theme.value === "dark"),
    toggle,
  };
}
