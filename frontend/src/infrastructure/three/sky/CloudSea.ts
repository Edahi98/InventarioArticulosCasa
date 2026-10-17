import { Color, Group, Mesh, MeshStandardMaterial, SphereGeometry } from "three";
import { SeededRandom } from "../neighborhood/SeededRandom.js";

const DAY = new Color(0xffffff);
const NIGHT = new Color(0x6a70c8);
const SPAN = 120;

export class CloudSea {
  readonly group = new Group();
  private readonly banks: Group[] = [];
  private readonly material = new MeshStandardMaterial({ color: 0xffffff, roughness: 1, emissive: 0xffe3ee, emissiveIntensity: 0.35 });
  private readonly rng = new SeededRandom("mar-de-nubes");

  /**
   * Un mar de nubes esponjosas en tres capas de profundidad que se deslizan despacio y tapan el fondo.
   */
  constructor() {
    const layers = [
      { count: 16, y: -13, z: -16, scale: 2.6, speed: 0.12 },
      { count: 14, y: -11.5, z: -6, scale: 2.1, speed: 0.2 },
      { count: 10, y: -10.5, z: 6, scale: 1.7, speed: 0.32 },
    ];
    layers.forEach((layer) => {
      for (let index = 0; index < layer.count; index += 1) {
        const bank = this.bank(layer.scale * this.rng.between(0.8, 1.3));
        bank.position.set(-SPAN / 2 + (index / layer.count) * SPAN, layer.y + this.rng.between(-0.6, 0.6), layer.z);
        bank.userData = { home: bank.position.x, speed: layer.speed };
        this.banks.push(bank);
        this.group.add(bank);
      }
    });
  }

  /**
   * Desliza las nubes y las apaga de noche.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.material.color.copy(DAY).lerp(NIGHT, night);
    this.material.emissiveIntensity = 0.35 * (1 - night);
    this.banks.forEach((bank) => {
      const { home, speed } = bank.userData as { home: number; speed: number };
      bank.position.x = ((home + t * speed + SPAN / 2) % SPAN) - SPAN / 2;
    });
  }

  private bank(scale: number): Group {
    const bank = new Group();
    [-1.5, -0.6, 0.4, 1.4].forEach((offset, part) => {
      const radius = part === 1 || part === 2 ? 1.2 : 0.85;
      const puff = new Mesh(new SphereGeometry(radius, 14, 10), this.material);
      puff.position.set(offset, part === 1 || part === 2 ? 0.25 : -0.05, this.rng.between(-0.3, 0.3));
      bank.add(puff);
    });
    bank.scale.setScalar(scale);
    return bank;
  }
}
