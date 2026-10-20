import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, Vector3 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { CivicParts } from "./CivicParts.js";
import { CraftMaterials } from "./CraftMaterials.js";
import type { RiderFactory, TravelLink } from "./IslandLinks.js";

const UP = new Vector3(0, 1, 0);

export class BalloonHop {
  /**
   * Globo viajero que va y viene entre dos islas en un arco alto: canasta de mimbre con un osito que saluda, cuerdas,
   * lona de rayas y un quemador que brilla de noche. Despega y aterriza junto a la orilla de cada isla.
   *
   * @param from - Punto de despegue.
   * @param to - Punto de llegada.
   * @param rider - Pide un osito viajero, o `null` si ya no quedan.
   * @param stripes - Colores CSS de la lona.
   * @returns El globo con su luz y su animación.
   */
  build(from: Vector3, to: Vector3, rider: RiderFactory, stripes: readonly string[]): TravelLink {
    const group = new Group();
    const burner = CraftMaterials.lantern();
    const balloon = new Group();
    const canopy = new Mesh(new SphereGeometry(0.75, 26, 18), new MeshStandardMaterial({ map: CivicParts.awning(stripes), roughness: 0.6 }));
    canopy.scale.set(1, 1.15, 1);
    canopy.position.y = 1.55;
    const basket = new Mesh(new RoundedBoxGeometry(0.42, 0.3, 0.42, 2, 0.07), CraftMaterials.wood(0xc4905a));
    basket.position.y = 0.15;
    const flame = new Mesh(new SphereGeometry(0.08, 10, 8), burner);
    flame.position.y = 0.72;
    balloon.add(canopy, basket, flame);
    [-1, 1].forEach((x) =>
      [-1, 1].forEach((z) => {
        const start = new Vector3(x * 0.18, 0.28, z * 0.18);
        const end = new Vector3(x * 0.45, 1.05, z * 0.45);
        const span = end.clone().sub(start);
        const rope = new Mesh(new CylinderGeometry(0.01, 0.01, span.length(), 4), CraftMaterials.rope());
        rope.position.copy(start).addScaledVector(span, 0.5);
        rope.quaternion.setFromUnitVectors(UP, span.normalize());
        balloon.add(rope);
      }),
    );
    const bear = rider("sentado", 0.16);
    if (bear) {
      bear.group.position.y = 0.12;
      balloon.add(bear.group);
    }
    balloon.traverse((part) => {
      part.castShadow = true;
    });
    group.add(balloon);
    const update = (elapsed: number, _night: number, moving: boolean): void => {
      const t = moving ? elapsed : 0;
      const u = 0.5 - 0.5 * Math.cos(t * 0.07);
      balloon.position.lerpVectors(from, to, u);
      balloon.position.y = from.y + 0.2 + Math.sin(u * Math.PI) * 4.5 + Math.sin(t * 0.9) * 0.08;
      balloon.rotation.y = t * 0.1;
      bear?.update(elapsed, moving);
    };
    update(0, 0, false);
    return { group, lamps: [burner], update, trail: () => balloon.position.clone().add(new Vector3(0, 0.1, 0)) };
  }
}
