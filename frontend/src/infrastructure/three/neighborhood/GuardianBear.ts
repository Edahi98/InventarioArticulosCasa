import { Group, Vector3 } from "three";
import { listHomeBears } from "../../../core/usecases/listHomeBears.js";
import { BearBuilder, type BearRig } from "../BearBuilder.js";

const SCALE = 0.46;
const UP = new Vector3(0, 1, 0);
const HANGING = new Vector3(0.25, -0.9, 0.3).normalize();

export class GuardianBear {
  readonly group = new Group();
  private readonly rig: BearRig;
  private readonly phase: number;
  private level = 0;

  /**
   * Osito guardián de una casa: uno de los cuatro personajes del proyecto, de pie en el jardín, que
   * respira y mueve la cabeza, y que saluda con la patita cuando se señala su casa.
   *
   * @param builder - Constructor de ositos compartido.
   * @param categoryId - Identificador de la categoría; decide cuál de los cuatro ositos le toca.
   */
  constructor(builder: BearBuilder, categoryId: number) {
    const bears = listHomeBears();
    const bear = bears[categoryId % bears.length] ?? bears[0];
    if (!bear) throw new Error("No hay ositos guardianes definidos.");
    this.rig = builder.rigWithProp(bear);
    this.phase = categoryId * 1.37;
    this.rig.root.scale.setScalar(SCALE);
    this.rig.root.position.y = 0.8 * SCALE;
    this.group.add(this.rig.root);
    this.group.traverse((part) => {
      part.castShadow = true;
    });
  }

  /**
   * Respira, ladea la cabeza y, si la casa está señalada, se pone de puntitas y saluda.
   *
   * @param elapsed - Segundos transcurridos.
   * @param excited - Qué tan señalada está su casa, entre 0 y 1.
   * @param moving - Si es `false` el osito queda quieto (movimiento reducido).
   */
  update(elapsed: number, excited: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.level += (excited - this.level) * 0.2;
    const hop = moving ? Math.abs(Math.sin(t * 6 + this.phase)) * 0.09 * this.level : 0;
    this.rig.root.position.y = 0.8 * SCALE + hop;
    this.rig.root.scale.set(SCALE, SCALE * (1 + Math.sin(t * 2.1 + this.phase) * 0.018), SCALE);
    this.rig.head.rotation.z = Math.sin(t * 0.9 + this.phase) * 0.08 + this.level * Math.sin(t * 5) * 0.05;
    this.rig.head.rotation.x = -this.level * 0.12;
    const raised = new Vector3(0.62 + Math.sin(t * 10) * 0.22 * this.level, 0.85, 0.18).normalize();
    const wave = HANGING.clone().lerp(raised, this.level).normalize();
    const [, right] = this.rig.arms;
    right.quaternion.setFromUnitVectors(UP, wave);
  }
}
