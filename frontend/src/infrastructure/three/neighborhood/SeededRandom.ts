export class SeededRandom {
  private state: number;

  /**
   * @param seed - Número o texto; la misma semilla produce siempre la misma secuencia.
   */
  constructor(seed: number | string) {
    this.state = typeof seed === "number" ? Math.imul(seed | 0, 2654435761) ^ 0x9e3779b9 : SeededRandom.hash(seed);
  }

  /**
   * @returns Un decimal entre 0 (incluido) y 1 (excluido).
   */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * @param min - Mínimo.
   * @param max - Máximo.
   * @returns Un decimal entre `min` y `max`.
   */
  between(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * @param probability - Probabilidad entre 0 y 1.
   * @returns `true` con esa probabilidad.
   */
  chance(probability: number): boolean {
    return this.next() < probability;
  }

  /**
   * @param items - Opciones; no puede estar vacía.
   * @returns Una de las opciones al azar.
   */
  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)] as T;
  }

  private static hash(text: string): number {
    let state = 2166136261;
    for (const char of text) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
    return state;
  }
}
