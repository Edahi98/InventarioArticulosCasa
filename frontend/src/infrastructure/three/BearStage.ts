import {
  AmbientLight,
  CircleGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  Material,
  Mesh,
  MeshBasicMaterial,
  MathUtils,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  type BufferGeometry,
} from "three";
import type { InventoryBear } from "../../core/domain/inventoryBear.js";
import { BearBuilder } from "./BearBuilder.js";

export interface BearStageOptions {
  reducedMotion: boolean;
}

interface BearActor {
  id: string;
  group: Group;
  baseY: number;
  baseScale: number;
  phase: number;
}

const SPACING = 2.15;
const GROUND_Y = -0.82;

export class BearStage {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(32, 1, 0.1, 50);
  private readonly actors: BearActor[] = [];
  private readonly pointer = { x: 0, y: 0 };
  private activeId: string | null = null;
  private frame = 0;
  private running = false;
  private elapsed = 0;
  private lastTime = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    bears: InventoryBear[],
    private readonly options: BearStageOptions,
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.camera.position.set(0, 0.9, 9);
    this.camera.lookAt(0, 0.2, 0);
    this.addLights();
    this.addBears(bears);
  }

  /**
   * Ajusta el tamaño del lienzo y la cámara al contenedor.
   *
   * @param width - Ancho en píxeles CSS.
   * @param height - Alto en píxeles CSS.
   */
  resize(width: number, height: number): void {
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.position.z = this.distanceToFit();
    this.camera.updateProjectionMatrix();
    this.renderOnce();
  }

  /**
   * Marca qué oso destaca (salta y crece un poco).
   *
   * @param id - Identificador de la categoría, o `null` para ninguno.
   */
  setActive(id: string | null): void {
    this.activeId = id;
    this.renderOnce();
  }

  /**
   * Orienta los osos hacia el puntero.
   *
   * @param x - Posición horizontal normalizada entre -1 y 1.
   * @param y - Posición vertical normalizada entre -1 y 1.
   */
  setPointer(x: number, y: number): void {
    this.pointer.x = x;
    this.pointer.y = y;
    this.renderOnce();
  }

  /**
   * Arranca o pausa el ciclo de animación (se pausa cuando el escenario no es visible).
   *
   * @param visible - Si el escenario está en pantalla.
   */
  setVisible(visible: boolean): void {
    if (this.options.reducedMotion) return;
    if (visible && !this.running) {
      this.running = true;
      this.lastTime = performance.now();
      this.frame = requestAnimationFrame(this.tick);
      return;
    }
    if (!visible) this.stop();
  }

  /**
   * Libera geometrías, materiales y el contexto WebGL.
   */
  dispose(): void {
    this.stop();
    this.scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      (object.geometry as BufferGeometry).dispose();
      (object.material as Material).dispose();
    });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  private distanceToFit(): number {
    const halfWidth = ((this.actors.length - 1) / 2) * SPACING + 1.3;
    const halfFov = MathUtils.degToRad(this.camera.fov / 2);
    return Math.max(8, halfWidth / (Math.tan(halfFov) * this.camera.aspect));
  }

  private stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  private addLights(): void {
    const key = new DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 6, 6);
    this.scene.add(new AmbientLight(0xffffff, 0.55), new HemisphereLight(0xdfe7ff, 0x2a2f45, 0.9), key);
  }

  private addBears(bears: InventoryBear[]): void {
    const builder = new BearBuilder();
    const center = (bears.length - 1) / 2;
    const shadowGeometry = new CircleGeometry(0.85, 32);
    bears.forEach((bear, index) => {
      const offset = index - center;
      const group = builder.build(bear);
      const baseScale = 1 + (index % 2) * 0.12;
      const baseY = (index % 2) * 0.12;
      group.position.set(offset * SPACING, baseY, -Math.abs(offset) * 0.5);
      group.scale.setScalar(baseScale);
      this.scene.add(group);
      this.scene.add(this.shadow(shadowGeometry, group.position.x, group.position.z, baseScale));
      this.actors.push({ id: bear.id, group, baseY, baseScale, phase: index * 1.3 });
    });
  }

  private shadow(geometry: CircleGeometry, x: number, z: number, scale: number): Mesh {
    const shadow = new Mesh(geometry, new MeshBasicMaterial({ color: 0x0b0d12, transparent: true, opacity: 0.22 }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(x, GROUND_Y - 0.001, z);
    shadow.scale.setScalar(scale);
    return shadow;
  }

  private readonly tick = (time: number): void => {
    if (!this.running) return;
    this.elapsed += (time - this.lastTime) / 1000;
    this.lastTime = time;
    this.update(this.elapsed);
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.tick);
  };

  private renderOnce(): void {
    if (this.running) return;
    this.update(this.elapsed);
    this.renderer.render(this.scene, this.camera);
  }

  private update(seconds: number): void {
    const motion = this.options.reducedMotion ? 0 : 1;
    const ease = this.running ? 1 : 10;
    const step = (rate: number): number => Math.min(1, rate * ease);
    this.actors.forEach((actor) => {
      const active = actor.id === this.activeId;
      const bob = Math.sin(seconds * 1.6 + actor.phase) * 0.05 * motion;
      const hop = active ? Math.abs(Math.sin(seconds * 3.2)) * 0.32 * motion + 0.08 : 0;
      const targetScale = actor.baseScale * (active ? 1.14 : 1);
      const targetYaw = this.pointer.x * 0.55 + (active ? Math.sin(seconds * 2) * 0.25 * motion : 0);
      actor.group.position.y = MathUtils.lerp(actor.group.position.y, actor.baseY + bob + hop, step(0.18));
      actor.group.rotation.y = MathUtils.lerp(actor.group.rotation.y, targetYaw, step(0.12));
      actor.group.rotation.x = MathUtils.lerp(actor.group.rotation.x, -this.pointer.y * 0.12, step(0.12));
      actor.group.scale.setScalar(MathUtils.lerp(actor.group.scale.x, targetScale, step(0.15)));
    });
  }
}
