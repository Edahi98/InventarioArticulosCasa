import {
  AmbientLight,
  DirectionalLight,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
} from "three";
import type { BearTone } from "../../core/domain/inventoryBear.js";
import { BearBuilder } from "./BearBuilder.js";

export interface BadgeStageOptions {
  tone: BearTone;
  reducedMotion: boolean;
}

export class BadgeStage {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(30, 1, 0.1, 20);
  private readonly head: Group;
  private readonly pointer = { x: 0, y: 0 };
  private frame = 0;
  private running = false;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly options: BadgeStageOptions,
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.camera.position.set(0, 0.05, 3.5);
    this.camera.lookAt(0, 0, 0);

    const key = new DirectionalLight(0xffffff, 2.4);
    key.position.set(2, 3, 5);
    this.scene.add(new AmbientLight(0xffffff, 0.6), new HemisphereLight(0xdfe7ff, 0x2a2f45, 0.9), key);

    this.head = new BearBuilder().buildHead(options.tone);
    this.scene.add(this.head);
  }

  /**
   * Ajusta el lienzo a un cuadrado de `size` píxeles CSS.
   *
   * @param size - Lado del icono en píxeles CSS.
   */
  resize(size: number): void {
    this.renderer.setSize(size, size, false);
    this.render(0);
  }

  /**
   * Orienta la cabeza hacia el puntero.
   *
   * @param x - Posición horizontal normalizada entre -1 y 1.
   * @param y - Posición vertical normalizada entre -1 y 1.
   */
  setPointer(x: number, y: number): void {
    this.pointer.x = x;
    this.pointer.y = y;
    if (!this.running) this.render(0);
  }

  /**
   * Inicia la animación (en modo sin movimiento solo se dibuja un cuadro).
   */
  start(): void {
    if (this.options.reducedMotion || this.running) return;
    this.running = true;
    this.frame = requestAnimationFrame(this.tick);
  }

  /**
   * Libera geometrías, materiales y el contexto WebGL.
   */
  dispose(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      (object.geometry as BufferGeometry).dispose();
      (object.material as Material).dispose();
    });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  private readonly tick = (time: number): void => {
    if (!this.running) return;
    this.render(time / 1000);
    this.frame = requestAnimationFrame(this.tick);
  };

  private render(seconds: number): void {
    const sway = this.options.reducedMotion ? 0 : Math.sin(seconds * 1.4) * 0.18;
    this.head.rotation.y = MathUtils.lerp(this.head.rotation.y, this.pointer.x * 0.7 + sway, 0.2);
    this.head.rotation.x = MathUtils.lerp(this.head.rotation.x, this.pointer.y * 0.4, 0.2);
    this.renderer.render(this.scene, this.camera);
  }
}
