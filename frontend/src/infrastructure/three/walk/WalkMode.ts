import { MathUtils, Vector3, type Group, type PerspectiveCamera } from "three";
import type { HouseEntry } from "../neighborhood/NeighborhoodBuilder.js";
import type { TrafficCar } from "../neighborhood/Traffic.js";
import type { WalkGap, WalkZone } from "./WalkArea.js";
import { WalkInput } from "./WalkInput.js";
import { WalkPhysics } from "./WalkPhysics.js";

export interface DoorPrompt {
  kind: "door" | "car";
  id: number;
  name: string;
}

export interface WalkTraffic {
  readonly cars: TrafficCar[];
  take(id: number): void;
  leave(id: number): void;
}

export interface WalkCallbacks {
  onPrompt(prompt: DoorPrompt | null): void;
  onLock(locked: boolean): void;
  onEnter(id: number): void;
  onSelect(id: number): void;
  onDrive(driving: boolean): void;
}

export interface WalkStart {
  camera: PerspectiveCamera;
  canvas: HTMLCanvasElement;
  world: Group;
  houses: HouseEntry[];
  traffic: WalkTraffic;
  radius: number;
  zones: WalkZone[];
  gaps: WalkGap[];
  callbacks: WalkCallbacks;
  houseId: number | null;
  fromDoor: boolean;
}

interface Entering {
  id: number;
  start: number;
  from: Vector3;
  to: Vector3;
}

interface Drive {
  car: TrafficCar;
  speed: number;
  heading: number;
  look: number;
  view: "first" | "chase";
}

const EYE = 0.45;
const WALK = 1.5;
const RUN = 2.7;
const REACH = 1.2;
const CAR_REACH = 1.4;
const DOOR_OPEN = -1.75;
const OPEN_SECONDS = 0.55;
const LUNGE_SECONDS = 0.8;
const CLOSE_SECONDS = 1.4;
const CAR_CRUISE = 4.5;
const CAR_BOOST = 7.5;
const CAR_REVERSE = 2;
const CAR_Y = 0.08;

export class WalkMode {
  private yaw = 0;
  private pitch = 0;
  private bob = 0;
  private prompt: DoorPrompt | null = null;
  private entering: Entering | null = null;
  private closing: { id: number; start: number } | null = null;
  private drive: Drive | null = null;
  private clock = 0;
  private readonly feet = new Vector3();

  private constructor(
    private readonly start: WalkStart,
    private readonly physics: WalkPhysics,
    private readonly input: WalkInput,
  ) {}

  /**
   * Arranca el paseo en primera persona. Carga la física, coloca al jugador frente a una casa mirando hacia la
   * calle y deja listos teclado, ratón, puertas y coches. Si se viene de salir de un cuarto, la puerta de esa casa
   * empieza abierta y se cierra sola.
   *
   * @param options - Cámara, lienzo, mundo, casas, tráfico y avisos; la casa donde aparece y si se sale de su puerta.
   * @returns El modo de paseo listo para actualizarse en cada cuadro.
   */
  static async begin(options: WalkStart): Promise<WalkMode> {
    const house = options.houses.find((entry) => entry.id === options.houseId) ?? options.houses[0];
    const forward = house ? house.group.getWorldDirection(new Vector3()).setY(0).normalize() : new Vector3(0, 0, 1);
    const door = house ? house.group.localToWorld(new Vector3(house.door.position.x + 0.19, 0, house.door.position.z)) : new Vector3(0, 0.06, 0);
    const spawn = door.clone().addScaledVector(forward, 1.05).setY(0.06);
    const physics = await WalkPhysics.create(options.world, options.zones, options.gaps, spawn);
    let mode: WalkMode;
    const input = new WalkInput(options.canvas, {
      onInteract: () => mode.interact(),
      onLockChange: (locked) => options.callbacks.onLock(locked),
    });
    mode = new WalkMode(options, physics, input);
    mode.yaw = Math.atan2(-forward.x, -forward.z);
    mode.feet.copy(spawn);
    if (house && options.fromDoor) mode.closing = { id: house.id, start: 0 };
    options.camera.rotation.order = "YXZ";
    mode.applyCamera(0);
    return mode;
  }

  /**
   * Pide capturar el puntero para mirar con el ratón.
   */
  lock(): void {
    this.input.lock();
  }

  /**
   * @returns Si el puntero está capturado.
   */
  get locked(): boolean {
    return this.input.locked;
  }

