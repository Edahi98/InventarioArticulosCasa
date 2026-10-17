export interface NavItem {
  to: string;
  icon: string;
  title: string;
  label: string;
  tone: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/categories", icon: "map", title: "El barrio", label: "Barrio", tone: "#bfe9d5" },
  { to: "/search", icon: "magnifying-glass", title: "¿Qué se perdió?", label: "Perdidos", tone: "#ffe98a" },
  { to: "/checklist", icon: "list-check", title: "¿Tengo todo?", label: "Mochila", tone: "#ffb3cf" },
  { to: "/telegram", icon: "paper-plane", title: "Correo", label: "Correo", tone: "#cdbaf7" },
  { to: "/users", icon: "user", title: "Habitantes", label: "Habitantes", tone: "#9fdcf2" },
];

export const PULL_FEEDBACK_MS = 520;
