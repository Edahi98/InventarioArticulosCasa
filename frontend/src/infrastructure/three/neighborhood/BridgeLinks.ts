import { Group, Vector3, type MeshStandardMaterial } from "three";
import { OUTPOST_ANGLE } from "../../../constantes/barrio_constantes.js";
import type { WalkGap, WalkZone } from "../walk/WalkArea.js";
import { ArchBridge, DECK_TOP, DECK_WIDTH } from "./ArchBridge.js";
import { Outpost, OUTPOST_RADIUS, type OutpostKind } from "./Outpost.js";
import type { TreeFactory } from "./TreeFactory.js";

export interface BridgeNetwork {
  group: Group;
  lamps: MeshStandardMaterial[];
  zones: WalkZone[];
  gaps: WalkGap[];
}

const KINDS: OutpostKind[] = ["faro", "picnic", "fuente"];
const SPAN = 7.5;
const OVERLAP = 0.5;

export class BridgeLinks {
  /**
   * @param trees - Fábrica de árboles compartida.
   */
  constructor(private readonly trees: TreeFactory) {}

  /**
   * Une la isla principal con tres islitas mediante puentes de arco: una con un faro, otra con un picnic y otra con
   * una fuente. Cada puente nace en el borde de la isla y llega al borde de la islita, a la altura de la calzada.
   *
   * @param radius - Radio de la isla principal.
   * @param cx - Centro de la isla principal en x.
   * @param cz - Centro de la isla principal en z.
   * @returns Las islitas y puentes, los vidrios que brillan de noche, las zonas caminables y las aberturas por donde
   * se pasa del muro de la orilla al puente.
   */
  build(radius: number, cx = 0, cz = 0): BridgeNetwork {
    const group = new Group();
    const lamps: MeshStandardMaterial[] = [];
    const zones: WalkZone[] = [{ x: cx, z: cz, radius }];
    const gaps: WalkGap[] = [];
    const outpost = new Outpost(this.trees);
    const bridge = new ArchBridge();
    const origin = new Vector3(cx, 0, cz);

    KINDS.forEach((kind, index) => {
      const angle = (index / KINDS.length) * Math.PI * 2 + OUTPOST_ANGLE;
      const direction = new Vector3(Math.cos(angle), 0, Math.sin(angle));
      const edge = radius - OVERLAP;
      const centerDistance = radius + SPAN + OUTPOST_RADIUS - OVERLAP * 2;
      const center = direction.clone().multiplyScalar(centerDistance).add(origin);
      const built = outpost.build(kind, `isla-${kind}`);
      built.group.position.copy(center);
      if (built.glow) lamps.push(built.glow);
      const start = direction.clone().multiplyScalar(edge).add(origin).setY(DECK_TOP);
      const finish = direction.clone().multiplyScalar(centerDistance - OUTPOST_RADIUS + OVERLAP).add(origin).setY(DECK_TOP);
      const link = bridge.build(start, finish);
      lamps.push(...link.lamps);
      group.add(built.group, link.group);
      zones.push({ x: center.x, z: center.z, radius: OUTPOST_RADIUS });
      const half = DECK_WIDTH / 2 + 0.45;
      gaps.push(
        { x: cx + direction.x * radius, z: cz + direction.z * radius, half },
        { x: cx + direction.x * (centerDistance - OUTPOST_RADIUS), z: cz + direction.z * (centerDistance - OUTPOST_RADIUS), half },
      );
    });
    return { group, lamps, zones, gaps };
  }
}
