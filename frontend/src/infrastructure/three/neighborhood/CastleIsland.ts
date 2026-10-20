import { Group, LineCurve3, Vector3, type MeshStandardMaterial } from "three";
import { CASTLE_MOAT, VILLAGE_HOUSES } from "../../../constantes/barrio_constantes.js";
import { GrassField } from "../GrassField.js";
import type { CastlePlan } from "./ArchipelagoLayout.js";
import { CastleKeep } from "./CastleKeep.js";
import { DuckFlock } from "./DuckFlock.js";
import { IslandBuilder } from "./IslandBuilder.js";
import { KnightPatrol } from "./KnightPatrol.js";
import { MedievalVillage } from "./MedievalVillage.js";
import type { NightLights } from "./NightLights.js";
import type { ParticleSystem } from "./ParticleSystem.js";
import { RoadBuilder } from "./RoadBuilder.js";
import type { SeededRandom } from "./SeededRandom.js";
import { ToyDragon } from "./ToyDragon.js";
import type { TreeFactory } from "./TreeFactory.js";

const PATH_WIDTH = 1.2;
const KEEP_TOP = 6.2;

export class CastleIsland {
  readonly group = new Group();
  readonly lamps: MeshStandardMaterial[] = [];
  readonly swaying: Group[] = [];
  private readonly keep: CastleKeep;
  private readonly village: MedievalVillage;
  private readonly guards: KnightPatrol;
  private readonly dragon: ToyDragon;
  private readonly ducks: DuckFlock;

  /**
   * Isla del castillo: su propia isla de pasto con árboles en la orilla, un camino de piedra desde el puente hasta el
   * puente levadizo, el castillo con foso, murallas, torres y torre del homenaje, el pueblito medieval al pie, la
   * guardia de caballeros y arqueros, patitos en el foso, dragones de juguete y polvo de hada alrededor de las torres.
   *
   * @param plan - Centro, radio y ángulo de entrada (hacia el puente) de la isla.
   * @param rng - Azar con semilla.
   * @param trees - Fábrica de árboles compartida.
   * @param lights - Luces de la noche (halos de las antorchas).
   * @param particles - Partículas (chispas, humo, humo del dragón y polvo de hada).
   */
  constructor(plan: CastlePlan, rng: SeededRandom, trees: TreeFactory, lights: NightLights, particles: ParticleSystem) {
    const base = new IslandBuilder(rng, trees).build(plan.radius, 0, [plan.angle]);
    base.group.position.set(plan.x, 0, plan.z);
    this.swaying.push(...base.swaying);
    const direction = new Vector3(Math.cos(plan.angle), 0, Math.sin(plan.angle));
    const center = new Vector3(plan.x, 0, plan.z);
    const pathStart = center.clone().addScaledVector(direction, CASTLE_MOAT[1] + 0.3);
    const pathEnd = center.clone().addScaledVector(direction, plan.radius - 0.5);
    const path = new RoadBuilder().spur(new LineCurve3(pathStart, pathEnd), PATH_WIDTH, "castillo");
    const inner = new Group();
    inner.position.copy(center);
    inner.rotation.y = -plan.angle;
    this.keep = new CastleKeep(lights);
    const villageTurn = plan.id * 0.83;
    const spots = Array.from({ length: 3 + VILLAGE_HOUSES }, (_, index) => ({
      angle: 0.8 + (index / (3 + VILLAGE_HOUSES)) * (Math.PI * 2 - 1.6) + villageTurn,
      distance: index % 2 === 0 ? 8.3 : 9.4,
    }));
    this.village = new MedievalVillage(spots, particles, { x: plan.x, z: plan.z, turn: -plan.angle });
    this.guards = new KnightPatrol(plan.radius);
    inner.add(this.keep.group, this.village.group, this.guards.group);
    const grass = new GrassField({
      seed: `castillo-pasto-${plan.id}`,
      radius: plan.radius - 0.6,
      y: 0.05,
      center: [plan.x, plan.z],
      accept: (x, z) => {
        const dx = x - plan.x;
        const dz = z - plan.z;
        const distance = Math.hypot(dx, dz);
        const along = dx * direction.x + dz * direction.z;
        const across = Math.abs(dx * direction.z - dz * direction.x);
        return distance > CASTLE_MOAT[1] + 0.4 && !(along > 0 && across < PATH_WIDTH) && spots.every((spot) => Math.hypot(Math.cos(spot.angle + plan.angle) * spot.distance - dx, Math.sin(spot.angle + plan.angle) * spot.distance - dz) > 1.3);
      },
    }).group;
    this.dragon = new ToyDragon(center, KEEP_TOP, particles);
    this.ducks = new DuckFlock([{ x: plan.x, z: plan.z, radius: CASTLE_MOAT[0] - 1.4 }], 0.04, 0.6);
    this.group.add(base.group, grass, path, inner, this.dragon.group, this.ducks.group);
    this.lamps.push(...this.keep.lamps, ...this.village.lamps);
    const sparkle = new Vector3();
    let turn = 0;
    particles.addStream({
      kind: "hada",
      rate: 14,
      spread: 0.3,
      at: () => {
        turn += 2.39;
        return sparkle.set(plan.x + Math.cos(turn) * 4.6, 2 + (turn % 3), plan.z + Math.sin(turn) * 4.6);
      },
    });
  }

  /**
   * Anima banderas, antorchas, el pueblito, la guardia, los dragones y los patitos del foso.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.keep.flags.forEach((flag, index) => {
      flag.rotation.y = Math.sin(t * 2.4 + index) * 0.35;
    });
    this.keep.torches.forEach((torch, index) => {
      torch.emissiveIntensity = 0.5 + night * 1.8 + (moving ? Math.sin(t * 13 + index * 2) * 0.25 : 0);
    });
    this.village.update(elapsed, night, moving);
    this.guards.update(elapsed, night, moving);
    this.dragon.update(elapsed, night, moving);
    this.ducks.update(elapsed, night, moving);
  }
}
