export class BearBudget {
  private used = 0;

  /**
   * Tope de ositos animados para un tipo de habitante (compradores, vecinos, caballeros…), para no cargar de más a los
   * teléfonos.
   *
   * @param max - Cuántos ositos caben como máximo.
   */
  constructor(private readonly max: number) {}

  /**
   * @returns `true` si todavía cabe otro osito (y lo cuenta), `false` si ya se llegó al tope.
   */
  take(): boolean {
    if (this.used >= this.max) return false;
    this.used += 1;
    return true;
  }
}
