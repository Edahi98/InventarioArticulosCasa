import { Group, Vector3 } from "three";
import { listHomeBears } from "../../../core/usecases/listHomeBears.js";
import type { BearBuilder, BearRig } from "../BearBuilder.js";

export type TravelPose = "camina" | "sentado" | "colgado";

const UP = new Vector3(0, 1, 0);

export class TravelerBear {
  readonly group = new Group();
  private readonly rig: BearRig;
  private readonly phase: number;

  /**
   * Osito guardián completo que viaja entre islas: camina contoneándose y balanceando los brazos, va sentado
   * saludando (en góndola, balsa o globo) o colgado de una tirolesa con los brazos arriba.
   *
   * @param builder - Constructor de ositos compartido.
   * @param seed - Número que decide cuál de los ositos es.
   * @param pose - Cómo viaja.
   * @param scale - Tamaño del osito; con los pies en y = 0.
   */
  constructor(
    builder: BearBuilder,
    seed: number,
    private readonly pose: TravelPose,
    private readonly scale = 0.3,
  ) {
    const bears = listHomeBears();
    const bear = bears[((seed % bears.length) + bears.length) % bears.length] ?? bears[0];
    if (!bear) throw new Error("No hay ositos guardianes definidos.");
    this.rig = builder.rig(bear);
    this.phase = seed * 1.7;
    this.rig.root.scale.setScalar(scale);
    this.rig.root.position.y = 0.8 * scale;
    this.group.add(this.rig.root);
    this.group.traverse((part) => {
      part.castShadow = true;
    });
    this.update(0, false);
  }

  /**
   * Anima al osito según su forma de viajar: pasos con contoneo, saludo sentado o pataleo colgado.
   *
   * @param elapsed - Segundos transcurridos.
   * @param moving - Si es `false` queda quieto (movimiento reducido).
   */
  update(elapsed: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    const [left, right] = this.rig.arms;
    const poses: Record<TravelPose, () => void> = {
      camina: () => {
        const step = t * 7 + this.phase;
        this.rig.root.position.y = 0.8 * this.scale + Math.abs(Math.sin(step)) * 0.04 * this.scale * 3;
        this.rig.root.rotation.z = Math.sin(step) * 0.08;
        left.quaternion.setFromUnitVectors(UP, new Vector3(-0.3, -0.9, Math.sin(step) * 0.5).normalize());
        right.quaternion.setFromUnitVectors(UP, new Vector3(0.3, -0.9, -Math.sin(step) * 0.5).normalize());
      },
      sentado: () => {
        this.rig.root.rotation.z = Math.sin(t * 1.2 + this.phase) * 0.04;
        left.quaternion.setFromUnitVectors(UP, new Vector3(-0.4, -0.6, 0.6).normalize());
        right.quaternion.setFromUnitVectors(UP, new Vector3(0.6 + Math.sin(t * 8 + this.phase) * 0.25, 0.8, 0.2).normalize());
      },
      colgado: () => {
        this.rig.root.rotation.x = Math.sin(t * 2 + this.phase) * 0.12;
        left.quaternion.setFromUnitVectors(UP, new Vector3(-0.15, 1, 0).normalize());
        right.quaternion.setFromUnitVectors(UP, new Vector3(0.15, 1, 0).normalize());
      },
    };
    poses[this.pose]();
    this.rig.head.rotation.z = Math.sin(t * 0.9 + this.phase) * 0.1;
  }
}
