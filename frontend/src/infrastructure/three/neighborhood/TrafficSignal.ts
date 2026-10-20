import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { SIGNAL_CYCLE } from "../../../constantes/barrio_constantes.js";
import { Solid } from "../walk/Solid.js";
import { CraftMaterials } from "./CraftMaterials.js";

const COLORS = [0x4fe08a, 0xffd84d, 0xff4f5b] as const;

export class TrafficSignal {
  readonly group = new Group();
  private readonly bulbs: MeshStandardMaterial[];
  private readonly phase: number;

  /**
   * Semáforo de juguete en la esquina donde la calle de enlace sale del anillo: poste rayado, caja redonda con visera
   * y tres focos que pasan de verde a amarillo a rojo; de noche brillan más.
   *
   * @param phase - Desfase del ciclo, para que no cambien todos a la vez.
   */
  constructor(phase: number) {
    this.phase = phase;
    const pole = new Mesh(new CylinderGeometry(0.035, 0.045, 1.1, 8), CraftMaterials.paint(0x3a2a40));
    pole.position.y = 0.55;
    const box = new Mesh(new RoundedBoxGeometry(0.16, 0.42, 0.14, 2, 0.05), CraftMaterials.paint(0xffd84d));
    box.position.y = 1.25;
    this.bulbs = COLORS.map((color, index) => {
      const material = new MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.1, roughness: 0.3 });
      const bulb = new Mesh(new SphereGeometry(0.045, 10, 8), material);
      bulb.position.set(0, 1.12 + index * 0.13, 0.07);
      this.group.add(bulb);
      return material;
    });
    this.group.add(pole, box);
    Solid.mark(this.group, { shape: "cylinder", radius: 0.06, height: 1.4, offset: [0, 0.7, 0] });
    this.update(0, 0, false);
  }

  /**
   * Cambia la luz encendida según el ciclo (verde, amarillo, rojo).
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` se queda en verde (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const cycle = moving ? ((elapsed + this.phase) % SIGNAL_CYCLE) / SIGNAL_CYCLE : 0;
    const active = cycle < 0.45 ? 0 : cycle < 0.55 ? 1 : 2;
    this.bulbs.forEach((bulb, index) => {
      bulb.emissiveIntensity = index === active ? 0.9 + night * 1.6 : 0.06;
    });
  }
}
