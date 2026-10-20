import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, Vector3 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { CraftMaterials } from "./CraftMaterials.js";
import type { RiderFactory, TravelLink } from "./IslandLinks.js";

const WATER = -1.33;
const ROPE_Y = WATER + 0.55;
const UP = new Vector3(0, 1, 0);

export class RaftFerry {
  /**
   * Transbordador de balsa con cuerda: dos muelles con pilotes y farol al pie de cada orilla, una cuerda tendida sobre
   * el agua entre ellos y una balsa de troncos amarrados con banderín, salvavidas y un osito sentado que la jala de un
   * lado a otro, meciéndose con las olas.
   *
   * @param from - Punto del agua junto a la primera orilla.
   * @param to - Punto del agua junto a la segunda orilla.
   * @param rider - Pide un osito viajero, o `null` si ya no quedan.
   * @returns El transbordador con sus luces y su animación.
   */
  build(from: Vector3, to: Vector3, rider: RiderFactory): TravelLink {
    const group = new Group();
    const lamps = [CraftMaterials.lantern(), CraftMaterials.lantern()];
    const a = new Vector3(from.x, ROPE_Y, from.z);
    const b = new Vector3(to.x, ROPE_Y, to.z);
    group.add(this.dock(a, lamps[0] as MeshStandardMaterial), this.dock(b, lamps[1] as MeshStandardMaterial));
    const span = b.clone().sub(a);
    const rope = new Mesh(new CylinderGeometry(0.015, 0.015, span.length(), 5), CraftMaterials.rope());
    rope.position.copy(a).addScaledVector(span, 0.5);
    rope.quaternion.setFromUnitVectors(UP, span.clone().normalize());
    group.add(rope);
    const raft = this.raft();
    const bear = rider("sentado", 0.22);
    if (bear) {
      bear.group.position.set(-0.15, 0.08, 0);
      bear.group.rotation.y = Math.PI / 2;
      raft.add(bear.group);
    }
    group.add(raft);
    const heading = Math.atan2(span.x, span.z);
    const update = (elapsed: number, _night: number, moving: boolean): void => {
      const t = moving ? elapsed : 0;
      const u = 0.12 + 0.76 * (0.5 - 0.5 * Math.cos(t * 0.15));
      raft.position.copy(a).addScaledVector(span, u).setY(WATER + Math.sin(t * 1.8) * 0.025);
      raft.rotation.set(Math.sin(t * 1.3) * 0.04, heading - Math.PI / 2, Math.sin(t * 1.1) * 0.04);
      bear?.update(elapsed, moving);
    };
    update(0, 0, false);
    return { group, lamps, update };
  }

  private dock(at: Vector3, glow: MeshStandardMaterial): Group {
    const dock = new Group();
    const deck = new Mesh(new RoundedBoxGeometry(0.9, 0.08, 0.9, 2, 0.03), CraftMaterials.wood(0xc4805a));
    deck.position.y = WATER + 0.25;
    dock.add(deck);
    [-1, 1].forEach((sx) =>
      [-1, 1].forEach((sz) => {
        const pile = new Mesh(new CylinderGeometry(0.06, 0.07, 0.9, 8), CraftMaterials.wood(0x8a5a42));
        pile.position.set(sx * 0.38, WATER + 0.3, sz * 0.38);
        dock.add(pile);
      }),
    );
    const post = new Mesh(new CylinderGeometry(0.03, 0.03, 0.8, 6), CraftMaterials.wood(0x8a5a42));
    post.position.set(0.3, WATER + 0.7, 0.3);
    const lamp = new Mesh(new SphereGeometry(0.08, 10, 8), glow);
    lamp.position.set(0.3, WATER + 1.12, 0.3);
    dock.add(post, lamp);
    dock.position.set(at.x, 0, at.z);
    dock.traverse((part) => {
      part.castShadow = true;
    });
    return dock;
  }

  private raft(): Group {
    const raft = new Group();
    for (let index = 0; index < 5; index += 1) {
      const log = new Mesh(new CylinderGeometry(0.07, 0.07, 0.8, 10), CraftMaterials.wood(index % 2 === 0 ? 0xb98060 : 0xa87050));
      log.rotation.x = Math.PI / 2;
      log.position.set(-0.28 + index * 0.14, 0, 0);
      raft.add(log);
    }
    const mast = new Mesh(new CylinderGeometry(0.018, 0.018, 0.7, 6), CraftMaterials.wood(0x8a5a42));
    mast.position.set(0.2, 0.35, -0.25);
    const flag = new Mesh(new RoundedBoxGeometry(0.2, 0.14, 0.015, 2, 0.006), CraftMaterials.paint(0xffd84d));
    flag.position.set(0.3, 0.6, -0.25);
    const ring = new Mesh(new CylinderGeometry(0.1, 0.1, 0.05, 14, 1, true), CraftMaterials.paint(0xff4f5b));
    ring.position.set(0.22, 0.08, 0.25);
    raft.add(mast, flag, ring);
    raft.traverse((part) => {
      part.castShadow = true;
    });
    return raft;
  }
}
