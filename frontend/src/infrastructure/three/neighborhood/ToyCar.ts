import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry } from "three";
import type { BearTone } from "../../../core/domain/inventoryBear.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { VehicleCargo } from "./VehicleCargo.js";
import { VehicleDriver, type DriverHat } from "./VehicleDriver.js";

export type CarKind = "pickup" | "camioneta" | "sedan";

export interface BuiltCar {
  group: Group;
  headlights: MeshStandardMaterial;
  head: Group;
}

const GLASS = 0xfff6dc;
const TIRE = 0x3a2a40;
const CAR_SCALE = 1.45;
const HATS: Record<CarKind, DriverHat> = { pickup: "gorra", camioneta: "lentes", sedan: "ninguno" };

export class ToyCar {
  /**
   * Coche de juguete con un osito al volante y su carga: una pickup con computadoras y cajas en la caja,
   * una camioneta de reparto con cajas y una laptop en el techo, o un sedán con maleta y planta en el portaequipajes.
   * Las ventanas son transparentes para ver al conductor, y los faros se encienden de noche. Mira hacia +x.
   *
   * @param color - Color de la carrocería.
   * @param kind - Tipo de vehículo.
   * @param tone - Color del pelaje del osito.
   * @param seed - Número que reparte la carga entre un coche y otro.
   * @returns El coche, el material de sus faros y la cabeza del conductor (para que cabecee).
   */
  static build(color: number, kind: CarKind = "sedan", tone: BearTone = "rose", seed = 0): BuiltCar {
    const body = new MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.05, map: SurfaceTextures.clay(), bumpMap: SurfaceTextures.clay(), bumpScale: 0.3 });
    const glass = new MeshStandardMaterial({ color: GLASS, roughness: 0.25, transparent: true, opacity: 0.45 });
    const tire = new MeshStandardMaterial({ color: TIRE, roughness: 0.9 });
    const trim = new MeshStandardMaterial({ color: 0xc9d1d9, roughness: 0.4, metalness: 0.3 });
    const headlights = new MeshStandardMaterial({ color: GLASS, emissive: 0xffe9a8, emissiveIntensity: 0.3 });
    const taillights = new MeshStandardMaterial({ color: 0xff4f6d, emissive: 0xff2f55, emissiveIntensity: 0.5 });

    const car = new Group();
    const parts = ToyCar.layout(kind);
    const chassis = new Mesh(new BoxGeometry(parts.length, 0.24, 0.5), body);
    chassis.position.set(parts.chassisX, 0.26, 0);
    car.add(chassis);

    const cabin = new Mesh(new BoxGeometry(parts.cabinLength, parts.cabinHeight, 0.44), glass);
    cabin.position.set(parts.cabinX, 0.38 + parts.cabinHeight / 2, 0);
    car.add(cabin);
    if (kind === "camioneta") {
      const roof = new Mesh(new BoxGeometry(parts.cabinLength + 0.04, 0.03, 0.46), body);
      roof.position.set(parts.cabinX, 0.38 + parts.cabinHeight, 0);
      car.add(roof);
    }

    const driver = VehicleDriver.bear(tone, HATS[kind], parts.driverScale);
    driver.group.position.set(parts.cabinX + 0.02, 0.44, 0);
    const wheel = VehicleDriver.wheel();
    wheel.position.set(parts.cabinX + 0.02 + parts.driverScale * 1.25, 0.5, 0);
    car.add(driver.group, wheel);

    [-0.3, 0.3].forEach((x) =>
      [-0.25, 0.25].forEach((z) => {
        const tyre = new Mesh(new CylinderGeometry(0.1, 0.1, 0.08, 14), tire);
        tyre.rotation.x = Math.PI / 2;
        tyre.position.set(x * (parts.length / 0.95), 0.1, z);
        const hub = new Mesh(new CylinderGeometry(0.05, 0.05, 0.085, 10), trim);
        hub.rotation.x = Math.PI / 2;
        hub.position.copy(tyre.position);
        car.add(tyre, hub);
      }),
    );
    [-0.16, 0.16].forEach((z) => {
      const lamp = new Mesh(new SphereGeometry(0.05, 10, 8), headlights);
      lamp.position.set(parts.chassisX + parts.length / 2 + 0.01, 0.28, z);
      const back = new Mesh(new BoxGeometry(0.02, 0.06, 0.08), taillights);
      back.position.set(parts.chassisX - parts.length / 2 - 0.005, 0.3, z);
      car.add(lamp, back);
    });
    [parts.chassisX + parts.length / 2, parts.chassisX - parts.length / 2].forEach((x) => {
      const bumper = new Mesh(new BoxGeometry(0.03, 0.05, 0.52), trim);
      bumper.position.set(x, 0.16, 0);
      car.add(bumper);
    });

    ToyCar.carry(car, kind, parts.cabinX, seed);
    car.scale.setScalar(CAR_SCALE);
    car.traverse((part) => {
      part.castShadow = true;
    });
    return { group: car, headlights, head: driver.head };
  }

  private static layout(kind: CarKind): { length: number; chassisX: number; cabinX: number; cabinLength: number; cabinHeight: number; driverScale: number } {
    const layouts = {
      pickup: { length: 1.05, chassisX: 0, cabinX: 0.2, cabinLength: 0.38, cabinHeight: 0.26, driverScale: 0.18 },
      camioneta: { length: 1.05, chassisX: 0, cabinX: 0.05, cabinLength: 0.85, cabinHeight: 0.36, driverScale: 0.16 },
      sedan: { length: 0.95, chassisX: 0, cabinX: -0.05, cabinLength: 0.5, cabinHeight: 0.28, driverScale: 0.18 },
    } as const;
    return layouts[kind];
  }

  private static carry(car: Group, kind: CarKind, cabinX: number, seed: number): void {
    const loads: Record<CarKind, () => void> = {
      pickup: () => {
        const bed = new Mesh(new BoxGeometry(0.44, 0.04, 0.5), new MeshStandardMaterial({ color: 0x5a3d57, roughness: 0.8 }));
        bed.position.set(-0.3, 0.4, 0);
        const pile = VehicleCargo.pile(seed);
        pile.position.set(-0.45, 0.42, 0);
        pile.scale.setScalar(0.85);
        car.add(bed, pile);
      },
      camioneta: () => {
        const rack = VehicleCargo.crate(0x7fd0ea);
        rack.position.set(-0.2, 0.74, -0.08);
        const laptop = VehicleCargo.laptop();
        laptop.position.set(0.15, 0.74, 0.08);
        laptop.scale.setScalar(0.8);
        car.add(rack, laptop);
      },
      sedan: () => {
        const suitcase = VehicleCargo.suitcase(seed % 2 === 0 ? 0xb89cf2 : 0xffe35c);
        suitcase.position.set(cabinX - 0.02, 0.69, 0);
        suitcase.scale.setScalar(0.8);
        const plant = VehicleCargo.plant();
        plant.position.set(cabinX - 0.18, 0.69, 0.1);
        plant.scale.setScalar(0.8);
        car.add(suitcase, plant);
      },
    };
    loads[kind]();
  }
}
