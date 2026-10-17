import {
  AmbientLight,
  DirectionalLight,
  Fog,
  HemisphereLight,
  InstancedMesh,
  MathUtils,
  Mesh,
  Object3D,
  PerspectiveCamera,
  Points,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
  type BufferGeometry,
  type CanvasTexture,
  type Material,
  type Texture,
} from "three";
import { DayLife } from "../neighborhood/DayLife.js";
import { NightSky } from "../neighborhood/NightSky.js";
import { SkyCycle, type SkyState } from "../neighborhood/SkyCycle.js";
import type { Interactive } from "../park/ParkInteraction.js";
import { SkyTexture } from "../SkyTexture.js";
import type { ScenicWorld } from "./ScenicWorld.js";

export interface ScenicOptions {
  reducedMotion: boolean;
  world: ScenicWorld;
}

const TAP_DISTANCE = 6;
const TAP_TIME = 500;
const HOME = new Vector3(0, 1.5, 42);
const TARGET = new Vector3(0, 0.5, 0);
const DAY = 14.5;
const NIGHT = 22;

export class ScenicStage {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(28, 1, 0.5, 700);
  private readonly sky: CanvasTexture;
  private readonly fog = new Fog(0xffe3d6, 90, 240);
  private readonly sun = new DirectionalLight(0xfff0d6, 2.2);
  private readonly ambient = new AmbientLight(0xfff0f6, 0.8);
  private readonly hemisphere = new HemisphereLight(0xcdbaf7, 0xbfe9d5, 0.9);
  private readonly world: ScenicWorld;
  private readonly nightSky = new NightSky(80, 40);
  private readonly dayLife = new DayLife(80, 40);
  private readonly raycaster = new Raycaster();
  private readonly pointer = { x: 0, y: 0, smoothX: 0, smoothY: 0 };
  private readonly down = { x: 0, y: 0, time: 0 };
  private state: SkyState;
  private hovered: Interactive | null = null;
  private skyKey = "";
  private hour = DAY;
  private frame = 0;
  private running = false;
  private elapsed = 0;
  private lastTime = 0;

