import type { ChecklistStatus, ListSource } from "../core/domain/checklist.js";

export const MAX_LINES = 100;
export const MAX_LINE_LENGTH = 200;
export const MAX_PAGE_URL_LENGTH = 2048;
export const MIN_USEFUL_LIST_ITEMS = 2;
export const MAX_SHOWN_LISTS = 6;
export const FALLBACK_SOURCES = 2;
export const MAX_ITEM_LENGTH = 90;
export const MAX_ITEMS_PER_LIST = 60;
export const MIN_FALLBACK_HEADING_LEVEL = 2;

export const CHECKLIST_FIELD_LABELS: Record<string, string> = { title: "El nombre del plan", lines: "La lista", url: "La dirección" };

export const BULLET_PATTERN = /^[-*•·]\s*/;
export const QUANTITY_PATTERN = /^\s*(\d+([./,]\d+)?|[½¼¾⅓⅔])(\s|[a-záéíóúñ])/i;
export const PAGE_TITLE_SEPARATOR = /\s*[|·–—]\s*/;

export const SOURCE_LABELS: Record<ListSource, string> = {
  lista: "Lista",
  tabla: "Tabla",
  encabezados: "Encabezados",
  parrafos: "Párrafos",
};

export const FALLBACK_NOTE = "La página no tenía listas ni tablas, así que los guardianes usaron lo demás. Revisa y quita lo que sobre.";

export const STAMP_LABELS = { agotado: "SE ACABÓ", roto: "ROTO" } as const;
export const POSTIT_TONES = ["#ffe98a", "#ffb3cf", "#bfe9d5", "#9fdcf2", "#cdbaf7"] as const;
export const TILTS = [-3, 2.5, -1.5, 3, -2.5, 1.5] as const;

export const STATUS_LABELS: Record<ChecklistStatus, string> = {
  tengo: "Lo tengo",
  revisar: "Revísalo",
  falta: "Me falta",
};

export const STATUS_ICONS: Record<ChecklistStatus, string> = {
  tengo: "check",
  revisar: "triangle-exclamation",
  falta: "xmark",
};

export const SECTION_TITLES: Record<ChecklistStatus, { title: string; hint: string; chip: string }> = {
  tengo: { title: "Ya está en la mochila", hint: "Los guardianes sí lo encontraron.", chip: "ui-chip-mint" },
  revisar: { title: "Asómate a ver", hint: "Existe, pero se acabó o necesita arreglo.", chip: "ui-chip-sun" },
  falta: { title: "Falta conseguirlo", hint: "Nadie lo tiene guardado.", chip: "ui-chip-rose" },
};

export const PLAN_IDEAS: { label: string; title: string; items: string[] }[] = [
  {
    label: "Panqué de elote",
    title: "Panqué de elote",
    items: ["1 lata de leche condensada", "2 tazas de granos de elote", "4 huevos", "1 taza de harina de trigo", "1 cucharada de polvo para hornear", "Mantequilla", "Molde para panqué"],
  },
  {
    label: "Noche de películas",
    title: "Noche de películas",
    items: ["Cobija", "Palomitas", "Control remoto", "Bocina", "Almohadas", "Refrescos"],
  },
  {
    label: "Día de campo",
    title: "Día de campo",
    items: ["Mantel", "Termo", "Sombrilla", "Platos", "Vasos", "Hielera", "Pelota"],
  },
  {
    label: "Cambiar un foco",
    title: "Cambiar un foco",
    items: ["Escalera", "Foco", "Desarmador", "Guantes", "Linterna"],
  },
];
