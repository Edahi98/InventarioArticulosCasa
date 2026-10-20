import { AdditiveBlending, ConeGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, Object3D, SpotLight, Vector3 } from "three";
import { LIGHTHOUSE_BEAM } from "../../../constantes/barrio_constantes.js";

const LENGTH = 16;
const SPIN = 0.6;

export class LighthouseBeam {
  readonly group = new Group();
  private readonly turret = new Group();
  private readonly material = new MeshBasicMaterial({ color: LIGHTHOUSE_BEAM, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, side: DoubleSide, fog: false });
  private readonly light: SpotLight;
  private readonly cones: Mesh[] = [];

  /**
   * Haz giratorio del faro: dos conos de luz aditivos y opuestos que barren el mar desde la linterna y una sola luz
   * de foco real, sin sombras, que gira con ellos. Solo se ven al atardecer y de noche.
   *
   * @param lantern - Posición de la linterna del faro.
   */
  constructor(lantern: Vector3) {
    [0, Math.PI].forEach((turn) => {
      const holder = new Object3D();
      holder.rotation.y = turn;
      const cone = new Mesh(new ConeGeometry(1.8, LENGTH, 20, 1, true), this.material);
      cone.rotation.z = Math.PI / 2;
      cone.position.x = LENGTH / 2 + 0.2;
      holder.add(cone);
      this.cones.push(cone);
      this.turret.add(holder);
    });
    this.light = new SpotLight(LIGHTHOUSE_BEAM, 0, LENGTH * 1.6, 0.22, 0.6, 1.2);
    this.light.position.set(0, 0, 0);
    this.light.target.position.set(LENGTH, -2.2, 0);
    this.turret.add(this.light, this.light.target);
    this.turret.position.copy(lantern);
    this.turret.rotation.z = -0.05;
    this.group.add(this.turret);
    this.update(0, 0, false);
  }

  /**
   * Gira el haz y lo enciende según la noche; con movimiento reducido queda fijo apuntando al mar.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` el haz no gira.
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const on = Math.max(0, (night - 0.15) / 0.85);
    this.turret.rotation.y = moving ? elapsed * SPIN : 0.8;
    this.material.opacity = on * 0.22;
    this.light.intensity = on * 40;
    this.cones.forEach((cone) => {
      cone.visible = on > 0.01;
    });
  }
}