  /**
   * @param canvas - Lienzo donde se dibuja el cielo.
   * @param options - Si la persona pidió menos movimiento, el cielo se dibuja quieto.
   */
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: ScenicOptions,
  ) {
    this.world = options.world;
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.state = SkyCycle.at(this.hour);
    this.sky = SkyTexture.create(this.state.palette);
    this.scene.background = this.sky;
    this.scene.fog = this.fog;
    this.sun.position.set(-18, 26, 24);
    this.nightSky.group.visible = this.world.outdoor;
    this.dayLife.group.visible = this.world.outdoor;
    this.scene.add(this.world.group, this.nightSky.group, this.dayLife.group, this.ambient, this.hemisphere, this.sun);
    this.camera.position.copy(HOME);
    this.camera.lookAt(TARGET);
    this.canvas.addEventListener("pointermove", this.handleMove);
    this.canvas.addEventListener("pointerdown", this.handleDown);
    this.canvas.addEventListener("pointerup", this.handleUp);
    this.canvas.addEventListener("pointerleave", this.handleLeave);
  }

  /**
   * Cambia entre el cielo de día y el de noche según el tema de la página.
   *
   * @param dark - Si el tema es oscuro.
   */
  setDark(dark: boolean): void {
    this.hour = dark ? NIGHT : DAY;
    this.renderOnce();
  }

  /**
   * Mueve un poco la cámara hacia donde apunta el puntero, para dar profundidad.
   *
   * @param x - Posición horizontal normalizada entre -1 y 1.
   * @param y - Posición vertical normalizada entre -1 y 1.
   */
  setPointer(x: number, y: number): void {
    this.pointer.x = x;
    this.pointer.y = y;
  }

  /**
   * Lanza confeti desde varios rincones del cielo, para festejar (por ejemplo al entrar).
   */
  celebrate(): void {
    [new Vector3(-12, 8, -2), new Vector3(11, 7, -3), new Vector3(0, 10, -4)].forEach((point) => this.world.pop(point, 70));
  }

  /**
   * Ajusta el lienzo y el encuadre.
   *
   * @param width - Ancho en píxeles CSS.
   * @param height - Alto en píxeles CSS.
   */
  resize(width: number, height: number): void {
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderOnce();
  }

  /**
   * Arranca o pausa la animación (se pausa cuando el cielo no está en pantalla).
   *
   * @param visible - Si el cielo está en pantalla.
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
   * Quita los eventos y libera geometrías, materiales, texturas, el cielo y el contexto WebGL.
   */
  dispose(): void {
    this.stop();
    this.canvas.removeEventListener("pointermove", this.handleMove);
    this.canvas.removeEventListener("pointerdown", this.handleDown);
    this.canvas.removeEventListener("pointerup", this.handleUp);
    this.canvas.removeEventListener("pointerleave", this.handleLeave);
    this.scene.traverse((object) => {
      if (!(object instanceof Mesh || object instanceof Points)) return;
      const material = object.material as Material & { map?: Texture | null };
      (object.geometry as BufferGeometry).dispose();
      material.map?.dispose();
      material.dispose();
      if (object instanceof InstancedMesh) object.dispose();
    });
    this.sky.dispose();
    this.nightSky.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  private readonly tick = (now: number): void => {
    if (!this.running) return;
    this.elapsed += Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.animate();
    this.render();
    this.frame = requestAnimationFrame(this.tick);
  };

  private readonly handleMove = (event: PointerEvent): void => {
    const target = this.pick(event);
    if (target?.id === this.hovered?.id) return;
    this.hovered = target;
    this.canvas.style.cursor = target ? "pointer" : "";
  };

  private readonly handleLeave = (): void => {
    this.hovered = null;
    this.canvas.style.cursor = "";
  };

  private readonly handleDown = (event: PointerEvent): void => {
    this.down.x = event.clientX;
    this.down.y = event.clientY;
    this.down.time = performance.now();
  };

  private readonly handleUp = (event: PointerEvent): void => {
    const moved = Math.hypot(event.clientX - this.down.x, event.clientY - this.down.y);
    if (moved > TAP_DISTANCE || performance.now() - this.down.time > TAP_TIME) return;
    this.setRay(event);
    const hit = this.nearest();
    if (hit) {
      hit.interactive.hit(this.elapsed, hit.point);
      this.world.pop(hit.point, 40);
      return;
    }
    this.world.pop(this.raycaster.ray.at(40, new Vector3()), 45);
  };

  private setRay(event: PointerEvent): void {
    const box = this.canvas.getBoundingClientRect();
    this.raycaster.setFromCamera(new Vector2(((event.clientX - box.left) / box.width) * 2 - 1, -((event.clientY - box.top) / box.height) * 2 + 1), this.camera);
  }

  private nearest(): { interactive: Interactive; point: Vector3 } | null {
    const hit = this.raycaster.intersectObjects(this.world.interactives.map((item) => item.object), true)[0];
    if (!hit) return null;
    const id = ScenicStage.interactiveId(hit.object);
    const interactive = this.world.interactives.find((item) => item.id === id);
    return interactive ? { interactive, point: hit.point } : null;
  }

  private pick(event: PointerEvent): Interactive | null {
    this.setRay(event);
    return this.nearest()?.interactive ?? null;
  }

  private static interactiveId(object: Object3D | null): string | null {
    if (!object) return null;
    const id = object.userData.interactiveId as string | undefined;
    return id ?? ScenicStage.interactiveId(object.parent);
  }

  private stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  private renderOnce(): void {
    if (this.running) return;
    this.animate();
    this.render();
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  private animate(): void {
    const t = this.options.reducedMotion ? 0 : this.elapsed;
    const moving = !this.options.reducedMotion;
    this.applySky(t);
    this.world.update(this.elapsed, this.state.night, moving);
    this.dayLife.update(t, this.state.night, moving);
    this.pointer.smoothX += (this.pointer.x - this.pointer.smoothX) * 0.06;
    this.pointer.smoothY += (this.pointer.y - this.pointer.smoothY) * 0.06;
    const distance = MathUtils.clamp(18 / (0.249 * Math.max(this.camera.aspect, 0.3)), 42, 74);
    this.camera.position.set(
      HOME.x + this.pointer.smoothX * 2.2 + Math.sin(t * 0.15) * 0.6,
      HOME.y - this.pointer.smoothY * 1.1,
      TARGET.z + distance,
    );
    this.camera.lookAt(TARGET);
  }

  private applySky(t: number): void {
    this.state = SkyCycle.at(this.hour);
    const { palette } = this.state;
    const key = `${palette.top}${palette.mid}${palette.horizon}`;
    if (key !== this.skyKey) {
      SkyTexture.paint(this.sky, palette);
      this.skyKey = key;
    }
    this.fog.color.setHex(this.state.fog);
    this.sun.color.setHex(this.state.light);
    this.sun.intensity = this.state.lightIntensity;
    this.ambient.intensity = this.state.ambientIntensity;
    this.hemisphere.color.setHex(this.state.hemiSky);
    this.hemisphere.groundColor.setHex(this.state.hemiGround);
    this.nightSky.update(this.state, t);
  }
}
