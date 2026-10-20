import { ConeGeometry, CylinderGeometry, Group, Mesh, SphereGeometry, TorusGeometry } from "three";
import { ARCHERS_MAX, CASTLE_WALL_RADIUS, KNIGHTS_MAX } from "../../../constantes/barrio_constantes.js";
import type { BearTone } from "../../../core/domain/inventoryBear.js";
import { CraftMaterials } from "./CraftMaterials.js";
import { VehicleDriver } from "./VehicleDriver.js";

interface Guard {
  group: Group;
  from: number;
  to: number;
  side: number;
  speed: number;
  phase: number;
}

const TONES: BearTone[] = ["sky", "rose", "sun", "lilac"];
const STEEL = 0xc9d1d9;

export class KnightPatrol {
  readonly group = new Group();
  private readonly knights: Guard[] = [];
  private readonly archers: { group: Group; phase: number }[] = [];

  /**
   * Guardia del castillo: caballeros-oso con armadura, yelmo con penacho, escudo y lanza que patrullan de ida y vuelta
   * entre el portón y el puente de la isla, y arqueros con su arco sobre las almenas que se asoman. Coordenadas locales
   * de la isla del castillo, con el portón hacia +x.
   *
   * @param rim - Distancia del centro al borde donde llega el puente.
   */
  constructor(rim: number) {
    for (let index = 0; index < KNIGHTS_MAX; index += 1) {
      const knight = this.knight(index);
      this.group.add(knight);
      this.knights.push({ group: knight, from: CASTLE_WALL_RADIUS + 2.4, to: rim - 1.4, side: index % 2 === 0 ? 0.55 : -0.55, speed: 0.12 + index * 0.02, phase: index * 1.6 });
    }
    for (let index = 0; index < ARCHERS_MAX; index += 1) {
      const archer = this.archer(index);
      const angle = Math.PI * (0.6 + index * 0.4);
      archer.position.set(Math.cos(angle) * (CASTLE_WALL_RADIUS - 0.05), 1.6, Math.sin(angle) * (CASTLE_WALL_RADIUS - 0.05));
      archer.rotation.y = -angle + Math.PI / 2;
      this.group.add(archer);
      this.archers.push({ group: archer, phase: index * 2.1 });
    }
    this.update(0, 0, false);
  }

  /**
   * Hace patrullar a los caballeros y asomarse a los arqueros.
   *
   * @param elapsed - Segundos transcurridos.
   * @param _night - Qué tan de noche es (no cambia nada).
   * @param moving - Si es `false` quedan quietos (movimiento reducido).
   */
  update(elapsed: number, _night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.knights.forEach((guard) => {
      const wave = t * guard.speed + guard.phase;
      const u = 0.5 - 0.5 * Math.cos(wave);
      guard.group.position.set(guard.from + (guard.to - guard.from) * u, 0.06 + Math.abs(Math.sin(t * 6 + guard.phase)) * 0.02, guard.side);
      guard.group.rotation.y = Math.sin(wave) >= 0 ? Math.PI / 2 : -Math.PI / 2;
    });
    this.archers.forEach((archer) => {
      archer.group.position.y = 1.6 + Math.max(0, Math.sin(t * 0.8 + archer.phase)) * 0.08;
    });
  }

  private knight(index: number): Group {
    const bear = VehicleDriver.standing(TONES[index % TONES.length] as BearTone, "ninguno", 0.13);
    const steel = CraftMaterials.paint(STEEL);
    const helmet = new Mesh(new SphereGeometry(0.64, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), steel);
    helmet.position.set(0, 1.12, 0);
    const plume = new Mesh(new ConeGeometry(0.18, 0.6, 8), CraftMaterials.paint(index % 2 === 0 ? 0xe8402d : 0x3b6bd8));
    plume.position.set(0, 1.85, -0.1);
    const armor = new Mesh(new SphereGeometry(0.84, 16, 12), steel);
    armor.scale.set(1.02, 1.05, 0.95);
    const shield = new Mesh(new CylinderGeometry(0.5, 0.5, 0.08, 3), CraftMaterials.paint(index % 2 === 0 ? 0xe8402d : 0x3b6bd8));
    shield.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    shield.position.set(-0.85, 0.1, 0.3);
    const lance = new Mesh(new ConeGeometry(0.08, 2.6, 8), CraftMaterials.wood(0xd29a6a));
    lance.position.set(0.8, 0.6, 0.4);
    const root = bear.group.children[0];
    root?.add(helmet, plume, armor, shield, lance);
    return bear.group;
  }

  private archer(index: number): Group {
    const bear = VehicleDriver.standing(TONES[(index + 2) % TONES.length] as BearTone, "gorra", 0.1);
    const bow = new Mesh(new TorusGeometry(0.6, 0.05, 6, 16, Math.PI), CraftMaterials.wood(0x8a5a42));
    bow.rotation.set(0, Math.PI / 2, Math.PI / 2);
    bow.position.set(0.7, 0.4, 0.4);
    bear.group.children[0]?.add(bow);
    return bear.group;
  }
}
