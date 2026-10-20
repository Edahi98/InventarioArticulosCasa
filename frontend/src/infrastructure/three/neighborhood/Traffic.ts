import {
  AdditiveBlending,
  Box3,
  CircleGeometry,
  ConeGeometry,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Vector3,
  type Curve,
} from "three";
import { CAR_GAP, CAR_SPEED, HEADLIGHT_BEAM, VEHICLE_ROTATION, type TOUR_VEHICLES } from "../../../constantes/barrio_constantes.js";
import { RoadBuilder } from "./RoadBuilder.js";
import { SeededRandom } from "./SeededRandom.js";
import type { BearTone } from "../../../core/domain/inventoryBear.js";
import { ServiceVehicle } from "./ServiceVehicle.js";
import { ToyCar, type BuiltCar } from "./ToyCar.js";
import { ToyCart } from "./ToyCart.js";
import { TwoWheeler } from "./TwoWheeler.js";
import { MeshMerger } from "../MeshMerger.js";

export interface TrafficCar {
  id: number;
  group: Group;
  driver: Group;
  seat: Vector3;
}

export type VehicleKind = (typeof VEHICLE_ROTATION)[number] | (typeof TOUR_VEHICLES)[number];

export interface TrafficRoad {
  curve: Curve<Vector3>;
  cars: number;
  kinds?: readonly VehicleKind[];
  oneWay?: boolean;
}

interface Blend {
  x: number;
  z: number;
  rotation: number;
  start: number;
}

interface Driver {
  group: Group;
  head: Group;
  driver: Group;
  seat: Vector3;
  curve: Curve<Vector3>;
  length: number;
  controlled: boolean;
  blend: Blend | null;
  bob: number;
  direction: 1 | -1;
  speed: number;
  travelled: number;
  pace: number;
}

const COLORS = [0xff4f8b, 0x7fd0ea, 0xffe35c, 0xb89cf2, 0x7fd0a0, 0xffb066] as const;
const VOCHO_COLORS = [0xe8502d, 0x2a2233, 0xffe35c, 0x7fd0ea, 0xff8fb7] as const;
const TONES: BearTone[] = ["rose", "sky", "sun", "lilac"];
const SLOW: Partial<Record<VehicleKind, number>> = { bicicleta: 0.6, carreta: 0.5, autobus: 0.85 };
const LANE = 0.22;

export class Traffic {
  readonly group = new Group();
  private readonly drivers: Driver[] = [];
  private clock = 0;
  private last = 0;
  private readonly lights: MeshStandardMaterial[] = [];
  private readonly sirens: MeshStandardMaterial[] = [];
  private readonly beam = new MeshBasicMaterial({ color: HEADLIGHT_BEAM, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, side: DoubleSide, fog: false });
  private readonly pool = new MeshBasicMaterial({ color: HEADLIGHT_BEAM, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, fog: false });

  /**
   * Flotas de vehículos de juguete: las de cada anillo dan vueltas a su isla y las de las rutas de enlace salen por la
   * calle de su lote libre, cruzan el puente de carros, dan la vuelta a la otra isla y regresan. Hay vochos, pickups,
   * autobuses escolares, motos, ambulancias, bicicletas, camiones de reparto y de bomberos, carretas con burrito y
   * patrullas, cada uno con su osito al volante. Un carril por sentido; si hay alguien adelante en el mismo carril,
   * se forman en fila en vez de atravesarse. De noche llevan conos de luz y un charco de luz enfrente.
   *
   * @param roads - Rutas (curvas cerradas) con cuántos vehículos llevan; en los anillos la mitad va en sentido contrario.
   * @param roadWidth - Ancho de la calle, para repartir los dos carriles.
   */
  constructor(
    roads: TrafficRoad[],
    private readonly roadWidth: number,
  ) {
    const rng = new SeededRandom("trafico");
    let serial = 0;
    roads.forEach((road, roadIndex) => {
      const length = road.curve.getLength();
      const kinds = road.kinds ?? VEHICLE_ROTATION;
      for (let index = 0; index < road.cars; index += 1) {
        const kind = kinds[(serial + roadIndex * 3) % kinds.length] as VehicleKind;
        const built = Traffic.vehicle(kind, kind === "vocho" ? (VOCHO_COLORS[serial % VOCHO_COLORS.length] as number) : rng.pick(COLORS), TONES[serial % TONES.length] as BearTone, serial);
        MeshMerger.merge(built.group, [built.driver]);
        this.addBeams(built);
        this.group.add(built.group);
        this.lights.push(built.headlights);
        this.sirens.push(...(built.sirens ?? []));
        const direction = road.oneWay || index % 2 === 0 ? 1 : -1;
        this.drivers.push({
          group: built.group,
          head: built.head,
          driver: built.driver,
          seat: built.seat,
          curve: road.curve,
          length,
          controlled: false,
          blend: null,
          bob: rng.between(0, 6),
          direction,
          speed: rng.between(CAR_SPEED[0], CAR_SPEED[1]) * (SLOW[kind] ?? 1),
          travelled: ((index / road.cars) * length + rng.between(0, 0.6)) * direction,
          pace: 1,
        });
        serial += 1;
      }
    });
    this.update(0, 0, false);
  }

