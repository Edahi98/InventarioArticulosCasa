import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, TorusGeometry, Vector3, type BufferGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { BearTone } from "../../../core/domain/inventoryBear.js";
import { StarGeometry } from "../StarGeometry.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import type { BuiltCar } from "./ToyCar.js";
import { VehicleCargo } from "./VehicleCargo.js";
import { VehicleDriver, type DriverHat } from "./VehicleDriver.js";

export type ServiceKind = "ambulancia" | "bomberos" | "patrulla" | "autobus" | "reparto";

type Vec3 = [number, number, number];

const SCALE = 1.45;
const GLASS = 0xcfe6ee;
const TIRE = 0x3a2a40;
const CHROME = 0xe6ebf2;
const HATS: Record<ServiceKind, DriverHat> = { ambulancia: "gorra", bomberos: "capitan", patrulla: "gorra", autobus: "lentes", reparto: "gorra" };

export class ServiceVehicle {
  private static readonly materials = new Map<string, MeshStandardMaterial>();

  /**
   * Vehículo de servicio de juguete con un osito al volante, mirando hacia +x: ambulancia con cruz roja y sirena,
   * camión de bomberos con escalera y manguera, patrulla con barra de luces y estrella, autobús escolar con su fila de
   * ventanas y su letrero de alto, o camión de reparto con su caja de paquetes. Todo de aristas redondas, con faros que
   * se encienden de noche y sirenas que parpadean.
   *
   * @param kind - Qué vehículo es.
   * @param tone - Color del pelaje del osito.
   * @param seed - Número que reparte la carga.
   * @returns El vehículo con su conductor, sus faros y sus sirenas.
   */
  static build(kind: ServiceKind, tone: BearTone, seed: number): BuiltCar {
    const car = new Group();
    const headlights = new MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffe9a8, emissiveIntensity: 0.3 });
    const sirens: MeshStandardMaterial[] = [];
    const builders: Record<ServiceKind, () => { cabX: number; length: number; driverY: number }> = {
      ambulancia: () => this.ambulance(car, sirens),
      bomberos: () => this.fireTruck(car, sirens),
      patrulla: () => this.patrol(car, sirens),
      autobus: () => this.bus(car),
      reparto: () => this.delivery(car, seed),
    };
    const { cabX, length, driverY } = builders[kind]();
    this.wheels(car, length);
    [-0.15, 0.15].forEach((z) => {
      this.add(car, new SphereGeometry(0.05, 10, 8), headlights, [length / 2 + 0.005, 0.27, z], [0.6, 1, 1]);
      this.add(car, new RoundedBoxGeometry(0.02, 0.07, 0.07, 2, 0.008), this.tail(), [-length / 2 - 0.005, 0.3, z]);
    });
    [length / 2 + 0.02, -length / 2 - 0.02].forEach((x) => this.add(car, new RoundedBoxGeometry(0.04, 0.06, 0.54, 2, 0.02), this.paint(CHROME, 0.25), [x, 0.15, 0]));
    const driver = VehicleDriver.bear(tone, HATS[kind], 0.16);
    driver.group.position.set(cabX, driverY, 0);
    const wheel = VehicleDriver.wheel();
    wheel.position.set(cabX + 0.2, driverY + 0.1, 0);
    car.add(driver.group, wheel);
    car.scale.setScalar(SCALE);
    car.traverse((part) => {
      part.castShadow = true;
    });
    return { group: car, headlights, head: driver.head, driver: driver.group, seat: driver.group.position.clone().add(new Vector3(0, 0.1, 0)), sirens };
  }

  private static paint(color: number, roughness = 0.45): MeshStandardMaterial {
    const key = `${color}-${roughness}`;
    const cached = this.materials.get(key);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness, metalness: 0.05, map: SurfaceTextures.clay(), bumpMap: SurfaceTextures.clay(), bumpScale: 0.25 });
    this.materials.set(key, created);
    return created;
  }

  private static glass(): MeshStandardMaterial {
    const cached = this.materials.get("glass");
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color: GLASS, roughness: 0.15, transparent: true, opacity: 0.45, depthWrite: false });
    this.materials.set("glass", created);
    return created;
  }

  private static tail(): MeshStandardMaterial {
    const cached = this.materials.get("tail");
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color: 0xff4f6d, emissive: 0xff2f55, emissiveIntensity: 0.5 });
    this.materials.set("tail", created);
    return created;
  }

  private static siren(color: number, sirens: MeshStandardMaterial[]): MeshStandardMaterial {
    const material = new MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.3 });
    sirens.push(material);
    return material;
  }

  private static add(car: Group, geometry: BufferGeometry, material: MeshStandardMaterial, at: Vec3, scale: Vec3 = [1, 1, 1]): Mesh {
    const mesh = new Mesh(geometry, material);
    mesh.position.set(...at);
    mesh.scale.set(...scale);
    car.add(mesh);
    return mesh;
  }

  private static block(car: Group, size: Vec3, color: number | MeshStandardMaterial, at: Vec3, radius = 0.06): Mesh {
    const material = typeof color === "number" ? this.paint(color) : color;
    return this.add(car, new RoundedBoxGeometry(size[0], size[1], size[2], 3, Math.min(radius, Math.min(...size) / 2 - 0.002)), material, at);
  }

  private static wheels(car: Group, length: number): void {
    const tyre = new CylinderGeometry(0.11, 0.11, 0.08, 18);
    const hub = new CylinderGeometry(0.06, 0.06, 0.085, 14);
    [length * 0.32, -length * 0.32].forEach((x) =>
      [-0.26, 0.26].forEach((z) => {
        this.add(car, tyre, this.paint(TIRE, 0.9), [x, 0.11, z]).rotation.x = Math.PI / 2;
        this.add(car, hub, this.paint(CHROME, 0.2), [x, 0.11, z]).rotation.x = Math.PI / 2;
      }),
    );
  }

  private static cab(car: Group, color: number, x: number, length: number, height: number): void {
    this.block(car, [length, 0.24, 0.52], color, [x, 0.27, 0]);
    this.block(car, [length * 0.8, height, 0.48], this.glass(), [x - length * 0.05, 0.39 + height / 2, 0], 0.05);
    this.block(car, [length * 0.82, 0.04, 0.5], color, [x - length * 0.05, 0.39 + height, 0], 0.02);
  }

  private static ambulance(car: Group, sirens: MeshStandardMaterial[]): { cabX: number; length: number; driverY: number } {
    const white = 0xfffaf2;
    const red = 0xff4f5b;
    this.cab(car, white, 0.42, 0.34, 0.24);
    this.block(car, [0.82, 0.58, 0.54], white, [-0.16, 0.45, 0], 0.08);
    this.block(car, [0.83, 0.07, 0.55], red, [-0.16, 0.36, 0], 0.03);
    [-1, 1].forEach((side) => {
      this.block(car, [0.18, 0.05, 0.02], red, [-0.18, 0.56, side * 0.275], 0.01);
      this.block(car, [0.05, 0.18, 0.02], red, [-0.18, 0.56, side * 0.275], 0.01);
      this.block(car, [0.22, 0.16, 0.02], this.glass(), [0.12, 0.6, side * 0.272], 0.02);
    });
    this.block(car, [0.08, 0.06, 0.32], this.siren(0xff3b4f, sirens), [0.44, 0.69, -0.09], 0.025);
    this.block(car, [0.08, 0.06, 0.12], this.siren(0x3b8bff, sirens), [0.44, 0.69, 0.13], 0.025);
    return { cabX: 0.38, length: 1.18, driverY: 0.42 };
  }

  private static fireTruck(car: Group, sirens: MeshStandardMaterial[]): { cabX: number; length: number; driverY: number } {
    const red = 0xe8402d;
    this.cab(car, red, 0.5, 0.36, 0.26);
    this.block(car, [0.96, 0.4, 0.54], red, [-0.18, 0.37, 0], 0.07);
    this.block(car, [0.97, 0.05, 0.55], 0xfffaf2, [-0.18, 0.3, 0], 0.02);
    [-1, 1].forEach((side) => {
      [-0.5, -0.24, 0.02].forEach((x) => this.block(car, [0.2, 0.18, 0.02], this.paint(CHROME, 0.25), [x, 0.42, side * 0.275], 0.02));
      this.block(car, [1.02, 0.03, 0.03], this.paint(CHROME, 0.25), [-0.22, 0.66, side * 0.14], 0.01);
    });
    for (let rung = 0; rung < 8; rung += 1) this.block(car, [0.025, 0.025, 0.3], this.paint(CHROME, 0.25), [-0.68 + rung * 0.13, 0.66, 0], 0.01);
    this.add(car, new TorusGeometry(0.09, 0.035, 8, 18), this.paint(0xffe35c), [-0.5, 0.62, 0]).rotation.x = Math.PI / 2;
    this.block(car, [0.08, 0.06, 0.4], this.siren(0xff3b4f, sirens), [0.5, 0.73, 0], 0.025);
    return { cabX: 0.48, length: 1.36, driverY: 0.42 };
  }

  private static patrol(car: Group, sirens: MeshStandardMaterial[]): { cabX: number; length: number; driverY: number } {
    const navy = 0x2a3a6b;
    this.block(car, [1.02, 0.24, 0.52], navy, [0, 0.27, 0]);
    [-1, 1].forEach((side) => {
      this.block(car, [0.44, 0.16, 0.02], 0xfffaf2, [0, 0.28, side * 0.262], 0.02);
      const badge = this.add(car, StarGeometry.build(), this.paint(0xffd43b, 0.3), [0, 0.29, side * 0.275], [0.045, 0.045, 0.045]);
      badge.rotation.y = side > 0 ? 0 : Math.PI;
    });
    this.block(car, [0.52, 0.26, 0.48], this.glass(), [-0.04, 0.52, 0], 0.06);
    this.block(car, [0.5, 0.04, 0.48], 0xfffaf2, [-0.04, 0.66, 0], 0.02);
    this.block(car, [0.08, 0.06, 0.18], this.siren(0xff3b4f, sirens), [-0.04, 0.71, -0.11], 0.025);
    this.block(car, [0.08, 0.06, 0.18], this.siren(0x3b8bff, sirens), [-0.04, 0.71, 0.11], 0.025);
    return { cabX: -0.02, length: 1.02, driverY: 0.42 };
  }

  private static bus(car: Group): { cabX: number; length: number; driverY: number } {
    const yellow = 0xffc93b;
    this.block(car, [1.5, 0.32, 0.56], yellow, [0, 0.32, 0], 0.08);
    this.block(car, [1.51, 0.04, 0.57], 0x2a2233, [0, 0.27, 0], 0.02);
    this.block(car, [1.51, 0.03, 0.57], 0x2a2233, [0, 0.4, 0], 0.015);
    this.block(car, [1.44, 0.26, 0.52], this.glass(), [0, 0.6, 0], 0.04);
    this.block(car, [1.5, 0.07, 0.56], yellow, [0, 0.76, 0], 0.035);
    [-1, 1].forEach((side) => {
      for (let pillar = 0; pillar < 7; pillar += 1) this.block(car, [0.04, 0.26, 0.03], yellow, [-0.7 + pillar * 0.233, 0.6, side * 0.265], 0.012);
    });
    const stop = this.add(car, new CylinderGeometry(0.06, 0.06, 0.015, 8), this.paint(0xff3b4f), [0.45, 0.48, -0.31]);
    stop.rotation.x = Math.PI / 2;
    this.add(car, new SphereGeometry(0.03, 8, 6), this.paint(0xff6b2d), [0.73, 0.76, 0.2]);
    this.add(car, new SphereGeometry(0.03, 8, 6), this.paint(0xff6b2d), [0.73, 0.76, -0.2]);
    return { cabX: 0.5, length: 1.5, driverY: 0.46 };
  }

  private static delivery(car: Group, seed: number): { cabX: number; length: number; driverY: number } {
    const teal = 0x59c9b6;
    this.cab(car, teal, 0.42, 0.36, 0.26);
    this.block(car, [0.78, 0.6, 0.56], 0xfff1e0, [-0.18, 0.47, 0], 0.07);
    [-1, 1].forEach((side) => {
      this.block(car, [0.42, 0.06, 0.02], teal, [-0.18, 0.5, side * 0.285], 0.02);
      this.block(car, [0.06, 0.36, 0.02], teal, [-0.18, 0.5, side * 0.285], 0.02);
    });
    const crate = VehicleCargo.crate(seed % 2 === 0 ? 0xffb066 : 0xb89cf2);
    crate.position.set(-0.2, 0.8, 0);
    crate.scale.setScalar(0.7);
    car.add(crate);
    return { cabX: 0.38, length: 1.14, driverY: 0.42 };
  }
}
