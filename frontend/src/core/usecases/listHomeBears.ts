import type { InventoryBear } from "../domain/inventoryBear.js";

const HOME_BEARS: InventoryBear[] = [
  {
    id: "cocina",
    name: "Pimienta",
    room: "la cocina",
    label: "Cocina",
    prop: "pot",
    tone: "sky",
    symbol: "heart",
    summary: "Sabe dónde está la olla de presión y quién se llevó el rallador.",
    quirk: "No soporta las tapas que han perdido su olla.",
    items: ["Olla de presión", "Licuadora", "Juego de cuchillos"],
  },
  {
    id: "herramientas",
    name: "Tuerca",
    room: "el taller",
    label: "Herramientas",
    prop: "wrench",
    tone: "sun",
    symbol: "star",
    summary: "Lleva la cuenta de lo que prestaste y de lo que sigue sin arreglar.",
    quirk: "Se pone triste ante un cajón de cables enredados.",
    items: ["Taladro", "Llave inglesa", "Escalera plegable"],
  },
  {
    id: "libros",
    name: "Página",
    room: "el estudio",
    label: "Libros",
    prop: "books",
    tone: "lilac",
    symbol: "rainbow",
    summary: "Ordena la biblioteca por tema y apunta una nota en cada ejemplar.",
    quirk: "Dobla la esquina de las páginas solo en sus propios libros.",
    items: ["Recetarios", "Manuales", "Novelas"],
  },
  {
    id: "bodega",
    name: "Caja",
    room: "la bodega",
    label: "Bodega",
    prop: "box",
    tone: "rose",
    symbol: "cloud",
    summary: "Cuida lo que no usas todos los días, con una foto de lo que hay en cada caja.",
    quirk: "Odia abrir una caja entera para buscar una sola cosa.",
    items: ["Decoración navideña", "Ropa de temporada", "Maletas"],
  },
];

export function listHomeBears(): InventoryBear[] {
  return HOME_BEARS;
}

const PEEK_BEAR_IDS = ["bodega", "libros", "herramientas"];

/**
 * Los tres guardianes que se asoman en login, búsqueda y páginas vacías, con el rosa al centro.
 *
 * @returns Osos en el orden en que la escena los coloca.
 */
export function listPeekBears(): InventoryBear[] {
  return PEEK_BEAR_IDS.flatMap((id) => HOME_BEARS.filter((bear) => bear.id === id));
}
