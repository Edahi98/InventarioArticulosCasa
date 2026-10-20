import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  Vector3,
  type CanvasTexture,
  type Curve,
} from "three";
import { PATH_BORDER, PATH_MORTAR } from "../../../constantes/barrio_constantes.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { StonePath } from "./StonePath.js";

const PAINT = 0xfffaf2;
const SIDEWALK_WIDTH = 0.42;
const SAMPLES = 360;
const TILE = 0.7;

export class RoadBuilder {
  /**
   * Calle sinuosa de cuento: un camino de losas de colores sobre su junta, con bordillo de piedras redondas,
   * florecitas entre las piedras, una orilla de piedritas claras a cada lado y pasos de cebra en los puntos dados.
   *
   * @param curve - Curva cerrada que recorre el centro de la calle.
   * @param width - Ancho de la calle.
   * @param crossings - Posiciones (entre 0 y 1) donde hay paso de cebra.
   * @param seed - Semilla de las losas, distinta en cada isla.
   * @returns La calle.
   */
  build(curve: Curve<Vector3>, width: number, crossings: number[], seed = "camino"): Group {
    const road = new Group();
    const half = width / 2;
    road.add(
      RoadBuilder.ribbon(curve, -half - SIDEWALK_WIDTH, half + SIDEWALK_WIDTH, 0.045, PATH_BORDER, SurfaceTextures.cobble(), 0.8),
      RoadBuilder.ribbon(curve, -half, half, 0.064, PATH_MORTAR, SurfaceTextures.clay(), 0.4),
      new StonePath(seed).build(curve, width),
      ...crossings.map((at) => this.crosswalk(curve, at, width)),
    );
    return road;
  }

  /**
   * Calle de enlace abierta (sale del anillo hacia un puente): el mismo camino de losas con su junta y su orilla de
   * piedritas, un poco más alta para montarse limpia sobre la calle del anillo.
   *
   * @param curve - Curva abierta del centro de la calle.
   * @param width - Ancho de la calle.
   * @param seed - Semilla de las losas.
   * @returns La calle de enlace.
   */
  spur(curve: Curve<Vector3>, width: number, seed: string): Group {
    const road = new Group();
    const half = width / 2;
    road.add(
      RoadBuilder.ribbon(curve, -half - SIDEWALK_WIDTH, half + SIDEWALK_WIDTH, 0.047, PATH_BORDER, SurfaceTextures.cobble(), 0.8),
      RoadBuilder.ribbon(curve, -half, half, 0.0655, PATH_MORTAR, SurfaceTextures.clay(), 0.4),
      new StonePath(seed).build(curve, width),
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
    const u = at >= 0 && at <= 1 ? at : ((at % 1) + 1) % 1;
    const point = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u);
    tangent.y = 0;
    tangent.normalize();
    return { point, tangent, normal: new Vector3(-tangent.z, 0, tangent.x) };
  }

  private static ribbon(curve: Curve<Vector3>, from: number, to: number, y: number, color: number, texture: CanvasTexture, bump: number): Mesh {
    const positions: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    const stretch = curve.getLength() / TILE;
    for (let index = 0; index <= SAMPLES; index += 1) {
      const { point, normal } = RoadBuilder.frame(curve, index / SAMPLES);
      positions.push(point.x + normal.x * from, y, point.z + normal.z * from, point.x + normal.x * to, y, point.z + normal.z * to);
      uvs.push(0, (index / SAMPLES) * stretch, (to - from) / TILE, (index / SAMPLES) * stretch);
      if (index < SAMPLES) {
        const base = index * 2;
        indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new Mesh(geometry, new MeshStandardMaterial({ color, roughness: 0.85, side: DoubleSide, map: texture, bumpMap: texture, bumpScale: bump }));
    mesh.receiveShadow = true;
    return mesh;
  }

  private crosswalk(curve: Curve<Vector3>, at: number, width: number): Group {
    const { point, tangent, normal } = RoadBuilder.frame(curve, at);
    const crosswalk = new Group();
    const bars = Math.floor((width - 0.2) / 0.24);
    const yaw = Math.atan2(tangent.x, tangent.z);
    const paint = new MeshStandardMaterial({ color: PAINT, roughness: 0.7, map: SurfaceTextures.flagstone() });
    for (let index = 0; index < bars; index += 1) {
      const offset = (index - (bars - 1) / 2) * 0.24;
      const bar = new Mesh(new RoundedBoxGeometry(0.11, 0.03, 0.7, 2, 0.012), paint);
      bar.position.set(point.x + normal.x * offset, 0.09, point.z + normal.z * offset);
      bar.rotation.y = yaw;
      bar.receiveShadow = true;
      crosswalk.add(bar);
    }
    return crosswalk;
  }
}
