import { CatmullRomCurve3, CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, TorusGeometry, TubeGeometry, Vector3 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { BearTone } from "../../../core/domain/inventoryBear.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import type { BuiltCar } from "./ToyCar.js";
import { VehicleDriver } from "./VehicleDriver.js";

export type TwoWheelKind = "moto" | "bicicleta";

const SCALE = 1.45;
const TIRE = 0x3a2a40;
const CHROME = 0xe6ebf2;

export class TwoWheeler {
  private static readonly materials = new Map<number, MeshStandardMaterial>();

  /**
   * Moto o bicicleta de juguete con un osito montado, mirando hacia +x: llantas con rayos, cuadro de tubo curvo,
   * manubrio, asiento y faro. La moto lleva tanque, escape y casco; la bicicleta, canasta con flores.
   *
   * @param kind - Moto o bicicleta.
   * @param color - Color del cuadro.
   * @param tone - Color del pelaje del osito.
   * @returns El vehículo con su conductor y su faro.
   */
  static build(kind: TwoWheelKind, color: number, tone: BearTone): BuiltCar {
    const bike = new Group();
    const headlights = new MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffe9a8, emissiveIntensity: 0.3 });
    const moto = kind === "moto";
    const radius = moto ? 0.13 : 0.15;
    const frame = this.material(color);
    [-0.3, 0.3].forEach((x) => {
      const tyre = new Mesh(new TorusGeometry(radius, moto ? 0.04 : 0.018, 8, 22), this.material(TIRE));
      tyre.position.set(x, radius + 0.02, 0);
      const hub = new Mesh(new CylinderGeometry(0.03, 0.03, 0.06, 10), this.material(CHROME));
      hub.rotation.x = Math.PI / 2;
      hub.position.copy(tyre.position);
      bike.add(tyre, hub);
      for (let spoke = 0; spoke < 4; spoke += 1) {
        const rod = new Mesh(new CylinderGeometry(0.006, 0.006, radius * 2 - 0.02, 4), this.material(CHROME));
        rod.position.copy(tyre.position);
        rod.rotation.z = (spoke / 4) * Math.PI;
        bike.add(rod);
      }
    });
    const path = moto
      ? [new Vector3(-0.3, 0.16, 0), new Vector3(-0.12, 0.3, 0), new Vector3(0.12, 0.32, 0), new Vector3(0.3, 0.16, 0)]
      : [new Vector3(-0.3, 0.17, 0), new Vector3(-0.08, 0.36, 0), new Vector3(0.0, 0.17, 0), new Vector3(0.2, 0.38, 0), new Vector3(0.3, 0.17, 0)];
    bike.add(new Mesh(new TubeGeometry(new CatmullRomCurve3(path), 24, moto ? 0.035 : 0.018, 8), frame));
    const fork = new Mesh(new CylinderGeometry(0.014, 0.014, 0.36, 6), this.material(CHROME));
    fork.position.set(0.27, 0.34, 0);
    fork.rotation.z = 0.25;
    const bar = new Mesh(new CylinderGeometry(0.014, 0.014, 0.32, 6), this.material(CHROME));
    bar.rotation.x = Math.PI / 2;
    bar.position.set(0.23, 0.52, 0);
    const seat = new Mesh(new RoundedBoxGeometry(0.16, 0.04, 0.1, 2, 0.018), this.material(0x2a2233));
    seat.position.set(-0.08, moto ? 0.38 : 0.42, 0);
    const lamp = new Mesh(new SphereGeometry(0.04, 10, 8), headlights);
    lamp.position.set(0.32, 0.45, 0);
    bike.add(fork, bar, seat, lamp);
    if (moto) {
      const tank = new Mesh(new SphereGeometry(0.1, 14, 10), frame);
      tank.scale.set(1.3, 0.7, 0.8);
      tank.position.set(0.08, 0.38, 0);
      const pipe = new Mesh(new CylinderGeometry(0.022, 0.03, 0.34, 8), this.material(CHROME));
      pipe.rotation.z = Math.PI / 2 - 0.15;
      pipe.position.set(-0.15, 0.17, 0.09);
      bike.add(tank, pipe);
    }
    if (!moto) {
      const basket = new Mesh(new CylinderGeometry(0.07, 0.055, 0.08, 12, 1, true), this.material(0xc4805a));
      basket.position.set(0.36, 0.48, 0);
      const flowers = new Mesh(new SphereGeometry(0.06, 10, 8), this.material(0xff8fb7));
      flowers.scale.set(1, 0.6, 1);
      flowers.position.set(0.36, 0.53, 0);
      bike.add(basket, flowers);
    }
    const driver = VehicleDriver.bear(tone, moto ? "gorra" : "ninguno", 0.15);
    driver.group.position.set(-0.06, moto ? 0.5 : 0.54, 0);
    bike.add(driver.group);
    bike.scale.setScalar(SCALE);
    bike.traverse((part) => {
      part.castShadow = true;
    });
    return { group: bike, headlights, head: driver.head, driver: driver.group, seat: driver.group.position.clone().add(new Vector3(0, 0.12, 0)) };
  }

  private static material(color: number): MeshStandardMaterial {
    const cached = this.materials.get(color);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.1, map: SurfaceTextures.clay(), bumpMap: SurfaceTextures.clay(), bumpScale: 0.2 });
    this.materials.set(color, created);
    return created;
  }
}
