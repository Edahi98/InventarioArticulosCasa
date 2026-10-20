import { ConeGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry } from "three";
import { DUCKS_PER_ISLAND } from "../../../constantes/barrio_constantes.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { SeededRandom } from "./SeededRandom.js";
import type { IslandCircle } from "./Sparkles.js";

interface Duck {
  group: Group;
  island: IslandCircle;
  distance: number;
  angle: number;
  speed: number;
  phase: number;
}

const WATER_Y = -1.33;

export class DuckFlock {
  readonly group = new Group();
  private readonly ducks: Duck[] = [];
  private readonly materials = new Map<number, MeshStandardMaterial>();

  /**
   * Familias de patitos de hule que nadan en fila alrededor de cada isla: una mamá pata blanca adelante y sus
   * patitos amarillos detrás, meciéndose sobre el agua.
   *
   * @param islands - Círculos de las islas.
   * @param water - Altura del agua donde flotan (el mar o un foso).
   * @param size - Tamaño relativo de los patos.
   */
  constructor(
    islands: IslandCircle[],
    private readonly water = WATER_Y,
    size = 1,
  ) {
    const rng = new SeededRandom("patos");
    islands.forEach((island, index) => {
      const angle = rng.between(0, Math.PI * 2);
      const distance = island.radius + rng.between(1.4, 2.4);
      const speed = rng.between(0.025, 0.045) * (index % 2 === 0 ? 1 : -1);
      for (let duck = 0; duck < DUCKS_PER_ISLAND; duck += 1) {
        const mother = duck === 0;
        const group = this.duck(mother ? 0xfffaf2 : 0xffe35c, (mother ? 0.32 : 0.2) * size);
        this.group.add(group);
        this.ducks.push({ group, island, distance, angle: angle - Math.sign(speed) * duck * (0.5 / distance) * 1.4, speed, phase: rng.between(0, 6) });
      }
    });
    this.update(0, 0, false);
  }

  /**
   * Hace nadar a los patos en círculo alrededor de su isla, meciéndose.
   *
   * @param elapsed - Segundos transcurridos.
   * @param _night - Qué tan de noche es (no cambia nada).
   * @param moving - Si es `false` quedan quietos (movimiento reducido).
   */
  update(elapsed: number, _night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.ducks.forEach((duck) => {
      const angle = duck.angle + t * duck.speed;
      duck.group.position.set(duck.island.x + Math.cos(angle) * duck.distance, this.water + Math.sin(t * 2 + duck.phase) * 0.02, duck.island.z + Math.sin(angle) * duck.distance);
      duck.group.rotation.y = -angle + (duck.speed > 0 ? 0 : Math.PI);
      duck.group.rotation.z = Math.sin(t * 1.7 + duck.phase) * 0.06;
    });
  }

  private material(color: number): MeshStandardMaterial {
    const cached = this.materials.get(color);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness: 0.4, map: SurfaceTextures.clay(), bumpMap: SurfaceTextures.clay(), bumpScale: 0.2 });
    this.materials.set(color, created);
    return created;
  }

  private duck(color: number, size: number): Group {
    const duck = new Group();
    const body = new Mesh(new SphereGeometry(0.5, 16, 12), this.material(color));
    body.scale.set(0.8, 0.6, 1.1);
    body.position.y = 0.15;
    const tail = new Mesh(new ConeGeometry(0.2, 0.35, 10), this.material(color));
    tail.rotation.x = -2.2;
    tail.position.set(0, 0.35, -0.5);
    const head = new Mesh(new SphereGeometry(0.28, 16, 12), this.material(color));
    head.position.set(0, 0.62, 0.32);
    const beak = new Mesh(new SphereGeometry(0.13, 12, 8), this.material(0xff9a3b));
    beak.scale.set(1, 0.45, 1.3);
    beak.position.set(0, 0.56, 0.6);
    duck.add(body, tail, head, beak);
    [-1, 1].forEach((side) => {
      const eye = new Mesh(new SphereGeometry(0.045, 8, 6), this.material(0x2a2233));
      eye.position.set(side * 0.14, 0.7, 0.53);
      const wing = new Mesh(new SphereGeometry(0.25, 12, 8), this.material(color));
      wing.scale.set(0.3, 0.6, 1);
      wing.position.set(side * 0.38, 0.25, -0.02);
      duck.add(eye, wing);
    });
    duck.scale.setScalar(size);
    return duck;
  }
}
