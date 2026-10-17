import {
  Color,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
} from "three";
import { SeededRandom } from "./SeededRandom.js";

export interface SmokePuff {
  mesh: Mesh;
  material: MeshBasicMaterial;
  phase: number;
  speed: number;
  origin: [number, number, number];
}

const MAX_FLOWERS = 24;
const BLOOMS = [0xff8fb7, 0xffe35c, 0xffffff, 0xb89cf2] as const;

export class HouseLife {
  private readonly puffGeometry = new SphereGeometry(1, 10, 8);

  /**
   * @param rng - Azar con semilla, para que el jardín de una casa siempre sea el mismo.
   */
  constructor(private readonly rng: SeededRandom) {}

  /**
   * Humo en la chimenea: cuanto más guarda la casa, más espeso. Una casa vacía no echa humo.
   *
   * @param house - Grupo de la casa; las bocanadas se le agregan para que la sigan al animarse.
   * @param chimney - Boca de la chimenea, en el espacio de la casa.
   * @param count - Artículos que guarda la casa.
   * @returns Las bocanadas para animar.
   */
  smoke(house: Group, chimney: [number, number, number], count: number): SmokePuff[] {
    const puffs = count === 0 ? 0 : Math.min(2 + Math.floor(Math.log2(count)), 5);
    return Array.from({ length: puffs }, (_, index) => {
      const material = new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, fog: false });
      const mesh = new Mesh(this.puffGeometry, material);
      mesh.position.set(...chimney);
      house.add(mesh);
      return {
        mesh,
        material,
        phase: index / puffs + this.rng.between(0, 0.08),
        speed: this.rng.between(0.16, 0.24),
        origin: chimney,
      };
    });
  }

  /**
   * Jardín delantero: una flor por cada artículo (hasta 24), del color de la casa y otros alegres.
   *
   * @param x - Centro del lote.
   * @param z - Centro del lote.
   * @param count - Artículos que guarda la casa.
   * @param accent - Color de la categoría, que lleva una de cada tres flores.
   * @returns Las flores, o un grupo vacío si la casa no guarda nada.
   */
  garden(x: number, z: number, count: number, accent: number): Group {
    const garden = new Group();
    const total = Math.min(count, MAX_FLOWERS);
    if (total === 0) return garden;

    const stems = new InstancedMesh(new CylinderGeometry(0.012, 0.014, 0.22, 5), new MeshStandardMaterial({ color: 0x6fbf8a, roughness: 0.9 }), total);
    const blooms = new InstancedMesh(new SphereGeometry(0.075, 8, 6), new MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }), total);
    const matrix = new Matrix4();
    const holder = new Object3D();
    for (let index = 0; index < total; index += 1) {
      const px = x + this.rng.between(-1.7, 1.7);
      const pz = z + this.rng.between(1.2, 1.62);
      const lift = this.rng.between(0.9, 1.25);
      holder.position.set(px, 0.06 + 0.11 * lift, pz);
      holder.scale.set(1, lift, 1);
      holder.updateMatrix();
      stems.setMatrixAt(index, holder.matrix);
      holder.position.set(px, 0.06 + 0.22 * lift + 0.04, pz);
      holder.scale.setScalar(this.rng.between(0.85, 1.2));
      holder.updateMatrix();
      matrix.copy(holder.matrix);
      blooms.setMatrixAt(index, matrix);
      blooms.setColorAt(index, new Color(index % 3 === 0 ? accent : this.rng.pick(BLOOMS)));
    }
    stems.instanceMatrix.needsUpdate = true;
    blooms.instanceMatrix.needsUpdate = true;
    if (blooms.instanceColor) blooms.instanceColor.needsUpdate = true;
    garden.add(stems, blooms);
    return garden;
  }
}
