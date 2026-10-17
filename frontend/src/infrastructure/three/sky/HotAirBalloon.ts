import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, ConeGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { BearBuilder } from "../BearBuilder.js";
import { GuardianBear } from "../neighborhood/GuardianBear.js";
import type { ClayMaterials } from "../park/ClayMaterials.js";
import type { Interactive } from "../park/ParkInteraction.js";

const SEGMENTS = 8;

export class HotAirBalloon {
  readonly group = new Group();
  readonly interactives: Interactive[];
  private readonly pilot: GuardianBear;
  private readonly flame: Mesh;
  private readonly flameMaterial = new MeshStandardMaterial({ color: 0xffb347, emissive: 0xff7a1a, emissiveIntensity: 1.2 });
  private hitAt = -10;

  /**
   * Globo aerostático de gajos de colores con un osito piloto en la canasta, una llamita que parpadea y un
   * balanceo suave. Al tocarlo sube de golpe y el piloto saluda.
   *
   * @param id - Identificador del juguete.
   * @param colors - Colores de los gajos, que se repiten alrededor del globo.
   * @param bears - Constructor de ositos compartido.
   * @param clay - Materiales compartidos.
   * @param seed - Decide cuál osito pilota.
   * @param phase - Desfase del balanceo.
   */
  constructor(
    id: string,
    colors: readonly number[],
    bears: BearBuilder,
    clay: ClayMaterials,
    seed: number,
    private readonly phase: number,
  ) {
    for (let index = 0; index < SEGMENTS; index += 1) {
      const gore = new Mesh(
        new SphereGeometry(1.6, 10, 18, (index / SEGMENTS) * Math.PI * 2, (Math.PI * 2) / SEGMENTS + 0.01),
        clay.get(colors[index % colors.length] as number),
      );
      gore.scale.y = 1.15;
      gore.position.y = 2.6;
      this.group.add(gore);
    }
    const skirt = new Mesh(new CylinderGeometry(0.55, 0.85, 0.7, 16), clay.get(0xfff0d6));
    skirt.position.y = 0.95;
    const basket = new Mesh(new RoundedBoxGeometry(1.2, 0.8, 1.2, 3, 0.18), clay.get(0xc4805a));
    basket.position.y = -0.1;
    this.flame = new Mesh(new ConeGeometry(0.17, 0.5, 8), this.flameMaterial);
    this.flame.position.y = 0.5;
    this.group.add(skirt, basket, this.flame);
    [-1, 1].forEach((x) => [-1, 1].forEach((z) => {
      const rope = new Mesh(new CylinderGeometry(0.02, 0.02, 1.15, 5), clay.get(0x6b4a6a));
      rope.position.set(x * 0.5, 0.55, z * 0.5);
      rope.rotation.set(z * 0.38, 0, -x * 0.38);
      this.group.add(rope);
    }));
    this.pilot = new GuardianBear(bears, seed, 0.3, false);
    this.pilot.group.position.set(0, 0.25, 0);
    this.group.add(this.pilot.group);
    this.group.userData.interactiveId = id;
    this.interactives = [
      {
        id,
        object: this.group,
        hit: (now) => {
          this.hitAt = now;
          this.pilot.poke(now);
        },
      },
    ];
  }

  /**
   * Hace flotar el globo, parpadear la llama y animar al piloto.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    const lift = Math.max(0, 1 - (elapsed - this.hitAt) / 1.6);
    this.group.position.y = (this.group.userData.baseY as number) + Math.sin(t * 0.5 + this.phase) * 0.55 + lift * lift * 2.4;
    this.group.rotation.z = Math.sin(t * 0.4 + this.phase) * 0.05;
    this.group.rotation.y = Math.sin(t * 0.2 + this.phase) * 0.35;
    this.flame.scale.set(1, 1 + Math.sin(t * 14 + this.phase) * 0.25 + lift * 0.6, 1);
    this.flameMaterial.emissiveIntensity = 1.1 + night * 0.9;
    this.pilot.update(elapsed, 0, moving);
  }

  /**
   * Coloca el globo y recuerda su altura de reposo.
   *
   * @param x - Posición horizontal.
   * @param y - Altura de reposo.
   * @param z - Profundidad.
   * @param scale - Tamaño.
   */
  place(x: number, y: number, z: number, scale: number): void {
    this.group.position.set(x, y, z);
    this.group.userData.baseY = y;
    this.group.scale.setScalar(scale);
  }
}
