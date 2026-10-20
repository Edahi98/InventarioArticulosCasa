import {
  Color,
  ExtrudeGeometry,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  Shape,
  SphereGeometry,
  type BufferGeometry,
  type Curve,
  type Vector3,
} from "three";
import {
  PATH_CURB_COLORS,
  PATH_CURB_STEP,
  PATH_JOINT_BLOOMS,
  PATH_ROW_STEP,
  PATH_STONE_COLORS,
  PATH_STONES_PER_ROW,
} from "../../../constantes/barrio_constantes.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { RoadBuilder } from "./RoadBuilder.js";
import { SeededRandom } from "./SeededRandom.js";

const VARIANTS = 4;
const STONE_BASE = 0.066;
const BLOOMS = [0xff8fb7, 0xffe35c, 0xffffff, 0xb89cf2, 0x7fd0ea] as const;

export class StonePath {
  private readonly rng: SeededRandom;
  private readonly holder = new Object3D();

  /**
   * @param seed - Semilla del azar, para que las losas de cada calle salgan siempre iguales.
   */
  constructor(seed: string) {
    this.rng = new SeededRandom(seed);
  }

  /**
   * Camino de cuento sobre la curva de la calle: losas irregulares de colores cálidos que cambian poco a poco a lo
   * largo del anillo (como un arcoíris de piedra), con bisel redondo y textura de piedra gastada; un bordillo de
   * piedras redondas a cada lado y florecitas que se asoman entre las juntas. Todo va en mallas instanciadas.
   *
   * @param curve - Curva cerrada del centro de la calle.
   * @param width - Ancho de la calle.
   * @returns El camino.
   */
  build(curve: Curve<Vector3>, width: number): Group {
    const group = new Group();
    group.add(...this.stones(curve, width), this.curbs(curve, width), ...this.blooms(curve, width));
    return group;
  }

  private static stoneGeometry(rng: SeededRandom): BufferGeometry {
    const outline = new Shape();
    const corners = 6 + Math.floor(rng.between(0, 3));
    for (let index = 0; index < corners; index += 1) {
      const angle = (index / corners) * Math.PI * 2 + rng.between(-0.25, 0.25);
      const radius = rng.between(0.78, 1);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.82;
      if (index === 0) outline.moveTo(x, y);
      else outline.lineTo(x, y);
    }
    outline.closePath();
    const geometry = new ExtrudeGeometry(outline, { depth: 0.12, bevelEnabled: true, bevelSize: 0.16, bevelThickness: 0.1, bevelSegments: 2, curveSegments: 2 });
    geometry.rotateX(-Math.PI / 2);
    geometry.computeBoundingBox();
    const minY = geometry.boundingBox?.min.y ?? 0;
    geometry.translate(0, -minY, 0);
    return geometry;
  }

  private stones(curve: Curve<Vector3>, width: number): InstancedMesh[] {
    const length = curve.getLength();
    const rows = Math.floor(length / PATH_ROW_STEP);
    const material = new MeshStandardMaterial({ roughness: 0.8, map: SurfaceTextures.flagstone(), bumpMap: SurfaceTextures.flagstone(), bumpScale: 0.8 });
    const placed: { variant: number; matrix: Object3D; color: Color }[] = [];
    const lane = width / PATH_STONES_PER_ROW;
    for (let row = 0; row < rows; row += 1) {
      const at = row / rows;
      const { point, tangent, normal } = RoadBuilder.frame(curve, at);
      const full = Array.from({ length: PATH_STONES_PER_ROW }, (_, column) => [-width / 2 + lane / 2 + column * lane, 1] as const);
      const staggered = [
        [-width / 2 + lane * 0.25, 0.5] as const,
        ...full.slice(0, -1).map(([across]) => [across + lane / 2, 1] as const),
        [width / 2 - lane * 0.25, 0.5] as const,
      ];
      for (const [across, part] of row % 2 === 0 ? full : staggered) {
        const along = this.rng.between(-0.04, 0.04);
        const size = lane * this.rng.between(0.4, 0.47) * (part < 1 ? 0.55 : 1);
        const holder = new Object3D();
        holder.position.set(point.x + normal.x * across + tangent.x * along, STONE_BASE, point.z + normal.z * across + tangent.z * along);
        holder.rotation.y = Math.atan2(tangent.x, tangent.z) + this.rng.between(-0.5, 0.5);
        holder.scale.set(size, this.rng.between(0.06, 0.09), size * this.rng.between(0.85, 1.05));
        placed.push({ variant: Math.floor(this.rng.between(0, VARIANTS)), matrix: holder, color: this.tint(at) });
      }
    }
    return Array.from({ length: VARIANTS }, (_, variant) => {
      const mine = placed.filter((item) => item.variant === variant);
      const mesh = new InstancedMesh(StonePath.stoneGeometry(this.rng), material, Math.max(mine.length, 1));
      mesh.count = mine.length;
      mine.forEach((item, index) => {
        item.matrix.updateMatrix();
        mesh.setMatrixAt(index, item.matrix.matrix);
        mesh.setColorAt(index, item.color);
      });
      return StonePath.finish(mesh);
    });
  }

