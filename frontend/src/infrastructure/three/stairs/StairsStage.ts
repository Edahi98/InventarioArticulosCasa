import {
  AmbientLight,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
} from "three";
import { BearBuilder } from "../BearBuilder.js";
import { GuardianBear } from "../neighborhood/GuardianBear.js";
import { ClayMaterials } from "../park/ClayMaterials.js";
import { StarGeometry } from "../StarGeometry.js";
import { Toy } from "../scenes/Toy.js";

export interface StairsOptions {
  reducedMotion: boolean;
}

export const STEP_COUNT = 12;

const RUN = 3.6;
const DROP = 1.7;
const TOP = 9.5;
const FIRST_X = -((STEP_COUNT - 1) * RUN) / 2;
const SPEED = 5;
const STEP_COLORS = [0xff8fb7, 0x7fd0ea, 0xffe35c, 0xb89cf2, 0x86d6a8, 0xffb066] as const;

export class StairsStage {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(24, 1, 0.5, 300);
  private readonly sun = new DirectionalLight(0xfff0d6, 2.4);
  private readonly ambient = new AmbientLight(0xfff0f6, 0.8);
  private readonly hemisphere = new HemisphereLight(0xcdbaf7, 0xbfe9d5, 0.9);
  private readonly bear: GuardianBear;
  private readonly stars: Mesh[] = [];
  private position = 0;
  private target = 0;
  private frame = 0;
  private running = false;
  private elapsed = 0;
  private lastTime = 0;
  private moving = false;

