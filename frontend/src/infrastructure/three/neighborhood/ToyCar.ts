import { BoxGeometry, BufferGeometry, CylinderGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, SphereGeometry, TorusGeometry, Vector3 } from "three";
import type { BearTone } from "../../../core/domain/inventoryBear.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { VehicleCargo } from "./VehicleCargo.js";
import { VehicleDriver, type DriverHat } from "./VehicleDriver.js";

export type CarKind = "vocho" | "pickup" | "camioneta" | "sedan";

export interface BuiltCar {
  group: Group;
  headlights: MeshStandardMaterial;
  head: Group;
  driver: Group;
  seat: Vector3;
  sirens?: MeshStandardMaterial[];
}

const GLASS = 0xfff6dc;
const TIRE = 0x3a2a40;
const CAR_SCALE = 1.45;
const BEETLE_BODY_POWER = 3.6;
const BEETLE_SHELL_POWER = 2.8;
const BEETLE_PEAK = -0.04;

type Section = [number, number, number];
const HATS: Record<CarKind, DriverHat> = { vocho: "gorra", pickup: "gorra", camioneta: "lentes", sedan: "ninguno" };

export class ToyCar {
  /**
   * Coche de juguete con un osito al volante y su carga: un vocho clásico con maleta en el techo, una pickup con computadoras y cajas en la caja,
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
    if (kind === "vocho") return ToyCar.beetle(color, tone, seed);
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
    return { group: car, headlights, head: driver.head, driver: driver.group, seat: driver.group.position.clone().add(new Vector3(0, 0.1, 0)) };
  }

  /**
   * Vocho clásico con su silueta de perfil: una sola curva que sube del capó corto a un techo alto y redondo y cae larga
   * hasta la cola. El cuerpo, la cúpula de vidrio (para ver al osito), el techo, los pilares y las salpicaderas salen de
   * cortes transversales suaves; lleva ventana trasera, faros redondos sobre las salpicaderas delanteras, estribos,
   * defensas cromadas, franja y círculo de carreras.
   *
   * @param color - Color de la carrocería.
   * @param tone - Color del pelaje del osito.
   * @param seed - Número que decide el círculo de carreras y la maleta.
   * @returns El vocho, el material de sus faros y la cabeza del conductor.
   */
  private static beetle(color: number, tone: BearTone, seed: number): BuiltCar {
    const body = new MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.2, map: SurfaceTextures.clay(), bumpMap: SurfaceTextures.clay(), bumpScale: 0.15, side: DoubleSide });
    const glass = new MeshStandardMaterial({ color: GLASS, roughness: 0.15, transparent: true, opacity: 0.35, side: DoubleSide, depthWrite: false });
    const pane = new MeshStandardMaterial({ color: 0xcfe6ee, roughness: 0.15, side: DoubleSide });
    const tire = new MeshStandardMaterial({ color: TIRE, roughness: 0.9 });
    const chrome = new MeshStandardMaterial({ color: 0xe6ebf2, roughness: 0.2, metalness: 0.6 });
    const dark = new MeshStandardMaterial({ color: 0x2a2233, roughness: 0.7 });
    const accent = new MeshStandardMaterial({ color: 0xffb066, roughness: 0.5 });
    const white = new MeshStandardMaterial({ color: 0xfffaf2, roughness: 0.5 });
    const headlights = new MeshStandardMaterial({ color: GLASS, emissive: 0xffe9a8, emissiveIntensity: 0.3 });
    const taillights = new MeshStandardMaterial({ color: 0xff4f6d, emissive: 0xff2f55, emissiveIntensity: 0.5 });
    const car = new Group();
    const add = (geometry: BufferGeometry, material: MeshStandardMaterial, at: [number, number, number], scale: [number, number, number] = [1, 1, 1]): Mesh => {
      const mesh = new Mesh(geometry, material);
      mesh.position.set(...at);
      mesh.scale.set(...scale);
      car.add(mesh);
      return mesh;
    };

    const shell = (grow: number) => (x: number): Section => ToyCar.beetleShell(x, grow);
    const half = Math.PI;
    add(ToyCar.loft(-0.55, 0.53, ToyCar.beetleBody, [-half / 2, half * 1.5], BEETLE_BODY_POWER), body, [0, 0, 0]);
    add(ToyCar.loft(-0.3, 0.28, shell(1), [0, half], BEETLE_SHELL_POWER), glass, [0, 0, 0]);
    add(ToyCar.loft(-0.5, -0.27, shell(1.012), [0, half], BEETLE_SHELL_POWER), body, [0, 0, 0]);
    add(ToyCar.loft(-0.29, 0.13, shell(1.016), [half * 0.2, half * 0.8], BEETLE_SHELL_POWER), body, [0, 0, 0]);
    add(ToyCar.loft(-0.19, -0.16, shell(1.012), [0, half], BEETLE_SHELL_POWER, 3), body, [0, 0, 0]);
    const rearWindow = (x: number): Section => ToyCar.beetleShell(x, 1 + 0.03 * Math.sqrt(Math.max(0, Math.sin((Math.PI * (x + 0.45)) / 0.12))));
    add(ToyCar.loft(-0.45, -0.33, rearWindow, [half * 0.36, half * 0.64], BEETLE_SHELL_POWER, 16, 12), pane, [0, 0, 0]);
    [
      [0, half * 0.34],
      [half * 0.66, half],
    ].forEach((arc) => add(ToyCar.loft(0.12, 0.28, shell(1.01), arc as [number, number], BEETLE_SHELL_POWER, 10), body, [0, 0, 0]));
    const stripe = (x: number): Section => {
      const [y, height, width] = ToyCar.beetleBody(x);
      return [y, height, width * 1.012];
    };
    [
      [-0.22, -0.12],
      [half + 0.12, half + 0.22],
    ].forEach((arc) => add(ToyCar.loft(-0.48, 0.48, stripe, arc as [number, number], BEETLE_BODY_POWER, 36, 3), accent, [0, 0, 0]));

    [-1, 1].forEach((side) => {
      [
        [0.13, 0.54],
        [-0.54, -0.12],
      ].forEach(([from, to]) => add(ToyCar.loft(from, to, ToyCar.beetleFender(from, to), [0, half], BEETLE_SHELL_POWER, 24, 24), body, [0, 0, side * 0.24]));
      add(new BoxGeometry(0.32, 0.022, 0.08), dark, [0, 0.165, side * 0.25]);
      add(new SphereGeometry(0.05, 16, 12), headlights, [0.47, 0.29, side * 0.24], [0.8, 1, 1]);
      add(new TorusGeometry(0.048, 0.01, 8, 20), chrome, [0.505, 0.29, side * 0.24]).rotation.y = Math.PI / 2;
      add(new SphereGeometry(0.034, 12, 8), taillights, [-0.49, 0.27, side * 0.24], [0.7, 1.3, 0.9]);
      add(new BoxGeometry(0.045, 0.012, 0.012), chrome, [0.09, 0.4, side * 0.198]);
      add(new SphereGeometry(0.025, 10, 8), chrome, [0.565, 0.19, side * 0.27]);
      add(new SphereGeometry(0.025, 10, 8), chrome, [-0.575, 0.19, side * 0.27]);
      add(new CylinderGeometry(0.012, 0.012, 0.09, 8), chrome, [0.565, 0.2, side * 0.12]);
      add(new CylinderGeometry(0.012, 0.012, 0.09, 8), chrome, [-0.575, 0.2, side * 0.12]);
    });
    [0.565, -0.575].forEach((x) => {
      add(new CylinderGeometry(0.02, 0.02, 0.54, 12), chrome, [x, 0.19, 0]).rotation.x = Math.PI / 2;
    });
    add(new CylinderGeometry(0.016, 0.016, 0.08, 8), chrome, [-0.56, 0.15, 0.1]).rotation.z = Math.PI / 2;
    [0.33, -0.33].forEach((x) =>
      [-1, 1].forEach((side) => {
        add(new CylinderGeometry(0.1, 0.1, 0.07, 20), tire, [x, 0.1, side * 0.255]).rotation.x = Math.PI / 2;
        add(new CylinderGeometry(0.064, 0.064, 0.074, 18), chrome, [x, 0.1, side * 0.255]).rotation.x = Math.PI / 2;
        add(new SphereGeometry(0.032, 12, 8), chrome, [x, 0.1, side * 0.292], [1, 1, 0.5]);
      }),
    );
    if (seed % 2 === 0) {
      [-1, 1].forEach((side) => {
        add(new CylinderGeometry(0.068, 0.068, 0.01, 24), dark, [-0.01, 0.32, side * 0.238]).rotation.x = Math.PI / 2;
        add(new CylinderGeometry(0.056, 0.056, 0.012, 24), white, [-0.01, 0.32, side * 0.241]).rotation.x = Math.PI / 2;
      });
    }

    const driver = VehicleDriver.bear(tone, HATS.vocho, 0.15);
    driver.group.position.set(-0.05, 0.4, 0);
    const wheel = VehicleDriver.wheel();
    wheel.position.set(0.14, 0.5, 0);
    car.add(driver.group, wheel);
    const luggage = VehicleCargo.suitcase(seed % 2 === 0 ? 0xffe35c : 0x7fd0ea);
    luggage.position.set(-0.06, 0.76, 0);
    luggage.scale.setScalar(0.55);
    car.add(luggage);
    car.scale.setScalar(CAR_SCALE);
    car.traverse((part) => {
      part.castShadow = true;
    });
    return { group: car, headlights, head: driver.head, driver: driver.group, seat: driver.group.position.clone().add(new Vector3(0, 0.1, 0)) };
  }

  /**
   * Superficie hecha de cortes transversales a lo largo de x: cada corte es una superelipse (o un arco de ella) con
   * su centro, alto y ancho, de modo que el perfil y la planta del coche salen de funciones suaves.
   *
   * @param from - x donde empieza la superficie (debe ser menor que `to`).
   * @param to - x donde termina.
   * @param section - Corte en cada x: `[centro en y, semialto, semiancho]`.
   * @param arc - Ángulos inicial y final del corte (0 apunta a +z, π/2 hacia arriba).
   * @param power - Exponente de la superelipse: 2 es elipse, más alto es más cuadrado.
   * @param rows - Cortes a lo largo de x.
   * @param cols - Segmentos de cada corte.
   * @returns La geometría con normales y coordenadas de textura.
   */
  private static loft(from: number, to: number, section: (x: number) => Section, arc: [number, number], power: number, rows = 40, cols = 36): BufferGeometry {
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const bend = (value: number): number => Math.sign(value) * Math.pow(Math.abs(value), 2 / power);
    for (let i = 0; i <= rows; i += 1) {
      const x = from + ((to - from) * i) / rows;
      const [y, height, width] = section(x);
      for (let j = 0; j <= cols; j += 1) {
        const angle = arc[0] + ((arc[1] - arc[0]) * j) / cols;
        positions.push(x, y + height * bend(Math.sin(angle)), width * bend(Math.cos(angle)));
        uvs.push(i / rows, j / cols);
      }
    }
    for (let i = 0; i < rows; i += 1) {
      for (let j = 0; j < cols; j += 1) {
        const a = i * (cols + 1) + j;
        const b = a + cols + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  /**
   * Corte del cuerpo bajo del vocho: capó corto que cae redondo a la nariz, cintura plana y tapa del motor que baja
   * larga y curva hasta la cola; se cierra en las puntas.
   *
   * @param x - Posición a lo largo del coche (−0.55 cola, 0.53 nariz).
   * @returns `[centro en y, semialto, semiancho]`.
   */
  private static beetleBody(x: number): Section {
    const front = Math.min(1, Math.max(0, (x - 0.22) / 0.31));
    const rear = Math.min(1, Math.max(0, (-0.3 - x) / 0.25));
    const tip = Math.max(front, rear);
    const top = x > 0.22 ? 0.29 + 0.15 * Math.pow(1 - front * front, 0.6) : x < -0.3 ? 0.25 + 0.19 * Math.sqrt(1 - rear * rear) : 0.44;
    const bottom = 0.14 + 0.07 * Math.pow(tip, 3);
    const end = Math.pow(Math.max(0, 1 - Math.pow(tip, 8)), 0.3);
    return [(top + bottom) / 2, ((top - bottom) / 2) * Math.sqrt(end), (0.24 - 0.05 * front * front - 0.03 * rear * rear) * end];
  }

  /**
   * Corte de la cúpula del vocho (vidrio, techo y pilares): sube del parabrisas a un techo alto y redondo y baja
   * larga hacia atrás hasta fundirse con la tapa del motor.
   *
   * @param x - Posición a lo largo del coche.
   * @param grow - Cuánto se agranda el corte, para piezas que van encima del vidrio.
   * @returns `[centro en y, semialto, semiancho]`.
   */
  private static beetleShell(x: number, grow: number): Section {
    const forward = x > BEETLE_PEAK;
    const reach = forward ? (x - BEETLE_PEAK) / 0.32 : (BEETLE_PEAK - x) / 0.46;
    const lift = forward ? Math.pow(Math.max(0, 1 - reach * reach), 0.55) : Math.pow(Math.max(0, 1 - Math.pow(reach, 1.7)), 0.8);
    const narrow = x < -0.2 ? 0.05 * ((-0.2 - x) / 0.3) : 0;
    return [0.36, 0.4 * lift * grow, (0.17 - narrow) * grow];
  }

  /**
   * Corte de una salpicadera: una aleta abultada que sale del cuerpo y se afila en sus puntas.
   *
   * @param from - x donde empieza la salpicadera.
   * @param to - x donde termina.
   * @returns Función de corte `[centro en y, semialto, semiancho]` para cada x.
   */
  private static beetleFender(from: number, to: number): (x: number) => Section {
    return (x) => {
      const arch = Math.max(0, Math.sin((Math.PI * (x - from)) / (to - from)));
      return [0.16, 0.18 * Math.pow(arch, 0.6), 0.08 * Math.pow(arch, 0.35)];
    };
  }

  private static layout(kind: CarKind): { length: number; chassisX: number; cabinX: number; cabinLength: number; cabinHeight: number; driverScale: number } {
    const layouts = {
      vocho: { length: 0.98, chassisX: 0, cabinX: -0.05, cabinLength: 0.5, cabinHeight: 0.3, driverScale: 0.16 },
      pickup: { length: 1.05, chassisX: 0, cabinX: 0.2, cabinLength: 0.38, cabinHeight: 0.26, driverScale: 0.18 },
      camioneta: { length: 1.05, chassisX: 0, cabinX: 0.05, cabinLength: 0.85, cabinHeight: 0.36, driverScale: 0.16 },
      sedan: { length: 0.95, chassisX: 0, cabinX: -0.05, cabinLength: 0.5, cabinHeight: 0.28, driverScale: 0.18 },
    } as const;
    return layouts[kind];
  }

  private static carry(car: Group, kind: CarKind, cabinX: number, seed: number): void {
    const loads: Record<CarKind, () => void> = {
      vocho: () => undefined,
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
