import { Color, ConeGeometry, InstancedMesh, MeshStandardMaterial, Object3D, SphereGeometry, Vector3, type BufferGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CORAL_SHELF_Y, FISH_PER_SCHOOL, FISH_SCHOOLS, SEA_FISH_COLORS, SEA_FLOOR_Y, SEA_WATER_Y } from "../../../constantes/barrio_constantes.js";
import { SeaTextures } from "../scenes/SeaTextures.js";
import { SeededRandom } from "./SeededRandom.js";
import type { IslandCircle } from "./Sparkles.js";

interface School {
  island: IslandCircle;
  distance: number;
  depth: number;
  speed: number;
  phase: number;
  offsets: Vector3[];
}

export class FishSchools {
  readonly mesh: InstancedMesh;
  private readonly schools: School[] = [];
  private readonly holder = new Object3D();

  /**
   * Cardúmenes de pececitos de colores que nadan en bancos alrededor de las islas, bajo el agua, con giros suaves:
   * el banco sube y baja, se ensancha y cada pez coletea a su ritmo. Todos van en una sola malla instanciada.
   *
   * @param islands - Círculos de las islas.
   */
  constructor(islands: IslandCircle[]) {
    const rng = new SeededRandom("cardumen");
    for (let index = 0; index < FISH_SCHOOLS; index += 1) {
      const island = islands[index % islands.length] as IslandCircle;
      this.schools.push({
        island,
        distance: island.radius * (index % 2 === 0 ? rng.between(1.12, 1.28) : rng.between(1.55, 1.8)),
        depth: index % 2 === 0 ? rng.between(CORAL_SHELF_Y + 0.3, CORAL_SHELF_Y + 0.5) : rng.between(SEA_FLOOR_Y + 1.2, SEA_WATER_Y - 1.2),
        speed: rng.between(0.05, 0.09) * (index % 2 === 0 ? 1 : -1),
        phase: rng.between(0, Math.PI * 2),
        offsets: Array.from({ length: FISH_PER_SCHOOL }, () => new Vector3(rng.between(-1.2, 1.2), rng.between(-0.2, 0.2), rng.between(-0.7, 0.7))),
      });
    }
    this.mesh = new InstancedMesh(FishSchools.fish(), new MeshStandardMaterial({ map: SeaTextures.belly(), roughness: 0.45 }), FISH_SCHOOLS * FISH_PER_SCHOOL);
    this.schools.forEach((school, schoolIndex) =>
      school.offsets.forEach((_, index) => this.mesh.setColorAt(schoolIndex * FISH_PER_SCHOOL + index, new Color(SEA_FISH_COLORS[(schoolIndex + (index % 2)) % SEA_FISH_COLORS.length] as number))),
    );
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    this.mesh.frustumCulled = false;
    this.update(0, 0, false);
  }

  /**
   * Mueve los bancos en su órbita y a cada pez dentro de su lugar del banco.
   *
   * @param elapsed - Segundos transcurridos.
   * @param _night - Qué tan de noche es (no cambia nada).
   * @param moving - Si es `false` quedan quietos (movimiento reducido).
   */
  update(elapsed: number, _night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.schools.forEach((school, schoolIndex) => {
      const angle = school.phase + t * school.speed;
      const forward = Math.sign(school.speed);
      const heading = Math.atan2(-Math.cos(angle) * forward, -Math.sin(angle) * forward);
      const spread = 1 + Math.sin(t * 0.4 + school.phase) * 0.25;
      school.offsets.forEach((offset, index) => {
        const wiggle = Math.sin(t * 2 + index * 1.7) * 0.15;
        const along = offset.x * spread;
        const out = offset.z * spread;
        const x = school.island.x + Math.cos(angle) * (school.distance + out) - Math.sin(angle) * along * forward;
        const z = school.island.z + Math.sin(angle) * (school.distance + out) + Math.cos(angle) * along * forward;
        this.holder.position.set(x, school.depth + offset.y + Math.sin(t * 0.5 + school.phase) * 0.12, z);
        this.holder.rotation.set(0, heading + wiggle, 0);
        this.holder.scale.setScalar(0.22);
        this.holder.updateMatrix();
        this.mesh.setMatrixAt(schoolIndex * FISH_PER_SCHOOL + index, this.holder.matrix);
      });
    });
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  private static fish(): BufferGeometry {
    const body = new SphereGeometry(0.9, 12, 8).scale(1.5, 0.85, 0.55);
    const tail = new ConeGeometry(0.6, 0.9, 3).rotateZ(-Math.PI / 2).translate(-1.6, 0, 0).scale(1, 1, 0.3);
    const fin = new ConeGeometry(0.3, 0.5, 3).translate(0, 0.8, 0).scale(1, 1, 0.25);
    return mergeGeometries([body.toNonIndexed(), tail.toNonIndexed(), fin.toNonIndexed()]) ?? body;
  }
}