  /**
   * Una escalera de juguete que baja en diagonal por la pantalla, con barandal y adornos, y un osito guardián
   * que baja un escalón cada vez que se avanza el scroll: salta de uno a otro y se queda parado en el escalón.
   *
   * @param canvas - Lienzo donde se dibuja; es transparente para dejar ver el fondo de la página.
   * @param options - Si la persona pidió menos movimiento, el osito pasa de escalón sin saltar ni animarse.
   */
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: StairsOptions,
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    const toy = new Toy(new ClayMaterials());
    this.bear = new GuardianBear(new BearBuilder(), 0, 2.3, true);
    this.bear.group.rotation.y = 1.1;
    this.scene.add(this.ambient, this.hemisphere, this.sun, this.buildSteps(toy), this.buildRail(toy), this.bear.group);
    this.configureSun();
    this.camera.position.set(-3, 0, 60);
    this.camera.lookAt(-3, 0, 0);
  }

  /**
   * Indica cuánto se ha avanzado por la sección; el osito baja al escalón que corresponde.
   *
   * @param progress - Avance entre 0 (arriba) y 1 (abajo).
   */
  setProgress(progress: number): void {
    this.target = Math.round(MathUtils.clamp(progress, 0, 1) * (STEP_COUNT - 1));
    if (this.running) return;
    this.position = this.target;
    this.draw();
  }

  /**
   * Cambia la luz según el tema de la página.
   *
   * @param dark - Si el tema es oscuro.
   */
  setDark(dark: boolean): void {
    this.sun.intensity = dark ? 1.3 : 2.4;
    this.sun.color.setHex(dark ? 0xb9b8ff : 0xfff0d6);
    this.ambient.intensity = dark ? 0.55 : 0.8;
    this.hemisphere.color.setHex(dark ? 0x6a5fb8 : 0xcdbaf7);
    this.draw();
  }

  /**
   * Ajusta el lienzo y aleja la cámara lo necesario para que quepa toda la escalera.
   *
   * @param width - Ancho en píxeles CSS.
   * @param height - Alto en píxeles CSS.
   */
  resize(width: number, height: number): void {
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    const half = Math.tan(MathUtils.degToRad(this.camera.fov / 2));
    this.camera.position.z = Math.max(26 / (half * this.camera.aspect), 13 / half, 40);
    this.camera.updateProjectionMatrix();
    this.draw();
  }

  /**
   * Arranca o pausa la animación según la escalera esté a la vista.
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

  private readonly tick = (now: number): void => {
    if (!this.running) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.elapsed += dt;
    this.lastTime = now;
    const diff = this.target - this.position;
    this.moving = Math.abs(diff) > 0.001;
    this.position += Math.sign(diff) * Math.min(Math.abs(diff), SPEED * dt);
    this.draw();
    this.frame = requestAnimationFrame(this.tick);
  };

  private stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  private draw(): void {
    const calm = this.options.reducedMotion;
    const index = MathUtils.clamp(Math.floor(this.position), 0, STEP_COUNT - 2);
    const along = calm ? 0 : this.position - index;
    const base = calm ? Math.round(this.position) : index;
    const next = Math.min(base + 1, STEP_COUNT - 1);
    const x = MathUtils.lerp(StairsStage.stepX(base), StairsStage.stepX(next), along);
    const y = MathUtils.lerp(StairsStage.stepTop(base), StairsStage.stepTop(next), along);
    const hop = Math.sin(Math.PI * along) * 1.5;
    this.bear.group.position.set(x, y + hop, 0.4);
    this.bear.group.rotation.z = this.moving && !calm ? -0.12 : 0;
    this.bear.update(this.elapsed, this.moving && !calm ? 1 : 0, !calm);
    this.stars.forEach((star, i) => {
      star.rotation.y = calm ? 0 : this.elapsed * 0.9 + i;
      star.position.y = (star.userData.baseY as number) + (calm ? 0 : Math.sin(this.elapsed * 1.3 + i) * 0.3);
    });
    this.renderer.render(this.scene, this.camera);
  }

  private static stepX(index: number): number {
    return FIRST_X + index * RUN;
  }

  private static stepTop(index: number): number {
    return TOP - index * DROP;
  }

  private buildSteps(toy: Toy): Group {
    const steps = new Group();
    const starGeometry = StarGeometry.build();
    for (let index = 0; index < STEP_COUNT; index += 1) {
      const top = StairsStage.stepTop(index);
      const height = top + 60;
      const color = STEP_COLORS[index % STEP_COLORS.length] as number;
      const block = toy.box([RUN, height, 4.2], color, [StairsStage.stepX(index), top - height / 2, 0], 0.35);
      const tread = toy.box([RUN + 0.1, 0.34, 4.4], 0xfff0d6, [StairsStage.stepX(index), top - 0.1, 0], 0.15);
      block.castShadow = true;
      block.receiveShadow = true;
      tread.receiveShadow = true;
      steps.add(block, tread);
      if (index % 3 === 1) {
        const pot = toy.cylinder(0.45, 0.35, 0.7, 0xc4805a, [StairsStage.stepX(index) - 0.9, top + 0.35, -1.2]);
        const leaf = toy.ball(0.7, 0x7cc88a, [StairsStage.stepX(index) - 0.9, top + 1.1, -1.2]);
        pot.castShadow = true;
        leaf.castShadow = true;
        steps.add(pot, leaf);
      }
      if (index % 4 === 2) {
        const star = new Mesh(starGeometry, toy.clay.get(0xffd43b));
        star.scale.setScalar(0.6);
        star.position.set(StairsStage.stepX(index) + 0.4, top + 3.4, 0);
        star.userData.baseY = star.position.y;
        this.stars.push(star);
        steps.add(star);
      }
    }
    return steps;
  }

  private buildRail(toy: Toy): Group {
    const rail = new Group();
    const front = -1.6;
    for (let index = 0; index < STEP_COUNT; index += 1) {
      const post = toy.cylinder(0.1, 0.1, 2.2, 0xfff6dc, [StairsStage.stepX(index) + 0.9, StairsStage.stepTop(index) + 1.1, front]);
      post.castShadow = true;
      rail.add(post);
      rail.add(toy.ball(0.2, 0xff8fb7, [StairsStage.stepX(index) + 0.9, StairsStage.stepTop(index) + 2.25, front]));
    }
    const dx = (STEP_COUNT - 1) * RUN;
    const dy = (STEP_COUNT - 1) * DROP;
    const bar = new Mesh(new CylinderGeometry(0.14, 0.14, Math.hypot(dx, dy), 12), toy.clay.get(0xfff6dc));
    bar.rotation.z = Math.PI / 2 - Math.atan2(dy, dx);
    bar.position.set(StairsStage.stepX(0) + dx / 2 + 0.9, TOP - dy / 2 + 2.25, front);
    rail.add(bar);
    return rail;
  }

  private configureSun(): void {
    this.sun.position.set(-14, 26, 30);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -30;
    this.sun.shadow.camera.right = 30;
    this.sun.shadow.camera.top = 22;
    this.sun.shadow.camera.bottom = -22;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 120;
    this.sun.shadow.bias = -0.0006;
  }
}
