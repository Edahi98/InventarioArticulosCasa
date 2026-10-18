const LOOK_MOUSE = 0.0022;
const LOOK_TOUCH = 0.005;
const MOVE_KEYS: Record<string, "forward" | "back" | "left" | "right"> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "back",
  ArrowDown: "back",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
};

export interface WalkInputCallbacks {
  onInteract(): void;
  onLockChange(locked: boolean): void;
}

export class WalkInput {
  private readonly held = new Set<string>();
  private readonly stick = { x: 0, y: 0 };
  private look = { x: 0, y: 0 };
  private jumpQueued = false;
  private viewQueued = false;
  private dragging = false;
  private last = { x: 0, y: 0 };

  /**
   * Entradas del paseo en primera persona: teclado (WASD o flechas, Shift para correr, Espacio para saltar, E para
   * abrir), ratón con el puntero capturado, arrastre como alternativa cuando no hay captura (táctil) y un
   * joystick virtual que la interfaz alimenta con `setStick`.
   *
   * @param canvas - Lienzo sobre el que se mira.
   * @param callbacks - Avisos: se pidió interactuar y cambió la captura del puntero.
   */
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly callbacks: WalkInputCallbacks,
  ) {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.handleBlur);
    document.addEventListener("pointerlockchange", this.handleLock);
    document.addEventListener("mousemove", this.handleMouse);
    canvas.addEventListener("pointerdown", this.handleDown);
    window.addEventListener("pointermove", this.handleDrag);
    window.addEventListener("pointerup", this.handleUp);
  }

  /**
   * Pide capturar el puntero para mirar con el ratón; si el navegador no lo permite se mira arrastrando.
   */
  lock(): void {
    if (document.pointerLockElement === this.canvas) return;
    void Promise.resolve(this.canvas.requestPointerLock?.()).catch(() => undefined);
  }

  /**
   * Suelta el puntero.
   */
  unlock(): void {
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
  }

  /**
   * @returns Si el puntero está capturado por el lienzo.
   */
  get locked(): boolean {
    return document.pointerLockElement === this.canvas;
  }

  /**
   * Fija el joystick virtual.
   *
   * @param x - Lateral entre -1 y 1.
   * @param y - Adelante (positivo) o atrás (negativo), entre -1 y 1.
   */
  setStick(x: number, y: number): void {
    this.stick.x = x;
    this.stick.y = y;
  }

  /**
   * @returns Hacia dónde se quiere avanzar: `forward` y `strafe` entre -1 y 1, ya combinados teclado y joystick.
   */
  axes(): { forward: number; strafe: number } {
    const key = (name: string): number => [...this.held].filter((code) => MOVE_KEYS[code] === name).length > 0 ? 1 : 0;
    const forward = key("forward") - key("back") + this.stick.y;
    const strafe = key("right") - key("left") + this.stick.x;
    const length = Math.hypot(forward, strafe);
    return length > 1 ? { forward: forward / length, strafe: strafe / length } : { forward, strafe };
  }

  /**
   * @returns Si se mantiene Shift para correr.
   */
  get running(): boolean {
    return this.held.has("ShiftLeft") || this.held.has("ShiftRight");
  }

  /**
   * @returns Si se mantiene Espacio (el freno de mano al manejar).
   */
  get braking(): boolean {
    return this.held.has("Space");
  }

  /**
   * @returns Si se pidió cambiar de vista (tecla V) desde la última vez que se preguntó (se gasta al leerlo).
   */
  consumeView(): boolean {
    const view = this.viewQueued;
    this.viewQueued = false;
    return view;
  }

  /**
   * @returns Si se pidió un salto desde la última vez que se preguntó (se gasta al leerlo).
   */
  consumeJump(): boolean {
    const jump = this.jumpQueued;
    this.jumpQueued = false;
    return jump;
  }

  /**
   * @returns Cuánto se movió la mirada desde la última lectura, en radianes (se gasta al leerlo).
   */
  consumeLook(): { yaw: number; pitch: number } {
    const { x, y } = this.look;
    this.look = { x: 0, y: 0 };
    return { yaw: -x, pitch: -y };
  }

  /**
   * Quita todos los escuchadores y suelta el puntero.
   */
  dispose(): void {
    this.unlock();
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.handleBlur);
    document.removeEventListener("pointerlockchange", this.handleLock);
    document.removeEventListener("mousemove", this.handleMouse);
    this.canvas.removeEventListener("pointerdown", this.handleDown);
    window.removeEventListener("pointermove", this.handleDrag);
    window.removeEventListener("pointerup", this.handleUp);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    if (event.code === "KeyE" || event.code === "Enter") {
      if (!event.repeat) this.callbacks.onInteract();
      return;
    }
    if (event.code === "Space") {
      this.jumpQueued = true;
      this.held.add(event.code);
      event.preventDefault();
    }
    if (event.code === "KeyV" && !event.repeat) this.viewQueued = true;
    if (MOVE_KEYS[event.code] || event.code.startsWith("Shift")) {
      this.held.add(event.code);
      if (event.code.startsWith("Arrow")) event.preventDefault();
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.held.delete(event.code);
  };

  private readonly handleBlur = (): void => {
    this.held.clear();
    this.stick.x = 0;
    this.stick.y = 0;
  };

  private readonly handleLock = (): void => {
    this.callbacks.onLockChange(this.locked);
  };

  private readonly handleMouse = (event: MouseEvent): void => {
    if (!this.locked) return;
    this.look.x += event.movementX * LOOK_MOUSE;
    this.look.y += event.movementY * LOOK_MOUSE;
  };

  private readonly handleDown = (event: PointerEvent): void => {
    if (event.pointerType === "mouse") {
      if (!this.locked) this.lock();
      return;
    }
    this.dragging = true;
    this.last = { x: event.clientX, y: event.clientY };
  };

  private readonly handleDrag = (event: PointerEvent): void => {
    if (!this.dragging) return;
    this.look.x += (event.clientX - this.last.x) * LOOK_TOUCH;
    this.look.y += (event.clientY - this.last.y) * LOOK_TOUCH;
    this.last = { x: event.clientX, y: event.clientY };
  };

  private readonly handleUp = (): void => {
    this.dragging = false;
  };
}