  /**
   * Joystick virtual de pantallas táctiles.
   *
   * @param x - Lateral entre -1 y 1.
   * @param y - Adelante (positivo) o atrás (negativo).
   */
  setStick(x: number, y: number): void {
    this.input.setStick(x, y);
  }

  /**
   * Hace lo que toque frente al jugador: si va en un coche, se baja; si hay un coche cerca, se sube; si hay una
   * puerta, la abre y entra. No hace nada si no hay nada cerca.
   */
  interact(): void {
    if (this.drive) {
      this.leaveCar();
      return;
    }
    if (!this.prompt || this.entering) return;
    if (this.prompt.kind === "car") {
      this.boardCar(this.prompt.id);
      return;
    }
    const house = this.start.houses.find((entry) => entry.id === this.prompt?.id);
    if (!house) return;
    const inside = house.group.localToWorld(new Vector3(house.door.position.x + 0.19, 0.3, house.door.position.z - 0.55));
    this.entering = { id: house.id, start: this.clock, from: this.start.camera.position.clone(), to: inside.setY(EYE) };
    this.start.callbacks.onPrompt(null);
    this.start.callbacks.onEnter(house.id);
  }

  /**
   * @param id - Identificador de la casa.
   * @returns El ángulo con que debe estar su puerta, o `null` si el paseo no la controla.
   */
  doorAngle(id: number): number | null {
    if (this.entering?.id === id) return DOOR_OPEN * WalkMode.ease(MathUtils.clamp((this.clock - this.entering.start) / OPEN_SECONDS, 0, 1));
    if (this.closing?.id === id) return DOOR_OPEN * (1 - WalkMode.ease(MathUtils.clamp((this.clock - this.closing.start) / CLOSE_SECONDS, 0, 1)));
    return null;
  }

  /**
   * Avanza el paseo: lee la mirada y el movimiento, resuelve la física, coloca la cámara y busca la puerta o el
   * coche cercano.
   *
   * @param dt - Segundos desde el cuadro anterior.
   */
  update(dt: number): void {
    this.clock += dt;
    if (this.closing && this.clock - this.closing.start > CLOSE_SECONDS) this.closing = null;
    if (this.entering) {
      this.advanceEntering();
      return;
    }
    if (this.drive) {
      this.advanceDrive(Math.min(dt, 0.05));
      return;
    }
    const look = this.input.consumeLook();
    this.yaw += look.yaw;
    this.pitch = MathUtils.clamp(this.pitch + look.pitch, -1.2, 1.2);
    const { forward, strafe } = this.input.axes();
    const speed = this.input.running ? RUN : WALK;
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const wish = new Vector3((-sin * forward + cos * strafe) * speed, 0, (-cos * forward - sin * strafe) * speed);
    const state = this.physics.step(wish, this.input.consumeJump(), Math.min(dt, 0.05));
    this.feet.set(state.x, state.y, state.z);
    this.bob += state.grounded ? Math.hypot(wish.x, wish.z) * dt * 5 : 0;
    this.applyCamera(Math.hypot(wish.x, wish.z) / RUN);
    this.updatePrompt();
  }

  /**
   * Suelta el teclado, el ratón y la física; si iba en un coche, lo devuelve a la calle.
   */
  dispose(): void {
    if (this.drive) this.leaveCar();
    this.input.dispose();
    this.physics.dispose();
    this.start.callbacks.onPrompt(null);
  }

  private boardCar(id: number): void {
    const car = this.start.traffic.cars[id];
    if (!car) return;
    this.start.traffic.take(id);
    const heading = car.group.rotation.y;
    this.physics.enterVehicle(new Vector3(car.group.position.x, 0.06, car.group.position.z), heading);
    this.drive = { car, speed: 0, heading, look: 0, view: "chase" };
    this.pitch = 0;
    this.prompt = null;
    this.start.callbacks.onPrompt(null);
    this.start.callbacks.onDrive(true);
  }

  private leaveCar(): void {
    const drive = this.drive;
    if (!drive) return;
    const { car, heading } = drive;
    const side = new Vector3(-Math.sin(heading), 0, -Math.cos(heading));
    const spot = car.group.position.clone().addScaledVector(side, 0.8).setY(0.06);
    this.physics.exitVehicle(spot);
    this.feet.copy(spot);
    this.yaw = heading - Math.PI / 2 + drive.look;
    this.pitch = 0;
    car.driver.visible = true;
    this.start.traffic.leave(car.id);
    this.drive = null;
    this.start.callbacks.onDrive(false);
    this.applyCamera(0);
  }

