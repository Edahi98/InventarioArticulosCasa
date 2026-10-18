import { MathUtils, Vector3, type Group, type PerspectiveCamera } from "three";
import type { HouseEntry } from "../neighborhood/NeighborhoodBuilder.js";
import { WalkInput } from "./WalkInput.js";
import { WalkPhysics } from "./WalkPhysics.js";

export interface DoorPrompt {
  id: number;
  name: string;
}

export interface WalkCallbacks {
  onPrompt(prompt: DoorPrompt | null): void;
  onLock(locked: boolean): void;
  onEnter(id: number): void;
  onSelect(id: number): void;
}

export interface WalkStart {
  camera: PerspectiveCamera;
  canvas: HTMLCanvasElement;
  world: Group;
  houses: HouseEntry[];
  radius: number;
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

const EYE = 0.45;
const WALK = 1.5;
const RUN = 2.7;
const REACH = 1.2;
const DOOR_OPEN = -1.75;
const OPEN_SECONDS = 0.55;
const LUNGE_SECONDS = 0.8;
const CLOSE_SECONDS = 1.4;

export class WalkMode {
  private yaw = 0;
  private pitch = 0;
  private bob = 0;
  private prompt: DoorPrompt | null = null;
  private entering: Entering | null = null;
  private closing: { id: number; start: number } | null = null;
  private clock = 0;
  private readonly feet = new Vector3();

  private constructor(
    private readonly start: WalkStart,
    private readonly physics: WalkPhysics,
    private readonly input: WalkInput,
  ) {}

  /**
   * Arranca el paseo en primera persona. Carga la física, coloca al jugador frente a una casa mirando hacia la
   * calle y deja listos teclado, ratón y puerta. Si se viene de salir de un cuarto, la puerta de esa casa empieza
   * abierta y se cierra sola.
   *
   * @param options - Cámara, lienzo, mundo, casas y avisos; la casa donde aparece y si se sale de su puerta.
   * @returns El modo de paseo listo para actualizarse en cada cuadro.
   */
  static async begin(options: WalkStart): Promise<WalkMode> {
    const house = options.houses.find((entry) => entry.id === options.houseId) ?? options.houses[0];
    const forward = house ? house.group.getWorldDirection(new Vector3()).setY(0).normalize() : new Vector3(0, 0, 1);
    const door = house ? house.group.localToWorld(new Vector3(house.door.position.x + 0.19, 0, house.door.position.z)) : new Vector3(0, 0.06, 0);
    const spawn = door.clone().addScaledVector(forward, 1.05).setY(0.06);
    const physics = await WalkPhysics.create(options.world, options.radius, spawn);
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
   * Abre la puerta de la casa que se tiene enfrente y entra: la puerta se abre, la cámara avanza hacia el
   * interior y al terminar se avisa para abrir el cuarto. No hace nada si no hay puerta cerca.
   */
  interact(): void {
    if (!this.prompt || this.entering) return;
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
   * Avanza el paseo: lee la mirada y el movimiento, resuelve la física, coloca la cámara y busca la puerta cercana.
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
   * Suelta el teclado, el ratón y la física.
   */
  dispose(): void {
    this.input.dispose();
    this.physics.dispose();
    this.start.callbacks.onPrompt(null);
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
    let nearest = REACH;
    this.start.houses.forEach((house) => {
      const spot = house.group.localToWorld(new Vector3(house.door.position.x + 0.19, 0, house.door.position.z));
      const offset = spot.sub(this.feet).setY(0);
      const distance = offset.length();
      if (distance > nearest || offset.normalize().dot(look) < 0.35) return;
      nearest = distance;
      best = { id: house.id, name: house.name };
    });
    const next = best as DoorPrompt | null;
    if (next?.id === this.prompt?.id) return;
    this.prompt = next;
    this.start.callbacks.onPrompt(next);
  }

  private static ease(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
