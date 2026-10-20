import { CatmullRomCurve3, CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, TorusGeometry, TubeGeometry, Vector3 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Solid } from "../walk/Solid.js";
import { CraftMaterials } from "./CraftMaterials.js";
import type { RiderFactory, TravelLink } from "./IslandLinks.js";
import type { TravelerBear } from "./TravelerBear.js";

const TOP = 4.2;
const SAG = 0.45;
const HANG = 0.75;
const CABIN_COLORS = [0xff6f91, 0x6cc6f0] as const;

interface Cabin {
  group: Group;
  rider: TravelerBear | null;
  phase: number;
}

export class Gondola {
  /**
   * Teleférico entre dos islas: una torre de celosía en cada orilla con su rueda arriba, dos cables que se comban y
   * dos cabinas redondas de colores (con ventanas, techo y brazo colgante) que van y vienen en sentidos contrarios con
   * un osito sentado adentro saludando. Las torres son sólidas.
   *
   * @param from - Base de la primera torre.
   * @param to - Base de la segunda torre.
   * @param rider - Pide un osito viajero, o `null` si ya no quedan.
   * @returns El teleférico con sus luces y su animación.
   */
  build(from: Vector3, to: Vector3, rider: RiderFactory): TravelLink {
    const group = new Group();
    const lamps = [CraftMaterials.lantern(), CraftMaterials.lantern()];
    group.add(this.tower(from, lamps[0] as MeshStandardMaterial), this.tower(to, lamps[1] as MeshStandardMaterial));
    const cable = (offset: number): CatmullRomCurve3 => {
      const side = new Vector3(-(to.z - from.z), 0, to.x - from.x).normalize().multiplyScalar(offset);
      return new CatmullRomCurve3(Array.from({ length: 11 }, (_, index) => Gondola.cablePoint(from, to, index / 10).add(side)));
    };
    group.add(new Mesh(new TubeGeometry(cable(0), 40, 0.025, 6), CraftMaterials.paint(0x3a2a40)), new Mesh(new TubeGeometry(cable(0.22), 40, 0.02, 6), CraftMaterials.paint(0x3a2a40)));
    const cabins: Cabin[] = CABIN_COLORS.map((color, index) => {
      const bear = rider("sentado", 0.17);
      const cabin = this.cabin(color, bear);
      group.add(cabin);
      return { group: cabin, rider: bear, phase: index * Math.PI };
    });
    const heading = Math.atan2(to.x - from.x, to.z - from.z);
    const update = (elapsed: number, _night: number, moving: boolean): void => {
      const t = moving ? elapsed : 0;
      cabins.forEach((cabin) => {
        const u = 0.08 + 0.84 * (0.5 + 0.5 * Math.sin(t * 0.12 + cabin.phase));
        const point = Gondola.cablePoint(from, to, u);
        cabin.group.position.set(point.x, point.y - HANG, point.z);
        cabin.group.rotation.set(Math.cos(t * 0.12 + cabin.phase) * 0.05, heading, 0);
        cabin.rider?.update(elapsed, moving);
      });
    };
    update(0, 0, false);
    return { group, lamps, update };
  }

  private static cablePoint(from: Vector3, to: Vector3, u: number): Vector3 {
    return new Vector3(from.x + (to.x - from.x) * u, from.y + TOP - SAG * (1 - (2 * u - 1) ** 2), from.z + (to.z - from.z) * u);
  }

  private tower(base: Vector3, glow: MeshStandardMaterial): Group {
    const tower = new Group();
    const steel = CraftMaterials.paint(0xfffaf2);
    [-1, 1].forEach((sx) =>
      [-1, 1].forEach((sz) => {
        const leg = new Mesh(new CylinderGeometry(0.04, 0.06, TOP + 0.1, 8), steel);
        leg.position.set(sx * 0.22, TOP / 2, sz * 0.22);
        leg.rotation.set(sz * 0.06, 0, -sx * 0.06);
        tower.add(leg);
      }),
    );
    [1, 2, 3].forEach((level) => {
      const ring = new Mesh(new TorusGeometry(0.28 - level * 0.025, 0.025, 6, 4), CraftMaterials.paint(0xff6f91));
      ring.rotation.set(Math.PI / 2, 0, Math.PI / 4);
      ring.position.y = level * 1.05;
      tower.add(ring);
    });
    const head = new Mesh(new RoundedBoxGeometry(0.5, 0.3, 0.6, 3, 0.1), CraftMaterials.paint(0xff6f91));
    head.position.y = TOP + 0.05;
    const wheel = new Mesh(new TorusGeometry(0.22, 0.04, 8, 20), CraftMaterials.paint(0x3a2a40));
    wheel.position.y = TOP + 0.05;
    wheel.rotation.y = Math.PI / 2;
    const lamp = new Mesh(new SphereGeometry(0.08, 10, 8), glow);
    lamp.position.y = TOP + 0.28;
    tower.add(head, wheel, lamp);
    tower.position.copy(base);
    tower.traverse((part) => {
      part.castShadow = true;
    });
    Solid.mark(tower, { shape: "box", size: [0.6, TOP, 0.6], offset: [0, TOP / 2, 0] });
    return tower;
  }

  private cabin(color: number, rider: TravelerBear | null): Group {
    const cabin = new Group();
    const shell = CraftMaterials.paint(color);
    const glass = new MeshStandardMaterial({ color: 0xcfe6ee, roughness: 0.15, transparent: true, opacity: 0.4, depthWrite: false });
    const floor = new Mesh(new RoundedBoxGeometry(0.62, 0.12, 0.62, 3, 0.05), shell);
    floor.position.y = -0.36;
    const windows = new Mesh(new RoundedBoxGeometry(0.6, 0.36, 0.6, 3, 0.12), glass);
    windows.position.y = -0.12;
    const roof = new Mesh(new SphereGeometry(0.36, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), shell);
    roof.scale.set(1, 0.5, 1);
    roof.position.y = 0.06;
    const arm = new Mesh(new CylinderGeometry(0.025, 0.025, HANG - 0.1, 6), CraftMaterials.paint(0x3a2a40));
    arm.position.y = HANG / 2;
    const grip = new Mesh(new SphereGeometry(0.07, 10, 8), CraftMaterials.paint(0x3a2a40));
    grip.position.y = HANG - 0.05;
    cabin.add(floor, windows, roof, arm, grip);
    if (rider) {
      rider.group.position.set(0, -0.3, 0);
      cabin.add(rider.group);
    }
    return cabin;
  }
}
