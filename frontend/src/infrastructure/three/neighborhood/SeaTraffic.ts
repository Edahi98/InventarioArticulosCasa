import { AdditiveBlending, CircleGeometry, Group, Mesh, MeshBasicMaterial, PlaneGeometry, Vector3, type CanvasTexture, type CatmullRomCurve3, type MeshStandardMaterial } from "three";
import { LOOP_FLEET, ORBIT_FLEET, SHIP_SCALE, SHIP_SPEED } from "../../../constantes/barrio_constantes.js";
import { TextureCanvas } from "../TextureCanvas.js";
import { MeshMerger } from "../MeshMerger.js";
import { HarborBoats, type HarborKind } from "./HarborBoats.js";
import { PirateShip, type BuiltShip, type ShipKind } from "./PirateShip.js";
import { RoadBuilder } from "./RoadBuilder.js";
import { SeededRandom } from "./SeededRandom.js";
import type { SeaLoop } from "./SeaRoutes.js";
import { TreasureIslet } from "./TreasureIslet.js";
import type { ParticleSystem } from "./ParticleSystem.js";

interface Sailing {
  built: BuiltShip;
  curve: CatmullRomCurve3;
  length: number;
  start: number;
  speed: number;
  phase: number;
}

const WATER_Y = -1.35;
const SHIPS: readonly string[] = ["pirata", "galeon", "goleta"];

export class SeaTraffic {
  readonly group = new Group();
  readonly lanterns: MeshStandardMaterial[] = [];
  private readonly sailings: Sailing[] = [];
  private readonly wake = new MeshBasicMaterial({ map: SeaTraffic.wakeTexture(), transparent: true, opacity: 0.75, depthWrite: false });
  private readonly glow = new MeshBasicMaterial({ color: 0xffc982, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, fog: false });

  /**
   * Barcos que navegan entre y alrededor de las islas sin cruzar tierra ni puentes: piratas, un galeón, una goleta, un
   * barco de vapor y un velero de regata en la vuelta grande; un bote de remos, un submarino y una lancha de rescate en
   * los circuitos entre islas, que rodean una islita del tesoro. Cabecean y se balancean, dejan estela de espuma y de
   * noche sus faroles se reflejan en el agua.
   *
   * @param orbit - Vuelta grande alrededor del archipiélago.
   * @param loops - Circuitos entre islas.
   */
  constructor(orbit: CatmullRomCurve3, loops: SeaLoop[], private readonly particles: ParticleSystem | null = null) {
    const rng = new SeededRandom("mar");
    ORBIT_FLEET.forEach((kind, index) => this.launch(kind, orbit, index / ORBIT_FLEET.length, rng, index));
    loops.forEach((loop, index) => {
      this.launch(LOOP_FLEET[index % LOOP_FLEET.length] as string, loop.curve, rng.between(0, 1), rng, 20 + index);
      if (index !== 0) return;
      const islet = TreasureIslet.build(loop.x, loop.z, Math.max(loop.room - 1.1, 0.9));
      this.lanterns.push(islet.glow);
      this.group.add(islet.group);
    });
    this.update(0, 0, false);
  }

  /**
   * Hace navegar a los barcos por su ruta con cabeceo y balanceo, gira ruedas de paletas, hélices y remos, y prende
   * el reflejo de sus faroles según la noche.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` los barcos quedan quietos (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.glow.opacity = night * 0.45;
    this.sailings.forEach((sailing) => {
      const { point, tangent } = RoadBuilder.frame(sailing.curve, sailing.start + (t * sailing.speed) / sailing.length);
      const ship = sailing.built.group;
      ship.position.set(point.x, WATER_Y + Math.sin(t * 1.4 + sailing.phase) * 0.04, point.z);
      ship.rotation.set(Math.sin(t * 1.1 + sailing.phase) * 0.05, Math.atan2(-tangent.z, tangent.x), Math.sin(t * 0.9 + sailing.phase) * 0.035, "YXZ");
      sailing.built.spinners.forEach((spinner) => {
        const turns: Record<typeof spinner.axis, () => void> = {
          x: () => {
            spinner.object.rotation.x = t * spinner.speed;
          },
          z: () => {
            spinner.object.rotation.z = t * spinner.speed;
          },
          remo: () => {
            spinner.object.rotation.y = Math.sin(t * spinner.speed) * 0.5;
          },
        };
        turns[spinner.axis]();
      });
    });
  }

  private launch(kind: string, curve: CatmullRomCurve3, start: number, rng: SeededRandom, seed: number): void {
    const pirate = SHIPS.includes(kind);
    const built = pirate ? PirateShip.build(kind as ShipKind, seed) : HarborBoats.build(kind as HarborKind, seed);
    MeshMerger.merge(built.group, built.spinners.map((spinner) => spinner.object));
    const length = kind === "galeon" ? 3 : pirate ? 2.4 : 1.3;
    const wake = new Mesh(new PlaneGeometry(length * 1.4, length * 0.7), this.wake);
    wake.rotation.x = -Math.PI / 2;
    wake.position.set(-length * 0.85, 0.03, 0);
    const pool = new Mesh(new CircleGeometry(length * 0.45, 20), this.glow);
    pool.rotation.x = -Math.PI / 2;
    pool.scale.set(1.6, 1, 1);
    pool.position.y = 0.035;
    built.group.add(wake, pool);
    built.group.scale.setScalar(pirate ? SHIP_SCALE : SHIP_SCALE * 0.95);
    this.group.add(built.group);
    this.lanterns.push(...built.lanterns);
    this.sailings.push({ built, curve, length: curve.getLength(), start, speed: rng.between(SHIP_SPEED[0], SHIP_SPEED[1]), phase: rng.between(0, 6) });
    const smoke = new Vector3();
    const bow = new Vector3();
    if (kind === "vapor") this.particles?.addStream({ kind: "vapor", rate: 4, spread: 0.05, at: () => built.group.localToWorld(smoke.set(0.05, 1.05, 0)) });
    this.particles?.addStream({ kind: "espuma", rate: 3, spread: 0.15, at: () => built.group.localToWorld(bow.set(length / 2, 0.05, 0)) });
  }

  private static wakeTexture(): CanvasTexture {
    return TextureCanvas.build("estela", 128, 64, false, (context, rng, width, height) => {
      context.clearRect(0, 0, width, height);
      for (let index = 0; index < 160; index += 1) {
        const x = rng.between(0, width);
        const spread = (1 - x / width) * 0.45 + 0.05;
        const y = height / 2 + (rng.chance(0.5) ? 1 : -1) * spread * height * rng.between(0.6, 1);
        context.fillStyle = `rgba(255,255,255,${(x / width) * 0.8})`;
        context.beginPath();
        context.ellipse(x, y, rng.between(2, 5), rng.between(1, 3), 0, 0, Math.PI * 2);
        context.fill();
      }
    });
  }
}
