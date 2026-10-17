import { Group } from "three";
import type { BearTone } from "../../../core/domain/inventoryBear.js";
import { ToyHelicopter, type BuiltHelicopter, type HelicopterKind } from "./ToyHelicopter.js";

export interface HelicopterFleetOptions {
  center: [number, number, number];
  rx: number;
  rz: number;
  scale: number;
}

interface Flyer extends BuiltHelicopter {
  phase: number;
  speed: number;
  rx: number;
  rz: number;
  height: number;
}

const KINDS: HelicopterKind[] = ["carguero", "rescate", "reparto"];
const COLORS = [0xff6b6b, 0xfffaf2, 0x7fd0ea] as const;
const TONES: BearTone[] = ["sun", "rose", "lilac"];

export class HelicopterFleet {
  readonly group = new Group();
  private readonly flyers: Flyer[] = [];

  /**
   * Flota de tres helicópteros de juguete (carguero, rescate y reparto) con ositos pilotos, que dan vueltas
   * en elipses de distinto tamaño y altura alrededor de un punto, en sentidos alternos.
   *
   * @param options - `center` (x, altura base, z) alrededor del que vuelan, `rx` y `rz` (semiejes de la elipse más
   * pequeña; cada helicóptero agrega 2 unidades más) y `scale` (tamaño de los helicópteros).
   */
  constructor(private readonly options: HelicopterFleetOptions) {
    KINDS.forEach((kind, index) => {
      const built = ToyHelicopter.build(COLORS[index] as number, kind, TONES[index] as BearTone);
      built.group.scale.setScalar(options.scale);
      this.flyers.push({
        ...built,
        phase: index * 2.1,
        speed: 0.09 * (index % 2 === 0 ? 1 : -1),
        rx: options.rx + index * 2,
        rz: options.rz + index * 2,
        height: options.center[1] + index * 1.3,
      });
      this.group.add(built.group);
    });
  }

  /**
   * Hace volar a los helicópteros por su elipse, girar sus rotores y mecer la carga colgante.
   *
   * @param elapsed - Segundos transcurridos.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.flyers.forEach((flyer) => {
      const angle = t * flyer.speed + flyer.phase;
      const direction = Math.sign(flyer.speed);
      flyer.group.position.set(
        this.options.center[0] + Math.cos(angle) * flyer.rx,
        flyer.height + Math.sin(t * 0.9 + flyer.phase) * 0.5,
        this.options.center[2] + Math.sin(angle) * flyer.rz,
      );
      flyer.group.rotation.y = Math.atan2(-Math.cos(angle) * flyer.rz * direction, -Math.sin(angle) * flyer.rx * direction);
      flyer.group.rotation.z = Math.sin(t * 0.7 + flyer.phase) * 0.05;
      flyer.rotor.rotation.y = t * 20;
      flyer.tailRotor.rotation.z = t * 26;
      if (flyer.sling) flyer.sling.rotation.z = Math.sin(t * 1.3 + flyer.phase) * 0.14;
    });
  }
}
