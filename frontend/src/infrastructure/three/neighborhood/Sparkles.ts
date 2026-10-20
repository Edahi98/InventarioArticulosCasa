import { Color, ExtrudeGeometry, Group, InstancedMesh, MeshStandardMaterial, Object3D, Shape } from "three";
import { HEART_COLORS, HEART_COUNT, SPARKLE_COLORS, SPARKLE_COUNT } from "../../../constantes/barrio_constantes.js";
import { SeededRandom } from "./SeededRandom.js";

interface Mote {
  x: number;
  y: number;
  z: number;
  size: number;
  phase: number;
  speed: number;
}

export interface IslandCircle {
  x: number;
  z: number;
  radius: number;
}

export class Sparkles {
  readonly group = new Group();
  private readonly stars: InstancedMesh;
  private readonly hearts: InstancedMesh;
  private readonly starMotes: Mote[];
  private readonly heartMotes: Mote[];
  private readonly starMaterial = new MeshStandardMaterial({ emissive: 0xfff3b0, emissiveIntensity: 0.8, roughness: 0.3, metalness: 0.1 });
  private readonly heartMaterial = new MeshStandardMaterial({ emissive: 0xff6fa5, emissiveIntensity: 0.35, roughness: 0.35 });
  private readonly holder = new Object3D();

  /**
   * Destellos mágicos sobre las islas: estrellitas de cuatro puntas que flotan, giran y titilan (de noche brillan
   * como luciérnagas) y corazoncitos que suben y bajan despacio. Van en dos mallas instanciadas.
   *
   * @param islands - Círculos de las islas donde se reparten.
   */
  constructor(islands: IslandCircle[]) {
    const rng = new SeededRandom("destellos");
    const spot = (low: number, high: number): Mote => {
      const island = rng.pick(islands);
      const angle = rng.between(0, Math.PI * 2);
      const distance = Math.sqrt(rng.next()) * island.radius * 0.95;
      return { x: island.x + Math.cos(angle) * distance, y: rng.between(low, high), z: island.z + Math.sin(angle) * distance, size: rng.between(0.06, 0.13), phase: rng.between(0, Math.PI * 2), speed: rng.between(0.6, 1.6) };
    };
    this.starMotes = Array.from({ length: SPARKLE_COUNT }, () => spot(0.6, 4.2));
    this.heartMotes = Array.from({ length: HEART_COUNT }, () => ({ ...spot(2, 5), size: rng.between(0.12, 0.2) }));
    this.stars = new InstancedMesh(Sparkles.star(), this.starMaterial, this.starMotes.length);
    this.hearts = new InstancedMesh(Sparkles.heart(), this.heartMaterial, this.heartMotes.length);
    this.starMotes.forEach((_, index) => this.stars.setColorAt(index, new Color(rng.pick(SPARKLE_COLORS))));
    this.heartMotes.forEach((_, index) => this.hearts.setColorAt(index, new Color(rng.pick(HEART_COLORS))));
    [this.stars, this.hearts].forEach((mesh) => {
      mesh.frustumCulled = false;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
    this.group.add(this.stars, this.hearts);
    this.update(0, 0, false);
  }

  /**
   * Hace flotar, girar y titilar a los destellos; de noche brillan más.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` quedan quietos (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.starMaterial.emissiveIntensity = 0.6 + night * 1.6;
    this.starMotes.forEach((mote, index) => {
      const twinkle = 0.55 + 0.45 * Math.sin(t * 3 * mote.speed + mote.phase);
      this.holder.position.set(mote.x + Math.sin(t * 0.4 + mote.phase) * 0.3, mote.y + Math.sin(t * mote.speed + mote.phase) * 0.25, mote.z + Math.cos(t * 0.3 + mote.phase) * 0.3);
      this.holder.rotation.set(0, t * mote.speed + mote.phase, Math.sin(mote.phase) * 0.3);
      this.holder.scale.setScalar(mote.size * twinkle);
      this.holder.updateMatrix();
      this.stars.setMatrixAt(index, this.holder.matrix);
    });
    this.heartMotes.forEach((mote, index) => {
      this.holder.position.set(mote.x, mote.y + Math.sin(t * 0.7 * mote.speed + mote.phase) * 0.4, mote.z);
      this.holder.rotation.set(0, Math.sin(t * 0.8 + mote.phase) * 0.6, 0);
      this.holder.scale.setScalar(mote.size);
      this.holder.updateMatrix();
      this.hearts.setMatrixAt(index, this.holder.matrix);
    });
    this.stars.instanceMatrix.needsUpdate = true;
    this.hearts.instanceMatrix.needsUpdate = true;
  }

  private static star(): ExtrudeGeometry {
    const outline = new Shape();
    for (let point = 0; point < 8; point += 1) {
      const radius = point % 2 === 0 ? 1 : 0.28;
      const angle = (point / 8) * Math.PI * 2 + Math.PI / 2;
      if (point === 0) outline.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      else outline.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    outline.closePath();
    const geometry = new ExtrudeGeometry(outline, { depth: 0.12, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2 });
    geometry.center();
    return geometry;
  }

  private static heart(): ExtrudeGeometry {
    const outline = new Shape();
    outline.moveTo(0, 0.35);
    outline.bezierCurveTo(0, 0.6, -0.5, 0.75, -0.75, 0.4);
    outline.bezierCurveTo(-1, 0, -0.4, -0.45, 0, -0.85);
    outline.bezierCurveTo(0.4, -0.45, 1, 0, 0.75, 0.4);
    outline.bezierCurveTo(0.5, 0.75, 0, 0.6, 0, 0.35);
    const geometry = new ExtrudeGeometry(outline, { depth: 0.25, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 2, curveSegments: 6 });
    geometry.center();
    return geometry;
  }
}
