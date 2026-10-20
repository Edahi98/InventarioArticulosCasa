import {
  CapsuleGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  TorusGeometry,
  type BufferGeometry,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { BearTone } from "../../../core/domain/inventoryBear.js";
import { CraftMaterials } from "./CraftMaterials.js";
import type { BuiltShip, ShipSpinner } from "./PirateShip.js";
import { VehicleDriver } from "./VehicleDriver.js";

export type HarborKind = "vapor" | "remos" | "submarino" | "regata" | "rescate";

type Vec3 = [number, number, number];

const TONES: BearTone[] = ["sun", "rose", "sky", "lilac"];

export class HarborBoats {
  /**
   * Barquitos de juguete del puerto, mirando hacia +x: barco de vapor con dos chimeneas y ruedas de paletas que giran,
   * bote de remos con un osito remando, submarino amarillo asomado con periscopio, ojos de buey que brillan y hélice,
   * velero de regata delgado con vela alta numerada y spinnaker, o lancha de rescate con baliza giratoria, salvavidas y
   * cabina. Todos llevan su osito completo.
   *
   * @param kind - Qué barco es.
   * @param seed - Número para variar colores y osito.
   * @returns El barco, sus luces y las piezas que giran o reman.
   */
  static build(kind: HarborKind, seed: number): BuiltShip {
    const boat = new Group();
    const lanterns: MeshStandardMaterial[] = [];
    const spinners: ShipSpinner[] = [];
    const tone = TONES[seed % TONES.length] as BearTone;
    const builders: Record<HarborKind, () => void> = {
      vapor: () => this.steamer(boat, lanterns, spinners, tone),
      remos: () => this.rowboat(boat, spinners, tone),
      submarino: () => this.submarine(boat, lanterns, spinners, tone),
      regata: () => this.racer(boat, tone, seed),
      rescate: () => this.rescue(boat, lanterns, tone),
    };
    builders[kind]();
    boat.traverse((part) => {
      part.castShadow = true;
    });
    return { group: boat, lanterns, spinners };
  }

  private static add(parent: Group, geometry: BufferGeometry, material: MeshStandardMaterial, at: Vec3, scale: Vec3 = [1, 1, 1]): Mesh {
    const mesh = new Mesh(geometry, material);
    mesh.position.set(...at);
    mesh.scale.set(...scale);
    parent.add(mesh);
    return mesh;
  }

  private static hull(boat: Group, length: number, width: number, color: number): void {
    this.add(boat, new RoundedBoxGeometry(length, 0.24, width, 3, 0.1), CraftMaterials.paint(color), [0, 0.08, 0]);
    this.add(boat, new SphereGeometry(width / 2, 14, 10), CraftMaterials.paint(color), [length / 2 - 0.02, 0.08, 0], [1.6, 0.48, 1]);
    this.add(boat, new RoundedBoxGeometry(length + 0.02, 0.035, width + 0.02, 2, 0.015), CraftMaterials.paint(0xfffaf2), [0, 0.17, 0]);
  }

  private static steamer(boat: Group, lanterns: MeshStandardMaterial[], spinners: ShipSpinner[], tone: BearTone): void {
    this.hull(boat, 1.5, 0.5, 0xff6f91);
    this.add(boat, new RoundedBoxGeometry(0.9, 0.22, 0.42, 2, 0.06), CraftMaterials.paint(0xfffaf2), [-0.05, 0.32, 0]);
    this.add(boat, new RoundedBoxGeometry(0.6, 0.18, 0.36, 2, 0.05), CraftMaterials.paint(0x7fd0ea), [-0.1, 0.52, 0]);
    const glow = CraftMaterials.lantern();
    lanterns.push(glow);
    [-0.35, -0.15, 0.05, 0.25].forEach((x) => [-1, 1].forEach((side) => this.add(boat, new SphereGeometry(0.028, 8, 6), glow, [x, 0.33, side * 0.212])));
    [0.05, -0.25].forEach((x) => {
      this.add(boat, new CylinderGeometry(0.06, 0.07, 0.45, 12), CraftMaterials.paint(0x2a2233), [x, 0.82, 0]);
      this.add(boat, new TorusGeometry(0.065, 0.015, 6, 14), CraftMaterials.paint(0xff6f91), [x, 0.95, 0]).rotation.x = Math.PI / 2;
    });
    [-1, 1].forEach((side) => {
      const wheel = new Group();
      this.add(wheel, new TorusGeometry(0.2, 0.025, 6, 18), CraftMaterials.paint(0xff4f5b), [0, 0, 0]);
      for (let paddle = 0; paddle < 6; paddle += 1) {
        const blade = this.add(wheel, new RoundedBoxGeometry(0.04, 0.4, 0.1, 1, 0.01), CraftMaterials.wood(0xc4805a), [0, 0, 0]);
        blade.rotation.z = (paddle / 6) * Math.PI;
      }
      wheel.position.set(0.1, 0.14, side * 0.33);
      boat.add(wheel);
      spinners.push({ object: wheel, speed: -2.4, axis: "z" });
      this.add(boat, new SphereGeometry(0.23, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), CraftMaterials.paint(0xfffaf2), [0.1, 0.2, side * 0.33], [1, 0.8, 0.4]);
    });
    const captain = VehicleDriver.standing(tone, "capitan", 0.1);
    captain.group.position.set(0.3, 0.62, 0);
    captain.group.rotation.y = Math.PI / 2;
    boat.add(captain.group);
  }

  private static rowboat(boat: Group, spinners: ShipSpinner[], tone: BearTone): void {
    this.hull(boat, 0.8, 0.36, 0x7fd0ea);
    this.add(boat, new RoundedBoxGeometry(0.08, 0.03, 0.34, 1, 0.01), CraftMaterials.wood(0xc4805a), [0, 0.22, 0]);
    const rower = VehicleDriver.bear(tone, "marinero", 0.13);
    rower.group.position.set(0, 0.32, 0);
    rower.group.rotation.y = Math.PI;
    boat.add(rower.group);
    [-1, 1].forEach((side) => {
      const oar = new Group();
      this.add(oar, new CylinderGeometry(0.012, 0.012, 0.55, 5), CraftMaterials.wood(0xc4805a), [0, 0, 0.27]).rotation.x = Math.PI / 2 - side * 0.3;
      this.add(oar, new RoundedBoxGeometry(0.1, 0.02, 0.14, 1, 0.008), CraftMaterials.wood(0xc4805a), [0, -0.08, side * 0.5]);
      oar.position.set(0, 0.24, side * 0.12);
      if (side < 0) oar.scale.z = -1;
      boat.add(oar);
      spinners.push({ object: oar, speed: 3, axis: "remo" });
    });
  }

  private static submarine(boat: Group, lanterns: MeshStandardMaterial[], spinners: ShipSpinner[], tone: BearTone): void {
    const yellow = CraftMaterials.paint(0xffd84d);
    this.add(boat, new CapsuleGeometry(0.22, 0.9, 6, 16), yellow, [0, -0.05, 0]).rotation.z = Math.PI / 2;
    this.add(boat, new RoundedBoxGeometry(0.32, 0.26, 0.2, 2, 0.07), yellow, [0.05, 0.25, 0]);
    this.add(boat, new CylinderGeometry(0.015, 0.015, 0.3, 6), CraftMaterials.paint(0x3a2a40), [0.15, 0.5, 0]);
    this.add(boat, new CylinderGeometry(0.02, 0.02, 0.08, 6), CraftMaterials.paint(0x3a2a40), [0.19, 0.64, 0]).rotation.z = Math.PI / 2;
    const glow = CraftMaterials.lantern();
    lanterns.push(glow);
    [-0.3, 0, 0.3].forEach((x) => [-1, 1].forEach((side) => this.add(boat, new TorusGeometry(0.05, 0.015, 6, 14), CraftMaterials.paint(0x3a2a40), [x, 0.04, side * 0.205])));
    [-0.3, 0, 0.3].forEach((x) => [-1, 1].forEach((side) => this.add(boat, new SphereGeometry(0.04, 10, 8), glow, [x, 0.04, side * 0.2], [1, 1, 0.4])));
    const propeller = new Group();
    for (let blade = 0; blade < 3; blade += 1) {
      const arm = new Group();
      this.add(arm, new RoundedBoxGeometry(0.02, 0.18, 0.06, 1, 0.008), CraftMaterials.paint(0xff6f91), [0, 0.08, 0]);
      arm.rotation.x = (blade / 3) * Math.PI * 2;
      propeller.add(arm);
    }
    propeller.position.set(-0.68, -0.05, 0);
    boat.add(propeller);
    spinners.push({ object: propeller, speed: 8, axis: "x" });
    const pilot = VehicleDriver.standing(tone, "marinero", 0.08);
    pilot.group.position.set(0.05, 0.38, 0);
    pilot.group.rotation.y = Math.PI / 2;
    boat.add(pilot.group);
  }

  private static racer(boat: Group, tone: BearTone, seed: number): void {
    this.hull(boat, 1.2, 0.3, seed % 2 === 0 ? 0x2a3a6b : 0xfffaf2);
    this.add(boat, new CylinderGeometry(0.018, 0.02, 1.6, 6), CraftMaterials.paint(0xe6ebf2), [0.05, 1.0, 0]);
    const main = new Shape();
    main.moveTo(0, 0);
    main.lineTo(0, 1.4);
    main.lineTo(-0.5, 0.05);
    main.closePath();
    this.add(boat, new ShapeGeometry(main), new MeshStandardMaterial({ color: 0xfffaf2, side: DoubleSide, roughness: 0.7 }), [0.03, 0.25, 0]);
    const jib = new Shape();
    jib.moveTo(0, 0);
    jib.quadraticCurveTo(0.45, 0.5, 0, 1.2);
    jib.lineTo(0, 0);
    this.add(boat, new ShapeGeometry(jib), new MeshStandardMaterial({ color: seed % 2 === 0 ? 0xff6f91 : 0x7fd0ea, side: DoubleSide, roughness: 0.7 }), [0.08, 0.25, 0]);
    const sailor = VehicleDriver.bear(tone, "lentes", 0.12);
    sailor.group.position.set(-0.4, 0.3, 0);
    boat.add(sailor.group);
  }

  private static rescue(boat: Group, lanterns: MeshStandardMaterial[], tone: BearTone): void {
    this.hull(boat, 1.3, 0.48, 0xff8a3b);
    this.add(boat, new RoundedBoxGeometry(0.5, 0.3, 0.4, 2, 0.08), CraftMaterials.paint(0xfffaf2), [-0.05, 0.36, 0]);
    this.add(boat, new RoundedBoxGeometry(0.06, 0.14, 0.34, 1, 0.02), new MeshStandardMaterial({ color: 0xcfe6ee, roughness: 0.15 }), [0.21, 0.4, 0]);
    const beacon = new MeshStandardMaterial({ color: 0xff4f5b, emissive: 0xff3b3b, emissiveIntensity: 0.6 });
    lanterns.push(beacon);
    this.add(boat, new SphereGeometry(0.06, 12, 10), beacon, [-0.05, 0.57, 0]);
    [-1, 1].forEach((side) => this.add(boat, new TorusGeometry(0.07, 0.025, 8, 16), CraftMaterials.paint(0xff4f5b), [-0.35, 0.3, side * 0.25]));
    const captain = VehicleDriver.bear(tone, "marinero", 0.14);
    captain.group.position.set(0.0, 0.42, 0);
    boat.add(captain.group);
  }
}