  private advanceDrive(dt: number): void {
    const drive = this.drive;
    if (!drive) return;
    const { forward, strafe } = this.input.axes();
    const cruise = this.input.running ? CAR_BOOST : CAR_CRUISE;
    const target = forward > 0 ? forward * cruise : forward * CAR_REVERSE;
    drive.speed += (target - drive.speed) * Math.min(1, dt * (forward === 0 ? 2.6 : 1.8));
    if (this.input.braking) drive.speed *= Math.max(0, 1 - dt * 6);
    const grip = MathUtils.clamp(Math.abs(drive.speed) / 1.5, 0, 1) * (drive.speed >= 0 ? 1 : -1);
    drive.heading -= strafe * 1.9 * grip * dt;
    const moved = this.physics.driveStep(drive.speed, drive.heading, dt);
    if (moved.progress < 0.5 && Math.abs(drive.speed) > 1.2) drive.speed *= 0.35;
    drive.car.group.position.set(moved.x, CAR_Y, moved.z);
    drive.car.group.rotation.y = drive.heading;
    if (this.input.consumeView()) drive.view = drive.view === "first" ? "chase" : "first";
    drive.car.driver.visible = drive.view === "chase";
    const look = this.input.consumeLook();
    const lookedAround = look.yaw !== 0 || look.pitch !== 0;
    drive.look = MathUtils.clamp(drive.look + look.yaw, -1.5, 1.5) * (lookedAround ? 1 : 1 - Math.min(dt * 1.8, 1));
    this.pitch = MathUtils.clamp(this.pitch + look.pitch, -0.8, 0.8) * (lookedAround ? 1 : 1 - Math.min(dt * 1.8, 1));
    this.feet.set(moved.x, 0.06, moved.z);
    this.applyDriveCamera(drive);
  }

  private applyDriveCamera(drive: Drive): void {
    const camera = this.start.camera;
    const yaw = drive.heading - Math.PI / 2 + drive.look;
    if (drive.view === "first") {
      camera.position.copy(drive.car.group.localToWorld(drive.car.seat.clone()));
      camera.rotation.set(this.pitch, yaw, 0);
      return;
    }
    const direction = new Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const target = drive.car.group.position.clone().setY(0.4);
    camera.position.copy(target).addScaledVector(direction, -2.1).setY(0.95 - this.pitch * 0.8);
    camera.lookAt(target);
  }

  private advanceEntering(): void {
    const entering = this.entering;
    if (!entering) return;
    const lunge = MathUtils.clamp((this.clock - entering.start - OPEN_SECONDS) / LUNGE_SECONDS, 0, 1);
    this.start.camera.position.lerpVectors(entering.from, entering.to, WalkMode.ease(lunge));
    this.pitch = MathUtils.lerp(this.pitch, 0, 0.1);
    this.start.camera.rotation.set(this.pitch, this.yaw, 0);
    if (lunge < 1) return;
    const id = entering.id;
    this.entering = null;
    this.closing = { id, start: this.clock };
    this.start.callbacks.onSelect(id);
  }

  private applyCamera(effort: number): void {
    const camera = this.start.camera;
    camera.position.set(this.feet.x, this.feet.y + EYE + Math.sin(this.bob) * 0.012 * effort, this.feet.z);
    camera.rotation.set(this.pitch, this.yaw, 0);
  }

  private updatePrompt(): void {
    const look = new Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    let best: DoorPrompt | null = null;
    let nearest = Infinity;
    const consider = (spot: Vector3, reach: number, facing: number, prompt: DoorPrompt): void => {
      const offset = spot.sub(this.feet).setY(0);
      const distance = offset.length();
      if (distance > reach || distance > nearest || offset.normalize().dot(look) < facing) return;
      nearest = distance;
      best = prompt;
    };
    this.start.houses.forEach((house) => {
      const spot = house.group.localToWorld(new Vector3(house.door.position.x + 0.19, 0, house.door.position.z));
      consider(spot, REACH, 0.35, { kind: "door", id: house.id, name: house.name });
    });
    this.start.traffic.cars.forEach((car) => consider(car.group.position.clone(), CAR_REACH, 0.2, { kind: "car", id: car.id, name: "carro" }));
    const next = best as DoorPrompt | null;
    if (next?.id === this.prompt?.id && next?.kind === this.prompt?.kind) return;
    this.prompt = next;
    this.start.callbacks.onPrompt(next);
  }

  private static ease(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
