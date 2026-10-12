import {
  AmbientLight,
  DirectionalLight,
  HemisphereLight,
  MathUtils,
  Mesh,
  PerspectiveCamera,
  Quaternion,
  Scene,
  Vector3,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
} from "three";
import type { InventoryBear } from "../../core/domain/inventoryBear.js";
import { BearBuilder, type BearRig } from "./BearBuilder.js";

export type LoginMood = "idle" | "sad" | "happy";

export interface LoginStageOptions {
  reducedMotion: boolean;
}

interface LoginActor {
  rig: BearRig;
  baseY: number;
  phase: number;
  restArms: [Quaternion, Quaternion];
  coverArms: [Quaternion, Quaternion];
}

const LAYOUT: Array<{ x: number; y: number; scale: number; yaw: number }> = [
  { x: 0, y: 0, scale: 1, yaw: 0 },
  { x: -2.15, y: -0.14, scale: 0.72, yaw: 0.35 },
  { x: 2.15, y: -0.14, scale: 0.72, yaw: -0.35 },
];

const SAD_SHAKE_SECONDS = 0.7;
const HAPPY_SECONDS = 1.4;

export class LoginStage {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(30, 1, 0.1, 50);
  private readonly actors: LoginActor[] = [];
  private gaze = { x: 0, y: 0 };
  private covering = 0;
  private coverTarget = 0;
  private mood: LoginMood = "idle";
  private moodStart = 0;
  private elapsed = 0;
  private lastTime = 0;
  private frame = 0;
  private running = false;

  constructor(
    canvas: HTMLCanvasElement,
    bears: InventoryBear[],
    private readonly options: LoginStageOptions,
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.camera.position.set(0, 0.5, 7);
    this.camera.lookAt(0, 0.5, 0);

    const key = new DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 6, 6);
    this.scene.add(new AmbientLight(0xffffff, 0.6), new HemisphereLight(0xfff0f6, 0x2a2233, 0.9), key);

    const builder = new BearBuilder();
    bears.slice(0, LAYOUT.length).forEach((bear, index) => this.addActor(builder, bear, index));
  }

  /**
   * Ajusta el lienzo y encuadra los tres osos a lo ancho.
   *
   * @param width - Ancho en píxeles CSS.
   * @param height - Alto en píxeles CSS.
   */
  resize(width: number, height: number): void {
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    const halfFov = MathUtils.degToRad(this.camera.fov / 2);
    this.camera.position.z = Math.max(6.5, 3.4 / (Math.tan(halfFov) * this.camera.aspect));
    this.camera.updateProjectionMatrix();
    this.renderOnce();
  }

  /**
   * Hace que los osos miren hacia un punto.
   *
   * @param x - Horizontal entre -1 (izquierda) y 1 (derecha).
   * @param y - Vertical entre -1 (abajo) y 1 (arriba).
   */
  setGaze(x: number, y: number): void {
    this.gaze = { x, y };
    this.renderOnce();
  }

  /**
   * Sube o baja las patas para taparse los ojos.
   *
   * @param covering - `true` para taparse los ojos.
   */
  setCovering(covering: boolean): void {
    this.coverTarget = covering ? 1 : 0;
    this.renderOnce();
  }

  /**
   * Cambia el estado de ánimo (triste al fallar, contento al entrar).
   *
   * @param mood - Nuevo estado.
   */
  setMood(mood: LoginMood): void {
    this.mood = mood;
    this.moodStart = this.elapsed;
    this.renderOnce();
  }

  /**
   * Arranca o pausa la animación según la visibilidad.
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

  private addActor(builder: BearBuilder, bear: InventoryBear, index: number): void {
    const layout = LAYOUT[index]!;
    const rig = builder.rig(bear);
    rig.root.position.set(layout.x, layout.y, 0);
    rig.root.scale.setScalar(layout.scale);
    rig.root.rotation.y = layout.yaw;
    this.scene.add(rig.root);

    const up = new Vector3(0, 1, 0);
    const rest = rig.arms.map((arm) => arm.quaternion.clone()) as [Quaternion, Quaternion];
    const cover = rig.arms.map((arm, side) => {
      const eye = new Vector3(side === 0 ? -0.17 : 0.17, 1.12, 0.66);
      return new Quaternion().setFromUnitVectors(up, eye.sub(arm.position).normalize());
    }) as [Quaternion, Quaternion];
    this.actors.push({ rig, baseY: layout.y, phase: index * 1.4, restArms: rest, coverArms: cover });
  }

  private stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  private readonly tick = (time: number): void => {
    if (!this.running) return;
    this.elapsed += (time - this.lastTime) / 1000;
    this.lastTime = time;
    this.update();
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.tick);
  };

  private renderOnce(): void {
    if (this.running) return;
    this.update();
    this.renderer.render(this.scene, this.camera);
  }

  private update(): void {
    const motion = this.options.reducedMotion ? 0 : 1;
    const ease = this.running ? 1 : 10;
    const step = (rate: number): number => Math.min(1, rate * ease);
    const sinceMood = this.elapsed - this.moodStart;
    const sad = this.mood === "sad";
    const happy = this.mood === "happy" && sinceMood < HAPPY_SECONDS;
    const shake = sad && sinceMood < SAD_SHAKE_SECONDS ? (1 - sinceMood / SAD_SHAKE_SECONDS) * 0.28 * motion : 0;

    this.covering = MathUtils.lerp(this.covering, this.coverTarget, step(0.16));

    this.actors.forEach((actor, index) => {
      const { root, head, arms } = actor.rig;
      const bob = Math.sin(this.elapsed * 1.6 + actor.phase) * 0.04 * motion;
      const hop = happy ? Math.abs(Math.sin(this.elapsed * 7 + actor.phase)) * 0.3 * motion : 0;
      const yaw = this.gaze.x * 0.55 + Math.sin(this.elapsed * 38 + actor.phase) * shake;
      const pitch = -this.gaze.y * 0.25 + (sad ? 0.32 : 0) + (this.covering > 0.5 ? 0.08 : 0);

      root.position.y = MathUtils.lerp(root.position.y, actor.baseY + bob + hop, step(0.2));
      head.rotation.y = MathUtils.lerp(head.rotation.y, yaw, step(0.14));
      head.rotation.x = MathUtils.lerp(head.rotation.x, pitch, step(0.14));
      head.rotation.z = MathUtils.lerp(head.rotation.z, sad ? (index % 2 === 0 ? 0.12 : -0.12) : 0, step(0.1));

      arms.forEach((arm, side) => {
        const rest = actor.restArms[side]!;
        const cover = actor.coverArms[side]!;
        arm.quaternion.slerpQuaternions(rest, cover, this.covering);
      });
    });
  }
}
