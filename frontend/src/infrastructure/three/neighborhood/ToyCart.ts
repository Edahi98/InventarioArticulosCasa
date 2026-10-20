import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, TorusGeometry, Vector3, type BufferGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { BearTone } from "../../../core/domain/inventoryBear.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import type { BuiltCar } from "./ToyCar.js";
import { VehicleDriver } from "./VehicleDriver.js";

type Vec3 = [number, number, number];

const SCALE = 1.45;
const WOOD = 0xc4805a;
const DONKEY = 0xb7a9c9;

export class ToyCart {
  private static readonly materials = new Map<string, MeshStandardMaterial>();

  /**
   * Carreta de madera de juguete jalada por un burrito, mirando hacia +x: caja de tablas con vetas, dos ruedas grandes
   * de rayos, banca con un osito que lleva las riendas, farolito y una carga de calabazas y heno.
   *
   * @param tone - Color del pelaje del osito.
   * @returns La carreta con su conductor y su farol.
   */
  static build(tone: BearTone): BuiltCar {
    const cart = new Group();
    const headlights = new MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffd37a, emissiveIntensity: 0.3 });
    const wood = this.material(WOOD, true);
    this.add(cart, new RoundedBoxGeometry(0.62, 0.06, 0.48, 2, 0.02), wood, [-0.2, 0.3, 0]);
    [-1, 1].forEach((side) => this.add(cart, new RoundedBoxGeometry(0.62, 0.14, 0.03, 2, 0.012), wood, [-0.2, 0.39, side * 0.24]));
    this.add(cart, new RoundedBoxGeometry(0.03, 0.14, 0.48, 2, 0.012), wood, [-0.5, 0.39, 0]);
    [-1, 1].forEach((side) => {
      const rim = this.add(cart, new TorusGeometry(0.2, 0.025, 8, 22), this.material(0x6b4a3a), [-0.22, 0.2, side * 0.29]);
      rim.rotation.y = 0;
      for (let spoke = 0; spoke < 4; spoke += 1) {
        const rod = this.add(cart, new CylinderGeometry(0.012, 0.012, 0.38, 5), wood, [-0.22, 0.2, side * 0.29]);
        rod.rotation.z = (spoke / 4) * Math.PI;
      }
      const shaft = this.add(cart, new CylinderGeometry(0.014, 0.014, 0.5, 6), wood, [0.3, 0.3, side * 0.14]);
      shaft.rotation.z = Math.PI / 2 + 0.12;
    });
    this.add(cart, new SphereGeometry(0.16, 12, 8), this.material(0xffe58a), [-0.32, 0.38, 0.05], [1.3, 0.55, 1]);
    [0.0, 0.12].forEach((dz, index) => this.add(cart, new SphereGeometry(0.06, 12, 10), this.material(0xff9a3b), [-0.18 + index * 0.08, 0.4, -0.1 + dz], [1, 0.8, 1]));
    this.add(cart, new RoundedBoxGeometry(0.12, 0.05, 0.4, 2, 0.02), wood, [0.02, 0.44, 0]);
    const lamp = this.add(cart, new SphereGeometry(0.035, 10, 8), headlights, [0.1, 0.62, 0.2]);
    this.add(cart, new CylinderGeometry(0.008, 0.008, 0.26, 5), this.material(0x2a2233), [0.1, 0.47, 0.2]);
    lamp.scale.set(1, 1.2, 1);
    cart.add(this.donkey());
    const driver = VehicleDriver.bear(tone, "ninguno", 0.15);
    driver.group.position.set(0.0, 0.58, 0);
    cart.add(driver.group);
    cart.scale.setScalar(SCALE);
    cart.traverse((part) => {
      part.castShadow = true;
    });
    return { group: cart, headlights, head: driver.head, driver: driver.group, seat: driver.group.position.clone().add(new Vector3(0, 0.1, 0)) };
  }

  private static donkey(): Group {
    const donkey = new Group();
    const fur = this.material(DONKEY);
    const light = this.material(0xf3eefa);
    const dark = this.material(0x2a2233);
    this.add(donkey, new SphereGeometry(0.15, 16, 12), fur, [0, 0.36, 0], [1.5, 0.95, 0.9]);
    this.add(donkey, new SphereGeometry(0.09, 14, 10), fur, [0.2, 0.52, 0], [1.2, 1, 0.9]);
    this.add(donkey, new SphereGeometry(0.06, 12, 10), light, [0.3, 0.49, 0], [1.1, 0.8, 0.9]);
    [-1, 1].forEach((side) => {
      const ear = this.add(donkey, new SphereGeometry(0.03, 10, 8), fur, [0.18, 0.64, side * 0.04], [0.7, 2.4, 0.7]);
      ear.rotation.x = side * 0.3;
      this.add(donkey, new SphereGeometry(0.012, 8, 6), dark, [0.27, 0.55, side * 0.05]);
      [-0.12, 0.12].forEach((x) => this.add(donkey, new CylinderGeometry(0.025, 0.022, 0.24, 8), fur, [x, 0.13, side * 0.07]));
    });
    this.add(donkey, new SphereGeometry(0.025, 8, 6), dark, [-0.24, 0.38, 0], [1.6, 0.8, 0.8]);
    donkey.position.set(0.62, 0, 0);
    return donkey;
  }

  private static material(color: number, grain = false): MeshStandardMaterial {
    const key = `${color}-${grain}`;
    const cached = this.materials.get(key);
    if (cached) return cached;
    const texture = grain ? SurfaceTextures.bark() : SurfaceTextures.fur();
    const created = new MeshStandardMaterial({ color, roughness: 0.75, map: texture, bumpMap: texture, bumpScale: 0.4 });
    this.materials.set(key, created);
    return created;
  }

  private static add(group: Group, geometry: BufferGeometry, material: MeshStandardMaterial, at: Vec3, scale: Vec3 = [1, 1, 1]): Mesh {
    const mesh = new Mesh(geometry, material);
    mesh.position.set(...at);
    mesh.scale.set(...scale);
    group.add(mesh);
    return mesh;
  }
}