  private static vehicle(kind: VehicleKind, color: number, tone: BearTone, seed: number): BuiltCar {
    const builders: Record<VehicleKind, () => BuiltCar> = {
      vocho: () => ToyCar.build(color, "vocho", tone, seed),
      pickup: () => ToyCar.build(color, "pickup", tone, seed),
      camioneta: () => ToyCar.build(color, "camioneta", tone, seed),
      sedan: () => ToyCar.build(color, "sedan", tone, seed),
      ambulancia: () => ServiceVehicle.build("ambulancia", tone, seed),
      bomberos: () => ServiceVehicle.build("bomberos", tone, seed),
      patrulla: () => ServiceVehicle.build("patrulla", tone, seed),
      autobus: () => ServiceVehicle.build("autobus", tone, seed),
      reparto: () => ServiceVehicle.build("reparto", tone, seed),
      moto: () => TwoWheeler.build("moto", color, tone),
      bicicleta: () => TwoWheeler.build("bicicleta", color, tone),
      carreta: () => ToyCart.build(tone),
    };
    return builders[kind]();
  }

  private addBeams(built: BuiltCar): void {
    const box = new Box3().setFromObject(built.group);
    const scale = built.group.scale.x;
    const front = box.max.x / scale;
    const cone = new Mesh(new ConeGeometry(0.32, 1.3, 12, 1, true), this.beam);
    cone.rotation.z = Math.PI / 2 + 0.12;
    cone.position.set(front + 0.62, 0.22, 0);
    const spot = new Mesh(new CircleGeometry(0.4, 16), this.pool);
    spot.rotation.x = -Math.PI / 2;
    spot.scale.set(1.5, 1, 1);
    spot.position.set(front + 0.8, -0.04, 0);
    built.group.add(cone, spot);
  }

  /**
   * @returns Los vehículos de las calles con su asiento, para poder subirse a ellos.
   */
  get cars(): TrafficCar[] {
    return this.drivers.map((driver, id) => ({ id, group: driver.group, driver: driver.driver, seat: driver.seat }));
  }

  /**
   * Entrega un vehículo a quien lo va a manejar: deja de circular solo.
   *
   * @param id - Posición del vehículo en `cars`.
   */
  take(id: number): void {
    const driver = this.drivers[id];
    if (!driver) return;
    driver.controlled = true;
    driver.blend = null;
  }

