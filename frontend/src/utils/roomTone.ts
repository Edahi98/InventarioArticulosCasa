export interface RoomTone {
  wall: string;
  rug: string;
}

const ROOM_TONES: RoomTone[] = [
  { wall: "#fff1c2", rug: "#b89cf2" },
  { wall: "#c9f0e0", rug: "#ffe35c" },
  { wall: "#ffd9c7", rug: "#7fd0ea" },
  { wall: "#dcebd0", rug: "#ff8fb7" },
  { wall: "#e6dcfb", rug: "#ffe35c" },
];

export const ROOM_FLOOR = "#8a6384";

/**
 * Elige el color de pared y de alfombra de una categoría, repetible para el mismo `id`.
 *
 * @param id - Identificador de la categoría.
 * @returns Colores del cuarto.
 */
export function roomTone(id: number): RoomTone {
  return ROOM_TONES[Math.abs(id) % ROOM_TONES.length]!;
}