  private tint(at: number): Color {
    const spread = at * PATH_STONE_COLORS.length * 2;
    const from = new Color(PATH_STONE_COLORS[Math.floor(spread) % PATH_STONE_COLORS.length]);
    const to = new Color(PATH_STONE_COLORS[(Math.floor(spread) + 1) % PATH_STONE_COLORS.length]);
    const mixed = from.lerp(to, spread % 1);
    return this.rng.chance(0.22) ? new Color(this.rng.pick(PATH_STONE_COLORS)) : mixed.offsetHSL(0, 0, this.rng.between(-0.05, 0.05));
  }

  private curbs(curve: Curve<Vector3>, width: number): InstancedMesh {
    const count = Math.floor(curve.getLength() / PATH_CURB_STEP);
    const geometry = new IcosahedronGeometry(1, 1);
    const material = new MeshStandardMaterial({ roughness: 0.9, map: SurfaceTextures.rock(), bumpMap: SurfaceTextures.rock(), bumpScale: 0.9 });
    const mesh = new InstancedMesh(geometry, material, count * 2);
    for (let index = 0; index < count; index += 1) {
      const { point, tangent, normal } = RoadBuilder.frame(curve, index / count);
      [-1, 1].forEach((side, sideIndex) => {
        const offset = side * (width / 2 + 0.04);
        const size = this.rng.between(0.085, 0.12);
        this.holder.position.set(point.x + normal.x * offset, STONE_BASE + size * 0.35, point.z + normal.z * offset);
        this.holder.rotation.set(0, Math.atan2(tangent.x, tangent.z) + this.rng.between(-0.3, 0.3), 0);
        this.holder.scale.set(size * 1.25, size * 0.75, size);
        this.holder.updateMatrix();
        mesh.setMatrixAt(index * 2 + sideIndex, this.holder.matrix);
        mesh.setColorAt(index * 2 + sideIndex, new Color(this.rng.pick(PATH_CURB_COLORS)));
      });
    }
    return StonePath.finish(mesh);
  }

  private blooms(curve: Curve<Vector3>, width: number): InstancedMesh[] {
    const count = Math.floor(curve.getLength() * PATH_JOINT_BLOOMS);
    const leaves = new InstancedMesh(new SphereGeometry(1, 8, 6), new MeshStandardMaterial({ color: 0x6fbf5a, roughness: 0.8, map: SurfaceTextures.foliage() }), count);
    const petals = new InstancedMesh(new SphereGeometry(1, 8, 6), new MeshStandardMaterial({ roughness: 0.6 }), count);
    for (let index = 0; index < count; index += 1) {
      const { point, normal } = RoadBuilder.frame(curve, this.rng.between(0, 1));
      const side = this.rng.chance(0.5) ? 1 : -1;
      const offset = side * (width / 2 + this.rng.between(0.12, 0.3));
      const x = point.x + normal.x * offset;
      const z = point.z + normal.z * offset;
      this.holder.rotation.set(0, this.rng.between(0, Math.PI), 0);
      this.holder.position.set(x, STONE_BASE + 0.02, z);
      this.holder.scale.set(0.08, 0.04, 0.06);
      this.holder.updateMatrix();
      leaves.setMatrixAt(index, this.holder.matrix);
      this.holder.position.set(x, STONE_BASE + 0.07, z);
      this.holder.scale.set(0.045, 0.03, 0.045);
      this.holder.updateMatrix();
      petals.setMatrixAt(index, this.holder.matrix);
      petals.setColorAt(index, new Color(this.rng.pick(BLOOMS)));
    }
    return [StonePath.finish(leaves), StonePath.finish(petals)];
  }

  private static finish(mesh: InstancedMesh): InstancedMesh {
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.receiveShadow = true;
    return mesh;
  }
}
