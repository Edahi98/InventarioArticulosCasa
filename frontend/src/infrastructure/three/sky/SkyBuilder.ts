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

const CELEBRATIONS: Vector3[] = [new Vector3(-12, 8, -2), new Vector3(11, 7, -3), new Vector3(0, 11, -6), new Vector3(-8, -2, 2)];

export class SkyBuilder {
  readonly group = new Group();
  readonly interactives: Interactive[];
  private readonly rainbow = new Rainbow();
  private readonly sea = new CloudSea();
  private readonly island: FloatingIsland;
  private readonly balloons: HotAirBalloon[];
  private readonly boat: CloudBoat;
  private readonly rocket: Rocket;
  private readonly confetti = new Confetti();
  private readonly rng = new SeededRandom("cielo");
  private nextParty = 6;
  private last = 0;

  /**
   * El cielo de los guardianes: un arcoíris detrás, un mar de nubes abajo, una isla flotante con castillo, tres
   * globos aerostáticos con ositos pilotos, un barquito de vela entre las nubes y un cohete que cruza.
   */
  constructor() {
    const clay = new ClayMaterials();
    const bears = new BearBuilder();
    this.rainbow.group.position.set(0, -9, -22);
    this.island = new FloatingIsland(bears, new TreeFactory(this.rng), clay);
    this.island.place(11.5, 3.5, -4, 1);
    this.balloons = [
      new HotAirBalloon("globo-rosa", [0xff8fb7, 0xfff6dc], bears, clay, 0, 0),
      new HotAirBalloon("globo-azul", [0x7fd0ea, 0xffe35c], bears, clay, 3, 2),
      new HotAirBalloon("globo-lila", [0xb89cf2, 0x86d6a8], bears, clay, 1, 4),
    ];
    this.balloons[0]?.place(-12.5, 4.5, -3, 1.15);
    this.balloons[1]?.place(-8, 7.2, -8, 0.95);
    this.balloons[2]?.place(6.5, 7.6, -10, 0.85);
    this.boat = new CloudBoat(bears, clay);
    this.boat.place(-10, -6.2, 2, 1.5);
    this.rocket = new Rocket(clay);
    this.interactives = [
      ...this.island.interactives,
      ...this.balloons.flatMap((balloon) => balloon.interactives),
      ...this.boat.interactives,
      ...this.rocket.interactives,
    ];
    this.group.add(
      this.rainbow.group,
      this.sea.group,
      this.island.group,
      ...this.balloons.map((balloon) => balloon.group),
      this.boat.group,
      this.rocket.group,
      this.confetti.mesh,
    );
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
    this.island.update(elapsed, moving);
    this.balloons.forEach((balloon) => balloon.update(elapsed, night, moving));
    this.boat.update(elapsed, moving);
    this.rocket.update(elapsed, night, moving);
    this.confetti.update(dt);
    if (moving && elapsed > this.nextParty) {
      this.confetti.burst(this.rng.pick(CELEBRATIONS), 50);
      this.nextParty = elapsed + this.rng.between(9, 14);
    }
  }
}
