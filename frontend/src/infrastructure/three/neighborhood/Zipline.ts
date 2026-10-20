import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, TorusGeometry, Vector3 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Solid } from "../walk/Solid.js";
import { CraftMaterials } from "./CraftMaterials.js";
import type { RiderFactory, TravelLink } from "./IslandLinks.js";

const HIGH = 3.4;
const LOW = 1.6;
const DROP = 0.55;
const UP = new Vector3(0, 1, 0);

export class Zipline {
  /**
   * Tirolesa entre dos islas: una torre alta de troncos con plataforma, barandal y bandera en la salida, un poste
   * bajo con llanta de llegada, el cable tenso y una polea de la que cuelga un osito con los brazos arriba que se
   * desliza cuesta abajo y regresa jalado despacito. Las torres son sólidas.
   *
   * @param from - Base de la torre alta.
   * @param to - Base del poste de llegada.
   * @param rider - Pide un osito viajero, o `null` si ya no quedan.
   * @returns La tirolesa con su animación.
   */
  build(from: Vector3, to: Vector3, rider: RiderFactory): TravelLink {
    const group = new Group();
    const lamps = [CraftMaterials.lantern()];
    const start = from.clone().add(new Vector3(0, HIGH + 0.25, 0));
    const finish = to.clone().add(new Vector3(0, LOW + 0.1, 0));
    group.add(this.tower(from, HIGH, true, lamps[0] as MeshStandardMaterial), this.tower(to, LOW, false, null));
    const span = finish.clone().sub(start);
    const cable = new Mesh(new CylinderGeometry(0.018, 0.018, span.length(), 6), CraftMaterials.paint(0x3a2a40));
    cable.position.copy(start).addScaledVector(span, 0.5);
    cable.quaternion.setFromUnitVectors(UP, span.clone().normalize());
    const trolley = new Group();
    const pulley = new Mesh(new TorusGeometry(0.07, 0.025, 8, 14), CraftMaterials.paint(0xffd43b));
    const strap = new Mesh(new CylinderGeometry(0.012, 0.012, DROP, 5), CraftMaterials.rope());
    strap.position.y = -DROP / 2;
    trolley.add(pulley, strap);
    const bear = rider("colgado", 0.24);
    if (bear) {
      bear.group.position.y = -DROP - 0.62;
      trolley.add(bear.group);
    }
    if (!bear) {
      const parcel = new Mesh(new RoundedBoxGeometry(0.3, 0.24, 0.3, 2, 0.06), CraftMaterials.paint(0xb89cf2));
      parcel.position.y = -DROP - 0.12;
      trolley.add(parcel);
    }
    group.add(cable, trolley);
    const heading = Math.atan2(span.x, span.z);
    const update = (elapsed: number, _night: number, moving: boolean): void => {
      const t = moving ? elapsed : 0;
      const cycle = (t * 0.08) % 1;
      const u = cycle < 0.35 ? (cycle / 0.35) ** 1.6 : 1 - (cycle - 0.35) / 0.65;
      trolley.position.copy(start).addScaledVector(span, 0.05 + u * 0.9);
      trolley.rotation.set(0, heading, 0);
      pulley.rotation.y = Math.PI / 2;
      bear?.update(elapsed, moving);
    };
    update(0, 0, false);
    return { group, lamps, update, trail: () => trolley.position.clone() };
  }

  private tower(base: Vector3, height: number, platform: boolean, glow: MeshStandardMaterial | null): Group {
    const tower = new Group();
    const log = CraftMaterials.wood(0x9a6b52);
    [-1, 1].forEach((sx) =>
      [-1, 1].forEach((sz) => {
        const leg = new Mesh(new CylinderGeometry(0.06, 0.08, height, 8), log);
        leg.position.set(sx * 0.28, height / 2, sz * 0.28);
        tower.add(leg);
      }),
    );
    if (platform) {
      const deck = new Mesh(new RoundedBoxGeometry(0.85, 0.08, 0.85, 2, 0.03), CraftMaterials.wood(0xc4805a));
      deck.position.y = height;
      const roof = new Mesh(new CylinderGeometry(0.0, 0.6, 0.4, 4), CraftMaterials.paint(0x7ed99a));
      roof.rotation.y = Math.PI / 4;
      roof.position.y = height + 0.95;
      const pole = new Mesh(new CylinderGeometry(0.02, 0.02, 0.9, 6), log);
      pole.position.set(0.3, height + 0.45, 0.3);
      const flag = new Mesh(new RoundedBoxGeometry(0.28, 0.18, 0.02, 2, 0.008), CraftMaterials.paint(0xff6f91));
      flag.position.set(0.45, height + 0.78, 0.3);
      tower.add(deck, roof, pole, flag);
      [-1, 1].forEach((sx) =>
        [-1, 1].forEach((sz) => {
          const post = new Mesh(new CylinderGeometry(0.03, 0.03, 0.9, 6), log);
          post.position.set(sx * 0.36, height + 0.45, sz * 0.36);
          tower.add(post);
        }),
      );
      if (glow) {
        const lamp = new Mesh(new SphereGeometry(0.08, 10, 8), glow);
        lamp.position.set(-0.3, height + 0.6, 0.38);
        tower.add(lamp);
      }
    }
    if (!platform) {
      const tyre = new Mesh(new TorusGeometry(0.22, 0.08, 8, 16), CraftMaterials.paint(0x3a2a40));
      tyre.position.y = height + 0.1;
      tower.add(tyre);
    }
    tower.position.copy(base);
    tower.traverse((part) => {
      part.castShadow = true;
    });
    Solid.mark(tower, { shape: "box", size: [0.7, height, 0.7], offset: [0, height / 2, 0] });
    return tower;
  }
}
