import { ConeGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry, TorusGeometry } from "three";
import { FISH_MAX } from "../../../constantes/barrio_constantes.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { SeededRandom } from "./SeededRandom.js";
import type { IslandCircle } from "./Sparkles.js";
import type { ParticleSystem } from "./ParticleSystem.js";

interface Fish {
  fish: Group;
  splash: Mesh;
  splashMaterial: MeshBasicMaterial;
  x: number;
  z: number;
  heading: number;
  period: number;
  phase: number;
  flying: boolean;
}

const WATER_Y = -1.35;
const COLORS = [0xff9a3b, 0xff6f91, 0x7fd0ea, 0xffd84d] as const;
const LEAP = 0.3;

export class LeapingFish {
  readonly group = new Group();
  private readonly school: Fish[] = [];

  /**
   * Pececitos de colores que de vez en cuando saltan en arco fuera del agua, entre las islas, y dejan un anillo de
   * salpicadura al caer.
   *
   * @param islands - Círculos de las islas; los peces saltan cerca de sus orillas.
   */
  constructor(islands: IslandCircle[], private readonly particles: ParticleSystem | null = null) {
    const rng = new SeededRandom("peces");
    const ring = new TorusGeometry(0.4, 0.04, 6, 24);
    for (let index = 0; index < FISH_MAX; index += 1) {
      const island = islands[index % islands.length] as IslandCircle;
      const angle = rng.between(0, Math.PI * 2);
      const distance = island.radius + rng.between(2.5, 4.5);
      const fish = LeapingFish.fish(rng.pick(COLORS));
      const splashMaterial = new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
      const splash = new Mesh(ring, splashMaterial);
      splash.rotation.x = Math.PI / 2;
      this.group.add(fish, splash);
      this.school.push({ fish, splash, splashMaterial, x: island.x + Math.cos(angle) * distance, z: island.z + Math.sin(angle) * distance, heading: rng.between(0, Math.PI * 2), period: rng.between(4, 7), phase: rng.between(0, 7), flying: false });
    }
    this.update(0, 0, false);
  }

  /**
   * Hace saltar a cada pez en su turno y abre el anillo de salpicadura.
   *
   * @param elapsed - Segundos transcurridos.
   * @param _night - Qué tan de noche es (no cambia nada).
   * @param moving - Si es `false` los peces se quedan bajo el agua (movimiento reducido).
   */
  update(elapsed: number, _night: number, moving: boolean): void {
    this.school.forEach((item) => {
      const cycle = moving ? ((elapsed + item.phase) % item.period) / item.period : 1;
      const jump = cycle / LEAP;
      const flying = jump < 1;
      if (moving && item.flying && !flying) this.particles?.burst("espuma", item.splash.position, 10, 0.2);
      item.flying = flying;
      item.fish.visible = flying;
      const dx = Math.cos(item.heading);
      const dz = Math.sin(item.heading);
      const travel = (jump - 0.5) * 1.6;
      item.fish.position.set(item.x + dx * travel, WATER_Y + Math.sin(Math.min(jump, 1) * Math.PI) * 1.1, item.z + dz * travel);
      item.fish.rotation.set(0, -item.heading, -(jump - 0.5) * 2.2);
      const ripple = Math.min(Math.max((jump - 0.95) / 0.6, 0), 1);
      item.splash.position.set(item.x + dx * 0.8, WATER_Y + 0.02, item.z + dz * 0.8);
      item.splash.scale.setScalar(0.4 + ripple * 1.4);
      item.splashMaterial.opacity = ripple > 0 && ripple < 1 ? (1 - ripple) * 0.7 : 0;
    });
  }

  private static fish(color: number): Group {
    const group = new Group();
    const material = new MeshStandardMaterial({ color, roughness: 0.35, map: SurfaceTextures.spotted(color) });
    const body = new Mesh(new SphereGeometry(0.22, 14, 10), material);
    body.scale.set(1.5, 0.9, 0.55);
    const tail = new Mesh(new ConeGeometry(0.16, 0.22, 4), material);
    tail.rotation.z = Math.PI / 2;
    tail.position.x = -0.38;
    tail.scale.set(1, 1, 0.3);
    const eye = new Mesh(new SphereGeometry(0.035, 8, 6), new MeshStandardMaterial({ color: 0x2a2233 }));
    eye.position.set(0.2, 0.05, 0.1);
    group.add(body, tail, eye);
    return group;
  }
}
