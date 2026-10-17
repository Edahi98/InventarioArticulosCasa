import { Group, Vector3 } from "three";
import type { InventoryBear } from "../../../core/domain/inventoryBear.js";
import { listHomeBears } from "../../../core/usecases/listHomeBears.js";
import type { BearBuilder, BearRig } from "../BearBuilder.js";

const UP = new Vector3(0, 1, 0);
const HANGING = new Vector3(0.25, -0.9, 0.3).normalize();

export class GuardianBear {
  readonly group = new Group();
  readonly bear: InventoryBear;
  private readonly rig: BearRig;
  private readonly phase: number;
  private readonly scale: number;
  private level = 0;
  private pokedUntil = 0;

  /**
   * Osito guardián: uno de los cuatro personajes del proyecto, que respira y mueve la cabeza, y que saluda con
   * la patita cuando se le pide (por ejemplo al señalar su casa).
   *
   * @param builder - Constructor de ositos compartido.
   * @param seed - Número que decide cuál de los cuatro ositos le toca.
   * @param scale - Tamaño del osito.
   * @param withProp - Si lleva el objeto a sus pies.
   */
  constructor(builder: BearBuilder, seed: number, scale = 0.46, withProp = true) {
    const bears = listHomeBears();
    const bear = bears[((seed % bears.length) + bears.length) % bears.length] ?? bears[0];
    if (!bear) throw new Error("No hay ositos guardianes definidos.");
    this.bear = bear;
    this.rig = withProp ? builder.rigWithProp(bear) : builder.rig(bear);
    this.phase = seed * 1.37;
    this.scale = scale;
    this.rig.root.scale.setScalar(scale);
    this.rig.root.position.y = 0.8 * scale;
    this.group.add(this.rig.root);
    this.group.traverse((part) => {
      part.castShadow = true;
    });
  }

  /**
   * Hace que el osito salude y brinque un rato.
   *
   * @param now - Segundos transcurridos en la escena.
   * @param seconds - Cuánto tiempo dura el saludo.
   */
  poke(now: number, seconds = 2.4): void {
    this.pokedUntil = now + seconds;
  }

  /**
   * Respira, ladea la cabeza y, si está emocionado o lo picaron, se pone de puntitas y saluda con la patita.
   *
   * @param elapsed - Segundos transcurridos.
   * @param excited - Qué tan emocionado está, entre 0 y 1.
   * @param moving - Si es `false` el osito queda quieto (movimiento reducido).
   */
  update(elapsed: number, excited: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    const target = Math.max(excited, elapsed < this.pokedUntil ? 1 : 0);
    this.level += (target - this.level) * 0.2;
    const hop = moving ? Math.abs(Math.sin(t * 6 + this.phase)) * 0.09 * (this.scale / 0.46) * this.level : 0;
    this.rig.root.position.y = 0.8 * this.scale + hop;
    this.rig.root.scale.set(this.scale, this.scale * (1 + Math.sin(t * 2.1 + this.phase) * 0.018), this.scale);
    this.rig.head.rotation.z = Math.sin(t * 0.9 + this.phase) * 0.08 + this.level * Math.sin(t * 5) * 0.05;
    this.rig.head.rotation.x = -this.level * 0.12;
    const raised = new Vector3(0.62 + Math.sin(t * 10) * 0.22 * this.level, 0.85, 0.18).normalize();
    const wave = HANGING.clone().lerp(raised, this.level).normalize();
    const [, right] = this.rig.arms;
    right.quaternion.setFromUnitVectors(UP, wave);
  }
}
