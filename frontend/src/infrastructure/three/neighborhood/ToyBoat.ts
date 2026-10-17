import { BoxGeometry, ConeGeometry, CylinderGeometry, ExtrudeGeometry, Group, Mesh, MeshStandardMaterial, Shape, TorusGeometry, type BufferGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { BearTone } from "../../../core/domain/inventoryBear.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { VehicleCargo } from "./VehicleCargo.js";
import { VehicleDriver } from "./VehicleDriver.js";

export type BoatKind = "velero" | "carguero" | "pesquero" | "lancha";

const WHITE = 0xfffaf2;
const WOOD = 0xb57a46;
const DARK = 0x2a2233;

export class ToyBoat {
  private static readonly materials = new Map<number, MeshStandardMaterial>();

  /**
   * Barquito de juguete con un osito al timón y su carga. Mira hacia +x.
   * El velero lleva una laptop y una caja; el carguero, contenedores con computadoras y un barril; el pesquero, cajones
   * de pescado, una red y una caña; la lancha, anteojos de sol y computadoras en la popa.
   *
   * @param color - Color del casco.
   * @param kind - Tipo de barco.
   * @param tone - Color del pelaje del osito.
   * @param seed - Número que reparte la carga entre un barco y otro.
   * @returns El barco listo para ponerlo sobre el agua.
   */
  static build(color: number, kind: BoatKind, tone: BearTone, seed = 0): Group {
    const boat = new Group();
    const builders: Record<BoatKind, () => void> = {
      velero: () => this.sailboat(boat, color, tone),
      carguero: () => this.freighter(boat, color, tone, seed),
      pesquero: () => this.trawler(boat, color, tone),
      lancha: () => this.speedboat(boat, color, tone, seed),
    };
    builders[kind]();
    boat.traverse((part) => {
      part.castShadow = true;
    });
    return boat;
  }

  private static hull(boat: Group, length: number, width: number, color: number): void {
    const hull = new Mesh(new RoundedBoxGeometry(length, 0.26, width, 3, 0.1), this.material(color));
    hull.position.y = 0.1;
    const stripe = this.part(new BoxGeometry(length + 0.005, 0.04, width + 0.005), WHITE, [0, 0.19, 0]);
    const waterline = this.part(new BoxGeometry(length + 0.005, 0.04, width + 0.005), 0xc4235f, [0, -0.01, 0]);
    const bow = new Mesh(new ConeGeometry(width / 2, 0.36, 4), this.material(color));
    bow.rotation.z = -Math.PI / 2;
    bow.rotation.x = Math.PI / 4;
    bow.position.set(length / 2 + 0.12, 0.1, 0);
    boat.add(hull, stripe, waterline, bow);
  }

  private static helm(boat: Group, tone: BearTone, hat: "marinero" | "capitan" | "gorra" | "lentes", x: number, y: number): void {
    const head = VehicleDriver.head(tone, hat);
    head.position.set(x, y, 0);
    const wheel = VehicleDriver.wheel();
    wheel.position.set(x + 0.19, y - 0.1, 0);
    boat.add(head, wheel);
  }

  private static sailboat(boat: Group, color: number, tone: BearTone): void {
    this.hull(boat, 1.2, 0.46, color);
    const outline = new Shape();
    outline.moveTo(0, 0);
    outline.lineTo(0, 0.95);
    outline.lineTo(0.55, 0.05);
    outline.closePath();
    const sail = new Mesh(new ExtrudeGeometry(outline, { depth: 0.03, bevelEnabled: false }), this.material(WHITE));
    sail.position.set(0.08, 0.3, -0.015);
    const flag = this.part(new BoxGeometry(0.16, 0.08, 0.01), 0xffe35c, [0.04, 1.28, 0]);
    const buoy = new Mesh(new TorusGeometry(0.07, 0.025, 8, 16), this.material(0xff4f6d));
    buoy.position.set(-0.1, 0.22, 0.235);
    boat.add(this.part(new CylinderGeometry(0.025, 0.025, 1.1, 8), 0x6b4a6a, [0.05, 0.75, 0]), sail, flag, buoy);
    this.helm(boat, tone, "marinero", -0.4, 0.42);
    const laptop = VehicleCargo.laptop();
    laptop.position.set(-0.5, 0.23, 0.14);
    laptop.scale.setScalar(0.8);
    const crate = VehicleCargo.crate(0x7fd0ea);
    crate.position.set(-0.05, 0.23, -0.12);
    crate.scale.setScalar(0.85);
    boat.add(laptop, crate);
  }

  private static freighter(boat: Group, color: number, tone: BearTone, seed: number): void {
    this.hull(boat, 1.5, 0.52, color);
    const cabin = this.part(new BoxGeometry(0.4, 0.3, 0.4), WHITE, [-0.52, 0.38, 0]);
    const windows = new Mesh(new BoxGeometry(0.02, 0.12, 0.32), new MeshStandardMaterial({ color: 0xfff6dc, transparent: true, opacity: 0.5 }));
    windows.position.set(-0.32, 0.4, 0);
    const chimney = this.part(new CylinderGeometry(0.05, 0.06, 0.24, 12), 0xff6b6b, [-0.62, 0.65, 0]);
    const band = this.part(new CylinderGeometry(0.056, 0.056, 0.05, 12), 0x2a2233, [-0.62, 0.7, 0]);
    boat.add(cabin, windows, chimney, band);
    this.helm(boat, tone, "capitan", -0.5, 0.52);
    [[0.0, 0x7fd0ea], [0.34, 0xffb066]].forEach(([x, tint], index) => {
      boat.add(this.part(new BoxGeometry(0.3, 0.2, 0.28), tint as number, [x as number, 0.34, 0]));
      const load = index === 0 ? VehicleCargo.computer() : VehicleCargo.crate(0xffe35c);
      load.position.set(x as number, 0.44, 0);
      load.scale.setScalar(0.8);
      boat.add(load);
    });
    const barrel = VehicleCargo.barrel();
    barrel.position.set(0.62 + (seed % 2) * 0.0, 0.23, 0.14);
    barrel.scale.setScalar(0.85);
    boat.add(barrel);
  }

  private static trawler(boat: Group, color: number, tone: BearTone): void {
    this.hull(boat, 1.1, 0.5, color);
    boat.add(this.part(new BoxGeometry(0.3, 0.26, 0.36), WHITE, [-0.28, 0.36, 0]), this.part(new CylinderGeometry(0.02, 0.02, 0.85, 8), WOOD, [0.12, 0.62, 0]));
    this.helm(boat, tone, "gorra", -0.28, 0.52);
    const net = new Mesh(new TorusGeometry(0.2, 0.012, 6, 18, Math.PI), this.material(0xfff6dc));
    net.position.set(0.12, 0.62, 0);
    net.rotation.set(0, Math.PI / 2, Math.PI);
    const rod = this.part(new CylinderGeometry(0.008, 0.012, 0.7, 6), 0x5a3d57, [0.62, 0.5, 0.0]);
    rod.rotation.z = -0.9;
    const line = this.part(new CylinderGeometry(0.003, 0.003, 0.45, 4), WHITE, [0.86, 0.45, 0]);
    boat.add(net, rod, line);
    [0.05, 0.4].forEach((x, index) => {
      const crate = VehicleCargo.fishCrate();
      crate.position.set(x, 0.23, index === 0 ? 0.14 : -0.14);
      crate.scale.setScalar(0.9);
      boat.add(crate);
    });
  }

  private static speedboat(boat: Group, color: number, tone: BearTone, seed: number): void {
    this.hull(boat, 0.95, 0.42, color);
    const windshield = new Mesh(new BoxGeometry(0.02, 0.16, 0.34), new MeshStandardMaterial({ color: 0xfff6dc, transparent: true, opacity: 0.45 }));
    windshield.position.set(0.12, 0.34, 0);
    windshield.rotation.z = -0.5;
    const motor = this.part(new BoxGeometry(0.1, 0.2, 0.12), DARK, [-0.54, 0.16, 0]);
    const shaft = this.part(new CylinderGeometry(0.02, 0.02, 0.2, 8), DARK, [-0.56, -0.05, 0]);
    boat.add(windshield, motor, shaft, this.part(new BoxGeometry(0.5, 0.025, 0.1), 0xffe35c, [0, 0.215, 0.14]));
    this.helm(boat, tone, "lentes", -0.02, 0.42);
    const pile = VehicleCargo.pile(seed + 2);
    pile.position.set(-0.32, 0.23, 0);
    pile.scale.setScalar(0.7);
    boat.add(pile);
  }

  private static material(color: number): MeshStandardMaterial {
    const cached = this.materials.get(color);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness: 0.6, map: SurfaceTextures.clay(), bumpMap: SurfaceTextures.clay(), bumpScale: 0.3 });
    this.materials.set(color, created);
    return created;
  }

  private static part(geometry: BufferGeometry, color: number, at: [number, number, number]): Mesh {
    const mesh = new Mesh(geometry, this.material(color));
    mesh.position.set(...at);
    return mesh;
  }
}
