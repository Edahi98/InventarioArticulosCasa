import { CapsuleGeometry, DoubleSide, Group, Mesh, MeshStandardMaterial, Shape, ShapeGeometry } from "three";
import { BUTTERFLY_COLORS, BUTTERFLY_COUNT } from "../../../constantes/barrio_constantes.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { SeededRandom } from "./SeededRandom.js";
import type { IslandCircle } from "./Sparkles.js";

interface Butterfly {
  group: Group;
  wings: [Group, Group];
  x: number;
  z: number;
  reach: number;
  height: number;
  phase: number;
  speed: number;
}

export class Butterflies {
  readonly group = new Group();
  private readonly flock: Butterfly[] = [];

  /**
   * Mariposas de alas de lunares que revolotean en ochos sobre las flores de las islas; de noche se van a dormir.
   *
   * @param islands - Círculos de las islas donde vuelan.
   */
  constructor(islands: IslandCircle[]) {
    const rng = new SeededRandom("mariposas");
    const wing = Butterflies.wingShape();
    const body = new CapsuleGeometry(0.025, 0.12, 3, 6);
    const bodyMaterial = new MeshStandardMaterial({ color: 0x3a2a40, roughness: 0.6 });
    for (let index = 0; index < BUTTERFLY_COUNT; index += 1) {
      const island = islands[index % islands.length] as IslandCircle;
      const color = BUTTERFLY_COLORS[index % BUTTERFLY_COLORS.length] as number;
      const material = new MeshStandardMaterial({ map: SurfaceTextures.spotted(color), side: DoubleSide, roughness: 0.5 });
      const group = new Group();
      const torso = new Mesh(body, bodyMaterial);
      torso.rotation.x = Math.PI / 2;
      const pivots = [-1, 1].map((side) => {
        const pivot = new Group();
        const blade = new Mesh(wing, material);
        blade.rotation.x = -Math.PI / 2;
        blade.scale.set(side * 0.18, 0.18, 0.18);
        pivot.add(blade);
        return pivot;
      }) as [Group, Group];
      group.add(torso, ...pivots);
      const angle = rng.between(0, Math.PI * 2);
      const distance = Math.sqrt(rng.next()) * island.radius * 0.8;
      this.flock.push({ group, wings: pivots, x: island.x + Math.cos(angle) * distance, z: island.z + Math.sin(angle) * distance, reach: rng.between(0.8, 1.8), height: rng.between(0.5, 1.4), phase: rng.between(0, Math.PI * 2), speed: rng.between(0.4, 0.8) });
      this.group.add(group);
    }
    this.update(0, 0, false);
  }

  /**
   * Mueve a las mariposas en ochos y les agita las alas.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` quedan quietas (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    const awake = night < 0.6;
    this.flock.forEach((butterfly) => {
      butterfly.group.visible = awake;
      const angle = t * butterfly.speed + butterfly.phase;
      const x = butterfly.x + Math.sin(angle) * butterfly.reach;
      const z = butterfly.z + Math.sin(angle * 2) * butterfly.reach * 0.5;
      butterfly.group.position.set(x, butterfly.height + Math.sin(t * 3 + butterfly.phase) * 0.12, z);
      butterfly.group.rotation.y = Math.atan2(Math.cos(angle) * butterfly.reach, Math.cos(angle * 2) * butterfly.reach);
      const flap = moving ? Math.sin(t * 14 + butterfly.phase) * 0.9 : 0.4;
      butterfly.wings[0].rotation.z = flap;
      butterfly.wings[1].rotation.z = -flap;
    });
  }

  private static wingShape(): ShapeGeometry {
    const outline = new Shape();
    outline.moveTo(0, 0);
    outline.bezierCurveTo(0.3, 0.9, 1.2, 0.9, 1.0, 0.25);
    outline.bezierCurveTo(1.1, -0.1, 0.9, -0.6, 0.45, -0.75);
    outline.bezierCurveTo(0.2, -0.8, 0.05, -0.4, 0, 0);
    return new ShapeGeometry(outline, 10);
  }
}
