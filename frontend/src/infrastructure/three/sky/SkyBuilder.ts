import { Group, Vector3 } from "three";
import { BearBuilder } from "../BearBuilder.js";
import { SeededRandom } from "../neighborhood/SeededRandom.js";
import { TreeFactory } from "../neighborhood/TreeFactory.js";
import { ClayMaterials } from "../park/ClayMaterials.js";
import { Confetti } from "../park/Confetti.js";
import type { Interactive } from "../park/ParkInteraction.js";
import { CloudBoat } from "./CloudBoat.js";
import { CloudSea } from "./CloudSea.js";
import { FloatingIsland } from "./FloatingIsland.js";
import { HotAirBalloon } from "./HotAirBalloon.js";
import { Rainbow } from "./Rainbow.js";
import { Rocket } from "./Rocket.js";

export type SkyVariant = "cielo" | "isla" | "correo" | "puerto";

interface BalloonSpot {
  x: number;
  y: number;
  z: number;
  scale: number;
}

interface Layout {
  island?: BalloonSpot;
  boat?: BalloonSpot;
  rocket: boolean;
  balloons: BalloonSpot[];
}

const LAYOUTS: Record<SkyVariant, Layout> = {
  cielo: {
    island: { x: 11.5, y: 3.5, z: -4, scale: 1 },
    boat: { x: -10, y: -6.2, z: 2, scale: 1.5 },
    rocket: true,
    balloons: [
      { x: -12.5, y: 4.5, z: -3, scale: 1.15 },
      { x: -8, y: 7.2, z: -8, scale: 0.95 },
      { x: 6.5, y: 7.6, z: -10, scale: 0.85 },
    ],
  },
  isla: {
    island: { x: 12, y: 2.5, z: -3, scale: 1.35 },
    rocket: false,
    balloons: [
      { x: -12, y: 3.5, z: -3, scale: 1.2 },
      { x: -7, y: 8, z: -9, scale: 0.9 },
    ],
  },
  correo: {
    rocket: true,
    balloons: [
      { x: -12, y: 5, z: -3, scale: 1.1 },
      { x: 12.5, y: 4, z: -4, scale: 1.2 },
      { x: 7, y: 8.4, z: -10, scale: 0.85 },
    ],
  },
  puerto: {
    island: { x: -12.5, y: 4, z: -5, scale: 0.95 },
    boat: { x: 11, y: -6, z: 2, scale: 1.7 },
    rocket: false,
    balloons: [{ x: 6, y: 8, z: -9, scale: 0.9 }],
  },
};

const BALLOON_COLORS = [
  [0xff8fb7, 0xfff6dc],
  [0x7fd0ea, 0xffe35c],
  [0xb89cf2, 0x86d6a8],
] as const;
const CELEBRATIONS: Vector3[] = [new Vector3(-12, 8, -2), new Vector3(11, 7, -3), new Vector3(0, 11, -6), new Vector3(-8, -2, 2)];

export class SkyBuilder {
  readonly group = new Group();
  readonly interactives: Interactive[] = [];
  private readonly rainbow = new Rainbow();
  private readonly sea = new CloudSea();
  private readonly island: FloatingIsland | null;
  private readonly balloons: HotAirBalloon[];
  private readonly boat: CloudBoat | null;
  private readonly rocket: Rocket | null;
  private readonly confetti = new Confetti();
  private readonly rng = new SeededRandom("cielo");
  private nextParty = 6;
  private last = 0;

  /**
   * El cielo de los guardianes. Según la variante muestra un arcoíris, un mar de nubes y distintas figuras: una
   * isla flotante con castillo, globos aerostáticos con ositos pilotos, un barquito de vela y un cohete.
   *
   * @param variant - Escenario: `cielo` (todo), `isla`, `correo` (cohete y globos) o `puerto` (barco e isla).
   */
  constructor(variant: SkyVariant = "cielo") {
    const layout = LAYOUTS[variant];
    const clay = new ClayMaterials();
    const bears = new BearBuilder();
    this.rainbow.group.position.set(0, -9, -22);

    this.island = layout.island ? new FloatingIsland(bears, new TreeFactory(this.rng), clay) : null;
    if (layout.island) this.island?.place(layout.island.x, layout.island.y, layout.island.z, layout.island.scale);

    this.balloons = layout.balloons.map((spot, index) => {
      const colors = BALLOON_COLORS[index % BALLOON_COLORS.length] as readonly number[];
      const balloon = new HotAirBalloon(`globo-${index}`, colors, bears, clay, index * 3, index * 2);
      balloon.place(spot.x, spot.y, spot.z, spot.scale);
      return balloon;
    });

    this.boat = layout.boat ? new CloudBoat(bears, clay) : null;
    if (layout.boat) this.boat?.place(layout.boat.x, layout.boat.y, layout.boat.z, layout.boat.scale);

    this.rocket = layout.rocket ? new Rocket(clay) : null;

    this.interactives.push(
      ...(this.island?.interactives ?? []),
      ...this.balloons.flatMap((balloon) => balloon.interactives),
      ...(this.boat?.interactives ?? []),
      ...(this.rocket?.interactives ?? []),
    );
    this.group.add(this.rainbow.group, this.sea.group, this.confetti.mesh, ...this.balloons.map((balloon) => balloon.group));
    [this.island?.group, this.boat?.group, this.rocket?.group].forEach((part) => part && this.group.add(part));
  }

  /**
   * Lanza una ráfaga de confeti desde un punto.
   *
   * @param point - De dónde sale el confeti.
   * @param amount - Cuántos papelitos.
   */
  pop(point: Vector3, amount = 60): void {
    this.confetti.burst(point, amount);
  }

  /**
   * Anima todas las figuras y, cada unos segundos, lanza confeti desde un rincón distinto.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const dt = Math.min(Math.max(elapsed - this.last, 0), 0.1);
    this.last = elapsed;
    this.rainbow.update(night);
    this.sea.update(elapsed, night, moving);
    this.island?.update(elapsed, moving);
    this.balloons.forEach((balloon) => balloon.update(elapsed, night, moving));
    this.boat?.update(elapsed, moving);
    this.rocket?.update(elapsed, night, moving);
    this.confetti.update(dt);
    if (moving && elapsed > this.nextParty) {
      this.confetti.burst(this.rng.pick(CELEBRATIONS), 50);
      this.nextParty = elapsed + this.rng.between(9, 14);
    }
  }
}
