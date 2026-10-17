import { Color, InstancedMesh, MeshStandardMaterial, Object3D, Vector3 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { SeededRandom } from "../neighborhood/SeededRandom.js";

interface Piece {
  position: Vector3;
  velocity: Vector3;
  spin: Vector3;
  life: number;
}

const COUNT = 320;
const COLORS = [0xff8fb7, 0xffe35c, 0x7fd0ea, 0xb89cf2, 0x86d6a8, 0xffb066, 0xffffff] as const;

export class Confetti {
  readonly mesh: InstancedMesh;
  private readonly pieces: Piece[] = Array.from({ length: COUNT }, () => ({ position: new Vector3(), velocity: new Vector3(), spin: new Vector3(), life: 0 }));
  private readonly holder = new Object3D();
  private readonly rng = new SeededRandom("confeti");
  private cursor = 0;
  private active = false;

  constructor() {
    this.mesh = new InstancedMesh(new RoundedBoxGeometry(0.2, 0.04, 0.12, 2, 0.015), new MeshStandardMaterial({ roughness: 0.6 }), COUNT);
    this.mesh.frustumCulled = false;
    for (let index = 0; index < COUNT; index += 1) {
      this.mesh.setColorAt(index, new Color(this.rng.pick(COLORS)));
      this.hide(index);
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  /**
   * Lanza una ráfaga de confeti de colores desde un punto.
   *
   * @param origin - De dónde sale el confeti.
   * @param amount - Cuántos papelitos.
   */
  burst(origin: Vector3, amount = 90): void {
    for (let index = 0; index < amount; index += 1) {
      const piece = this.pieces[this.cursor % COUNT] as Piece;
      this.cursor += 1;
      piece.position.copy(origin);
      piece.velocity.set(this.rng.between(-5, 5), this.rng.between(3, 9), this.rng.between(-3, 3));
      piece.spin.set(this.rng.between(-8, 8), this.rng.between(-8, 8), this.rng.between(-8, 8));
      piece.life = this.rng.between(1.4, 2.6);
    }
    this.active = true;
  }

  /**
   * Hace caer y girar los papelitos hasta que se acaba su tiempo.
   *
   * @param dt - Segundos desde el cuadro anterior.
   */
  update(dt: number): void {
    if (!this.active) return;
    let alive = false;
    this.pieces.forEach((piece, index) => {
      if (piece.life <= 0) return;
      alive = true;
      piece.life -= dt;
      if (piece.life <= 0) {
        this.hide(index);
        return;
      }
      piece.velocity.y -= 9 * dt;
      piece.velocity.multiplyScalar(1 - dt * 0.4);
      piece.position.addScaledVector(piece.velocity, dt);
      this.holder.position.copy(piece.position);
      this.holder.rotation.set(piece.life * piece.spin.x, piece.life * piece.spin.y, piece.life * piece.spin.z);
      this.holder.scale.setScalar(Math.min(piece.life * 2, 1));
      this.holder.updateMatrix();
      this.mesh.setMatrixAt(index, this.holder.matrix);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
    this.active = alive;
  }

  private hide(index: number): void {
    this.holder.scale.setScalar(0);
    this.holder.updateMatrix();
    this.mesh.setMatrixAt(index, this.holder.matrix);
  }
}
