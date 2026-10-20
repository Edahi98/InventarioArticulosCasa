import { Vector3 } from "three";
import type { GuardianBear } from "./GuardianBear.js";
import type { TrafficCar } from "./Traffic.js";

const REACH = 2.4;
const CHECK_EVERY = 0.4;

export class WaveGreeter {
  private readonly spots: { bear: GuardianBear; at: Vector3 }[];
  private next = 0;

  /**
   * Hace que los ositos guardianes saluden con la patita cuando pasa un vehículo cerca de su casa. Revisa pocas veces
   * por segundo para no gastar.
   *
   * @param bears - Ositos guardianes de las casas.
   * @param cars - Vehículos que circulan.
   */
  constructor(
    bears: GuardianBear[],
    private readonly cars: TrafficCar[],
  ) {
    this.spots = bears.map((bear) => ({ bear, at: bear.group.getWorldPosition(new Vector3()) }));
  }

  /**
   * Revisa si algún vehículo pasa junto a una casa y pone a su osito a saludar.
   *
   * @param elapsed - Segundos transcurridos.
   * @param _night - Qué tan de noche es (no cambia nada).
   * @param moving - Si es `false` nadie saluda (movimiento reducido).
   */
  update(elapsed: number, _night: number, moving: boolean): void {
    if (!moving || elapsed < this.next) return;
    this.next = elapsed + CHECK_EVERY;
    this.spots.forEach((spot) => {
      const near = this.cars.some((car) => Math.hypot(car.group.position.x - spot.at.x, car.group.position.z - spot.at.z) < REACH);
      if (near) spot.bear.poke(elapsed, 1.6);
    });
  }
}
