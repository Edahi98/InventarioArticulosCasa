import {
  BufferGeometry,
  CapsuleGeometry,
  DoubleSide,
  Euler,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  Vector3,
  type Curve,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const ASPHALT = 0x6b5a78;
const SIDEWALK = 0xf3dfe9;
const PAINT = 0xfffaf2;
const SIDEWALK_WIDTH = 0.42;
const SAMPLES = 360;
const UP = new Vector3(0, 1, 0);

export class RoadBuilder {
  /**
   * Calle sinuosa: cinta de asfalto con banquetas claras a los lados, rayas discontinuas al centro
   * y pasos de cebra en los puntos dados.
   *
   * @param curve - Curva cerrada que recorre el centro de la calle.
   * @param width - Ancho de la calle.
   * @param crossings - Posiciones (entre 0 y 1) donde hay paso de cebra.
   * @returns La calle.
   */
  build(curve: Curve<Vector3>, width: number, crossings: number[]): Group {
    const road = new Group();
    const half = width / 2;
    road.add(
      RoadBuilder.ribbon(curve, -half - SIDEWALK_WIDTH, half + SIDEWALK_WIDTH, 0.045, SIDEWALK),
      RoadBuilder.ribbon(curve, -half, half, 0.07, ASPHALT),
      this.dashes(curve),
      ...crossings.map((at) => this.crosswalk(curve, at, width)),
    );
    return road;
  }

  /**
   * Punto de la curva con su tangente y su normal en el plano del suelo.
   *
   * @param curve - Curva de la calle.
   * @param at - Posición entre 0 y 1.
   * @returns El punto, la tangente y la normal (+normal apunta hacia adentro del anillo).
   */
  static frame(curve: Curve<Vector3>, at: number): { point: Vector3; tangent: Vector3; normal: Vector3 } {
    const point = curve.getPointAt(((at % 1) + 1) % 1);
    const tangent = curve.getTangentAt(((at % 1) + 1) % 1);
    tangent.y = 0;
    tangent.normalize();
    return { point, tangent, normal: new Vector3(-tangent.z, 0, tangent.x) };
  }

  private static ribbon(curve: Curve<Vector3>, from: number, to: number, y: number, color: number): Mesh {
    const positions: number[] = [];
    const indices: number[] = [];
    for (let index = 0; index <= SAMPLES; index += 1) {
      const { point, normal } = RoadBuilder.frame(curve, index / SAMPLES);
      positions.push(point.x + normal.x * from, y, point.z + normal.z * from, point.x + normal.x * to, y, point.z + normal.z * to);
      if (index < SAMPLES) {
        const base = index * 2;
        indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new Mesh(geometry, new MeshStandardMaterial({ color, roughness: 0.85, side: DoubleSide }));
    mesh.receiveShadow = true;
    return mesh;
  }

  private dashes(curve: Curve<Vector3>): InstancedMesh {
    const length = curve.getLength();
    const count = Math.floor(length / 1.3);
    const dashes = new InstancedMesh(new CapsuleGeometry(0.035, 0.5, 3, 8), new MeshStandardMaterial({ color: PAINT, roughness: 0.7 }), count);
    const holder = new Object3D();
    for (let index = 0; index < count; index += 1) {
      const { point, tangent } = RoadBuilder.frame(curve, (index + 0.5) / count);
      holder.position.set(point.x, 0.085, point.z);
      holder.quaternion.setFromEuler(new Euler(Math.PI / 2, 0, 0)).premultiply(new Quaternion().setFromAxisAngle(UP, Math.atan2(tangent.x, tangent.z)));
      holder.updateMatrix();
      dashes.setMatrixAt(index, holder.matrix);
    }
    dashes.instanceMatrix.needsUpdate = true;
    return dashes;
  }

  private crosswalk(curve: Curve<Vector3>, at: number, width: number): Group {
    const { point, tangent, normal } = RoadBuilder.frame(curve, at);
    const crosswalk = new Group();
    const bars = Math.floor((width - 0.2) / 0.24);
    const yaw = Math.atan2(tangent.x, tangent.z);
    const paint = new MeshStandardMaterial({ color: PAINT, roughness: 0.7 });
    for (let index = 0; index < bars; index += 1) {
      const offset = (index - (bars - 1) / 2) * 0.24;
      const bar = new Mesh(new RoundedBoxGeometry(0.11, 0.02, 0.7, 2, 0.008), paint);
      bar.position.set(point.x + normal.x * offset, 0.088, point.z + normal.z * offset);
      bar.rotation.y = yaw;
      bar.receiveShadow = true;
      crosswalk.add(bar);
    }
    return crosswalk;
  }
}
