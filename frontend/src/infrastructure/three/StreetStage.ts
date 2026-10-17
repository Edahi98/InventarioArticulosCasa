import {
  AmbientLight,
  type CanvasTexture,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Material,
  MathUtils,
  Mesh,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
  type BufferGeometry,
} from "three";
import { SkyTexture } from "./SkyTexture.js";
import { StreetBuilder, type StreetActors } from "./StreetBuilder.js";

export interface StreetStageOptions {
  reducedMotion: boolean;
}

const HORIZON = 0xffe3d6;
const STREET_HALF_LENGTH = 22;
const CAMERA_HOME = new Vector3(-2.2, 3.1, 9.6);
const CAMERA_TARGET = new Vector3(0, 1.05, -2.4);

export class StreetStage {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(36, 1, 0.1, 80);
  private readonly actors: StreetActors;
  private readonly sky: CanvasTexture;
  private readonly pointer = { x: 0, y: 0 };
  private frame = 0;
  private running = false;
  private elapsed = 0;
  private lastTime = 0;

  /**
   * @param canvas - Lienzo donde se dibuja la calle.
   * @param seed - Texto de la ubicación; decide cuántas casas y árboles hay y de qué colores.
   * @param options - Si la persona pidió menos movimiento, la escena se dibuja quieta.
   */
  constructor(
    private readonly canvas: HTMLCanvasElement,
    seed: string,
    private readonly options: StreetStageOptions,
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;

    this.sky = SkyTexture.create();
    this.scene.background = this.sky;
    this.scene.fog = new Fog(HORIZON, 16, 38);
    this.addLights();

    const { world, actors } = new StreetBuilder(seed).build();
    this.actors = actors;
    this.scene.add(world);
    this.camera.position.copy(CAMERA_HOME);
    this.camera.lookAt(CAMERA_TARGET);
  }

  /**
   * Ajusta el lienzo al contenedor; en paneles angostos abre el encuadre para que se vea la calle.
   *
   * @param width - Ancho en píxeles CSS.
   * @param height - Alto en píxeles CSS.
   */
  resize(width: number, height: number): void {
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.fov = MathUtils.clamp(36 + (1.8 - this.camera.aspect) * 14, 34, 58);
    this.camera.updateProjectionMatrix();
    this.renderOnce();
  }

  /**
   * Mueve un poco la cámara hacia el puntero para dar profundidad.
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
   * Arranca o pausa la animación (se pausa cuando la escena no está en pantalla).
   *
   * @param visible - Si la escena está en pantalla.
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
   * Libera geometrías, materiales, el cielo y el contexto WebGL.
   */
  dispose(): void {
    this.stop();
    this.scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      (object.geometry as BufferGeometry).dispose();
      (object.material as Material).dispose();
    });
    this.sky.dispose();
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
    this.camera.position.set(
      CAMERA_HOME.x + Math.sin(t * 0.22) * 0.7 + this.pointer.x * 0.9,
      CAMERA_HOME.y - this.pointer.y * 0.3,
      CAMERA_HOME.z,
    );
    this.camera.lookAt(CAMERA_TARGET);

    this.actors.swaying.forEach((tree, index) => {
      tree.rotation.z = Math.sin(t * 1.1 + index) * 0.025;
    });
    this.actors.clouds.forEach((cloud, index) => {
      cloud.position.x += this.options.reducedMotion ? 0 : 0.004 * (1 + (index % 3) * 0.4);
      if (cloud.position.x > STREET_HALF_LENGTH) cloud.position.x = -STREET_HALF_LENGTH;
    });
    this.actors.car.position.x = this.options.reducedMotion ? -4 : ((t * 1.6) % (STREET_HALF_LENGTH * 2)) - STREET_HALF_LENGTH;
    this.actors.windows.forEach((glass, index) => {
      glass.emissiveIntensity = 0.85 + Math.sin(t * 1.4 + index * 1.7) * 0.12;
    });
  }

  private addLights(): void {
    const sun = new DirectionalLight(0xfff0d6, 2.3);
    sun.position.set(-7, 9, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -18;
    sun.shadow.camera.right = 18;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 36;
    sun.shadow.bias = -0.0006;
    this.scene.add(new AmbientLight(0xfff0f6, 0.75), new HemisphereLight(0xcdbaf7, 0xbfe9d5, 0.9), sun);
  }
}