  /**
   * Devuelve un vehículo a la ruta más cercana: toma el punto más cercano y el sentido en que apunta, y se incorpora
   * al tráfico con una transición suave desde donde quedó estacionado.
   *
   * @param id - Posición del vehículo en `cars`.
   */
  leave(id: number): void {
    const driver = this.drivers[id];
    if (!driver) return;
    const here = driver.group.position;
    const curves = [...new Set(this.drivers.map((item) => item.curve))];
    let best = 0;
    let nearest = Infinity;
    let bestCurve = driver.curve;
    curves.forEach((curve) => {
      for (let step = 0; step < 240; step += 1) {
        const point = curve.getPointAt(step / 240);
        const distance = (point.x - here.x) ** 2 + (point.z - here.z) ** 2;
        if (distance >= nearest) continue;
        nearest = distance;
        best = step / 240;
        bestCurve = curve;
      }
    });
    driver.curve = bestCurve;
    driver.length = bestCurve.getLength();
    const { tangent } = RoadBuilder.frame(bestCurve, best);
    const heading = new Vector3(Math.cos(driver.group.rotation.y), 0, -Math.sin(driver.group.rotation.y));
    driver.direction = heading.dot(tangent) >= 0 ? 1 : -1;
    driver.travelled = best * driver.length;
    driver.blend = { x: here.x, z: here.z, rotation: driver.group.rotation.y, start: this.clock };
    driver.controlled = false;
  }

  /**
   * Hace avanzar a los vehículos por su carril; se detienen si alguien va adelante muy cerca en el mismo carril.
   * Enciende faros, conos y charcos de luz de noche y hace parpadear las sirenas.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` los vehículos quedan quietos (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const dt = moving ? MathUtils.clamp(elapsed - this.last, 0, 0.1) : 0;
    this.last = elapsed;
    this.clock = elapsed;
    this.drivers.forEach((driver) => {
      if (driver.controlled) return;
      const blocked = moving && this.blocked(driver);
      driver.pace += ((blocked ? 0 : 1) - driver.pace) * Math.min(dt * 5, 1);
      driver.travelled += driver.direction * driver.speed * driver.pace * dt;
      const { point, tangent, normal } = RoadBuilder.frame(driver.curve, driver.travelled / driver.length);
      const lane = driver.direction * -this.roadWidth * LANE;
      driver.group.position.set(point.x + normal.x * lane, 0.08, point.z + normal.z * lane);
      driver.group.rotation.y = Math.atan2(-tangent.z * driver.direction, tangent.x * driver.direction);
      if (driver.blend) {
        const mix = MathUtils.clamp((elapsed - driver.blend.start) / 1.4, 0, 1);
        const swing = Math.atan2(Math.sin(driver.group.rotation.y - driver.blend.rotation), Math.cos(driver.group.rotation.y - driver.blend.rotation));
        driver.group.position.x = MathUtils.lerp(driver.blend.x, driver.group.position.x, mix);
        driver.group.position.z = MathUtils.lerp(driver.blend.z, driver.group.position.z, mix);
        driver.group.rotation.y = driver.blend.rotation + swing * mix;
        if (mix >= 1) driver.blend = null;
      }
      driver.head.rotation.z = moving ? Math.sin(elapsed * 4 + driver.bob) * 0.1 : 0;
    });
    const dark = MathUtils.clamp(night, 0, 1);
    const glow = 0.3 + dark * 2.2;
    this.lights.forEach((light) => {
      light.emissiveIntensity = glow;
    });
    this.beam.opacity = dark * 0.16;
    this.pool.opacity = dark * 0.3;
    this.sirens.forEach((siren, index) => {
      const flash = moving ? Math.sin(elapsed * 9 + index * Math.PI) > 0 : index % 2 === 0;
      siren.emissiveIntensity = flash ? 1.6 + dark * 1.6 : 0.3;
    });
  }

  private blocked(driver: Driver): boolean {
    const heading = new Vector3(Math.cos(driver.group.rotation.y), 0, -Math.sin(driver.group.rotation.y));
    return this.drivers.some((other) => {
      if (other === driver) return false;
      const dx = other.group.position.x - driver.group.position.x;
      const dz = other.group.position.z - driver.group.position.z;
      const ahead = dx * heading.x + dz * heading.z;
      if (ahead <= 0.05 || ahead > CAR_GAP) return false;
      const side = Math.abs(dx * heading.z - dz * heading.x);
      const facing = Math.cos(other.group.rotation.y - driver.group.rotation.y);
      return side < 0.45 && facing > 0.3;
    });
  }
}
