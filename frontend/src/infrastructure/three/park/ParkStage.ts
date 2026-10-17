import {
  AmbientLight,
  DirectionalLight,
  Fog,
  HemisphereLight,
  InstancedMesh,
  MathUtils,
  Mesh,
  Object3D,
  PCFSoftShadowMap,
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
import { SkyTexture } from "../SkyTexture.js";
import type { Interactive } from "./ParkInteraction.js";
import { ParkBuilder } from "./ParkBuilder.js";

export interface ParkOptions {
  reducedMotion: boolean;
  centered?: boolean;
}

const TAP_DISTANCE = 6;
const TAP_TIME = 500;
const HOME = new Vector3(9.5, 7.5, 38);
const TARGET = new Vector3(9.5, 5.2, 0);
const DAY = 14.5;
const NIGHT = 22;

export class ParkStage {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(28, 1, 0.5, 700);
  private readonly sky: CanvasTexture;
  private readonly fog = new Fog(0xffe3d6, 60, 190);
  private readonly sun = new DirectionalLight(0xfff0d6, 2.3);
  private readonly ambient = new AmbientLight(0xfff0f6, 0.75);
  private readonly hemisphere = new HemisphereLight(0xcdbaf7, 0xbfe9d5, 0.9);
  private readonly park = new ParkBuilder();
  private readonly nightSky = new NightSky(80, 40);
  private readonly dayLife = new DayLife(80, 40);
  private readonly raycaster = new Raycaster();
  private readonly pointer = { x: 0, y: 0, smoothX: 0, smoothY: 0 };
  private readonly down = { x: 0, y: 0, time: 0 };
  private state: SkyState;
  private hovered: Interactive | null = null;
  private skyKey = "";
  private hour = DAY;
  private width = 1;
  private height = 1;
  private frame = 0;
  private running = false;
  private elapsed = 0;
  private lastTime = 0;

  /**
   * @param canvas - Lienzo donde se dibuja el parque.
   * @param options - Si la persona pidió menos movimiento, el parque se dibuja quieto.
   */
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: ParkOptions,
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.state = SkyCycle.at(this.hour);
    this.sky = SkyTexture.create(this.state.palette);
    this.scene.background = this.sky;
    this.scene.fog = this.fog;
    this.scene.add(this.park.group, this.nightSky.group, this.dayLife.group, this.ambient, this.hemisphere, this.sun);
    this.configureSun();
    this.camera.position.copy(HOME);
    this.camera.lookAt(TARGET);
    this.canvas.addEventListener("pointermove", this.handleMove);
    this.canvas.addEventListener("pointerdown", this.handleDown);
    this.canvas.addEventListener("pointerup", this.handleUp);
    this.canvas.addEventListener("pointerleave", this.handleLeave);
  }

  /**
   * Cambia entre el parque de día y el de noche (con luces encendidas) según el tema de la página.
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
   * Ajusta el lienzo y el encuadre: en pantallas anchas el parque se corre a la derecha para dejar libre el
   * texto, y en pantallas angostas baja para que quede bajo el título.
   *
   * @param width - Ancho en píxeles CSS.
   * @param height - Alto en píxeles CSS.
   */
  resize(width: number, height: number): void {
    if (width === 0 || height === 0) return;
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);
    const aspect = width / height;
    this.camera.aspect = aspect;
    const shiftX = aspect > 1.15 && !this.options.centered ? -width * 0.18 : 0;
    const shiftY = aspect < 0.95 ? -height * 0.2 : 0;
    this.camera.setViewOffset(width, height, shiftX, shiftY, width, height);
    this.camera.updateProjectionMatrix();
    this.renderOnce();
  }

  /**
   * Arranca o pausa la animación (se pausa cuando el parque no está en pantalla).
   *
   * @param visible - Si el parque está en pantalla.
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
    this.hovered?.hover?.(false);
    this.hovered = target;
    this.hovered?.hover?.(true);
    this.canvas.style.cursor = target ? "pointer" : "";
  };

  private readonly handleLeave = (): void => {
    this.hovered?.hover?.(false);
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
    const box = this.canvas.getBoundingClientRect();
    this.setRay(event, box);
    const hit = this.nearest();
    if (hit) {
      hit.interactive.hit(this.elapsed, hit.point);
      return;
    }
    this.park.pop(this.raycaster.ray.at(36, new Vector3()), 45);
  };

  private setRay(event: PointerEvent, box: DOMRect): void {
    this.raycaster.setFromCamera(new Vector2(((event.clientX - box.left) / box.width) * 2 - 1, -((event.clientY - box.top) / box.height) * 2 + 1), this.camera);
  }

  private nearest(): { interactive: Interactive; point: Vector3 } | null {
    const hit = this.raycaster.intersectObjects(this.park.interactives.map((item) => item.object), true)[0];
    if (!hit) return null;
    const id = ParkStage.interactiveId(hit.object);
    const interactive = this.park.interactives.find((item) => item.id === id);
    return interactive ? { interactive, point: hit.point } : null;
  }

  private pick(event: PointerEvent): Interactive | null {
    this.setRay(event, this.canvas.getBoundingClientRect());
    return this.nearest()?.interactive ?? null;
  }

  private static interactiveId(object: Object3D | null): string | null {
    if (!object) return null;
    const id = object.userData.interactiveId as string | undefined;
    return id ?? ParkStage.interactiveId(object.parent);
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
    this.park.update(this.elapsed, this.state.night, moving);
    this.dayLife.update(t, this.state.night, moving);
    this.pointer.smoothX += (this.pointer.x - this.pointer.smoothX) * 0.06;
    this.pointer.smoothY += (this.pointer.y - this.pointer.smoothY) * 0.06;
    const distance = MathUtils.clamp(18 / (0.249 * Math.max(this.camera.aspect, 0.3)), 38, 74);
    this.camera.position.set(
      HOME.x + this.pointer.smoothX * 1.8 + Math.sin(t * 0.15) * 0.6,
      HOME.y - this.pointer.smoothY * 0.9,
      TARGET.z + distance,
    );
    this.camera.lookAt(TARGET);
  }

  private applySky(t: number): void {
    this.state = SkyCycle.at(this.hour);
    const { palette, arc } = this.state;
    const key = `${palette.top}${palette.mid}${palette.horizon}`;
    if (key !== this.skyKey) {
      SkyTexture.paint(this.sky, palette);
      this.skyKey = key;
    }
    this.fog.color.setHex(this.state.fog);
    this.sun.color.setHex(this.state.light);
    this.sun.intensity = this.state.lightIntensity;
    this.sun.position.set(-Math.cos(arc) * 34, Math.max(Math.sin(arc), 0.3) * 34, 24);
    this.ambient.intensity = this.state.ambientIntensity;
    this.hemisphere.color.setHex(this.state.hemiSky);
    this.hemisphere.groundColor.setHex(this.state.hemiGround);
    this.nightSky.update(this.state, t);
  }

  private configureSun(): void {
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -34;
    this.sun.shadow.camera.right = 40;
    this.sun.shadow.camera.top = 24;
    this.sun.shadow.camera.bottom = -14;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 120;
    this.sun.shadow.bias = -0.0006;
    this.sun.target.position.set(9.5, 0, 0);
    this.scene.add(this.sun.target);
  }
}
