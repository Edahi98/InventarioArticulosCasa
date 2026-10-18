import {
  AmbientLight,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  InstancedMesh,
  Material,
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
  type Texture,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SkyTexture } from "../SkyTexture.js";
import type { WalkGap, WalkZone } from "../walk/WalkArea.js";
import type { DoorPrompt, WalkMode } from "../walk/WalkMode.js";
import type { Backdrop } from "./Backdrop.js";
import type { DayLife } from "./DayLife.js";
import { NeighborhoodBuilder, type HouseEntry, type MapCategory } from "./NeighborhoodBuilder.js";
import type { Traffic } from "./Traffic.js";
import { NightSky } from "./NightSky.js";
import { SkyCycle, type SkyState } from "./SkyCycle.js";

export interface NeighborhoodHover {
  id: number;
  name: string;
  count: number;
  x: number;
  y: number;
  selected: boolean;
}

export interface NeighborhoodCallbacks {
  onHover(hover: NeighborhoodHover | null): void;
  onPick(id: number | null): void;
  onEnter(id: number): void;
  onSelect(id: number): void;
  onHour(hour: number): void;
  onWalkPrompt(prompt: DoorPrompt | null): void;
  onWalkLock(locked: boolean): void;
  onWalkDrive(driving: boolean): void;
}

export interface NeighborhoodOptions {
  reducedMotion: boolean;
}

interface Flight {
  id: number;
  enter: boolean;
  start: number;
  fromPosition: Vector3;
  fromTarget: Vector3;
  toPosition: Vector3;
  toTarget: Vector3;
}

const TAP_DISTANCE = 6;
const TAP_TIME = 500;
const LIFT = 0.2;
const GROW = 0.07;
const GLOW = 1.1;
const FLIGHT_MS = 1350;
const FOCUS_MS = 950;
const DOOR_OPEN = -1.75;

export class NeighborhoodStage {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(26, 1, 0.5, 600);
  private readonly controls: OrbitControls;
  private readonly sky: CanvasTexture;
  private readonly skyKey = { value: "" };
  private readonly raycaster = new Raycaster();
  private readonly houses: HouseEntry[];
  private readonly swaying: Object3D[];
  private readonly lamps: { emissiveIntensity: number }[];
  private readonly levels = new Map<number, number>();
  private readonly radius: number;
  private readonly world: Group;
  private readonly zones: WalkZone[];
  private readonly gaps: WalkGap[];
  private walker: WalkMode | null = null;
  private walkPending = false;
  private idleTimer = 0;
  private readonly down = { x: 0, y: 0, time: 0 };
  private readonly fog = new Fog(0xffe3d6, 32, 95);
  private readonly sun = new DirectionalLight(0xfff0d6, 2.3);
  private readonly ambient = new AmbientLight(0xfff0f6, 0.75);
  private readonly hemisphere = new HemisphereLight(0xcdbaf7, 0xbfe9d5, 0.9);
  private readonly nightSky: NightSky;
  private readonly traffic: Traffic;
  private readonly dayLife: DayLife;
  private readonly backdrop: Backdrop;
  private hourOverride: number | null = null;
  private state: SkyState;
  private hoverId: number | null = null;
  private pinnedId: number | null = null;
  private selectedId: number | null = null;
  private lastSelected = false;
  private flight: Flight | null = null;
  private lastHover = { x: -1, y: -1 };
  private lastHour = -1;
  private framed = false;
  private frame = 0;
  private running = false;
  private elapsed = 0;
  private lastTime = 0;

  /**
   * @param canvas - Lienzo donde se dibuja el barrio.
   * @param categories - Categorías con su número de artículos; cada una es una casa.
   * @param callbacks - Avisos: puntero sobre una casa, inicio y fin de la entrada, y hora del día.
   * @param options - Si la persona pidió menos movimiento, no hay animación continua ni vuelo.
   */
  constructor(
    private readonly canvas: HTMLCanvasElement,
    categories: MapCategory[],
    private readonly callbacks: NeighborhoodCallbacks,
    private readonly options: NeighborhoodOptions,
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;

    this.state = SkyCycle.at(SkyCycle.hourOf());
    this.sky = SkyTexture.create(this.state.palette);
    this.scene.background = this.sky;
    this.scene.fog = this.fog;

    const { world, houses, swaying, lamps, traffic, dayLife, backdrop, radius, zones, gaps } = new NeighborhoodBuilder(categories).build();
    this.backdrop = backdrop;
    this.traffic = traffic;
    this.dayLife = dayLife;
    this.houses = houses;
    this.swaying = swaying;
    this.lamps = lamps;
    this.radius = radius;
    this.world = world;
    this.zones = zones;
    this.gaps = gaps;
    houses.forEach((house) => this.levels.set(house.id, 0));
    this.nightSky = new NightSky(radius * 2, radius * 2);
    this.scene.add(world, this.nightSky.group);
    this.addLights();

    this.controls = this.createControls();
    this.canvas.addEventListener("pointermove", this.handleMove);
    this.canvas.addEventListener("pointerleave", this.handleLeave);
    this.canvas.addEventListener("pointerdown", this.handleDown);
    this.canvas.addEventListener("pointerup", this.handleUp);
  }

  /**
   * Ajusta el lienzo; la primera vez también encuadra el barrio completo.
   *
   * @param width - Ancho en píxeles CSS.
   * @param height - Alto en píxeles CSS.
   */
  resize(width: number, height: number): void {
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    if (!this.framed) this.resetView();
    this.framed = true;
    this.renderOnce();
  }

  /**
   * Vuelve a la vista inicial que muestra todas las casas.
   */
  resetView(): void {
    const distance = this.fitDistance();
    const yaw = 0.42;
    this.controls.maxDistance = distance * 1.5;
    this.controls.target.set(0, 0.4, 0);
    this.camera.position.set(Math.sin(yaw) * distance * 0.8, distance * 0.6, Math.cos(yaw) * distance * 0.8);
    this.fog.near = distance * 0.9;
    this.fog.far = distance * 2.7;
    this.controls.update();
    this.renderOnce();
  }

  /**
   * Fija la hora del día que se ve en el barrio, o la suelta para que siga la hora real.
   *
   * @param hour - Hora decimal entre 0 y 24, o `null` para seguir el reloj de la persona.
   */
  setHour(hour: number | null): void {
    this.hourOverride = hour;
    this.renderOnce();
  }

  /**
   * Resalta una casa desde fuera del lienzo, por ejemplo al enfocar su etiqueta con el teclado.
   *
   * @param id - Identificador de la categoría, o `null` para quitar el resalte.
   */
  highlight(id: number | null): void {
    this.pinnedId = id;
    this.setHover(id ?? this.hoverId);
  }

  /**
   * Selecciona una casa: la cámara vuela suave hasta enfrentarla y se avisa su posición en pantalla
   * para anclarle una tarjeta. Con `null` se quita la selección.
   *
   * @param id - Identificador de la categoría, o `null` para deseleccionar.
   */
  focus(id: number | null): void {
    this.selectedId = id;
    this.callbacks.onPick(id);
    window.clearTimeout(this.idleTimer);
    const house = this.houses.find((entry) => entry.id === id);
    if (!house) {
      this.idleTimer = window.setTimeout(() => {
        this.controls.autoRotate = !this.options.reducedMotion;
      }, 4000);
      this.announce();
      this.renderOnce();
      return;
    }
    this.controls.autoRotate = false;
    const target = house.group.position.clone().add(new Vector3(0, 0.9, 0));
    const position = house.group.position.clone().addScaledVector(house.group.getWorldDirection(new Vector3()), 12.5).add(new Vector3(0, 7.4, 0));
    if (this.options.reducedMotion || !this.running) {
      this.camera.position.copy(position);
      this.controls.target.copy(target);
      this.controls.update();
      this.announce();
      this.renderOnce();
      return;
    }
    this.flight = {
      id: house.id,
      enter: false,
      start: performance.now(),
      fromPosition: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      toPosition: position,
      toTarget: target,
    };
    this.controls.enabled = false;
  }

  /**
   * Arranca o pausa la animación (se pausa cuando el mapa no está en pantalla).
   *
   * @param visible - Si el mapa está en pantalla.
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
   * Quita los eventos y libera geometrías, materiales, el cielo y el contexto WebGL.
   */
  dispose(): void {
    this.stop();
    window.clearTimeout(this.idleTimer);
    this.canvas.removeEventListener("pointermove", this.handleMove);
    this.canvas.removeEventListener("pointerleave", this.handleLeave);
    this.canvas.removeEventListener("pointerdown", this.handleDown);
    this.canvas.removeEventListener("pointerup", this.handleUp);
    this.walker?.dispose();
    this.controls.dispose();
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
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.elapsed += dt;
    this.lastTime = now;
    this.walker?.update(dt);
    this.animate(now);
    if (!this.flight && !this.walker) this.controls.update();
    this.render();
    this.frame = requestAnimationFrame(this.tick);
  };

  private readonly handleMove = (event: PointerEvent): void => {
    if (event.buttons !== 0 || this.flight || this.walker) return;
    this.setHover(this.pinnedId ?? this.pick(event));
    this.canvas.style.cursor = this.hoverId === null ? "grab" : "pointer";
  };

  private readonly handleLeave = (): void => {
    if (!this.flight && !this.walker) this.setHover(this.pinnedId);
  };

  private readonly handleDown = (event: PointerEvent): void => {
    if (this.walker) return;
    this.down.x = event.clientX;
    this.down.y = event.clientY;
    this.down.time = performance.now();
    if (!this.flight) this.canvas.style.cursor = "grabbing";
  };

  private readonly handleUp = (event: PointerEvent): void => {
    if (this.flight || this.walker) return;
    this.canvas.style.cursor = this.hoverId === null ? "grab" : "pointer";
    const moved = Math.hypot(event.clientX - this.down.x, event.clientY - this.down.y);
    if (moved > TAP_DISTANCE || performance.now() - this.down.time > TAP_TIME) return;
    this.focus(this.pick(event));
  };

  /**
   * Entra a una casa: la cámara vuela a su puerta, la puerta se abre y se avisa al terminar.
   * Con movimiento reducido se avisa de inmediato.
   *
   * @param id - Identificador de la categoría.
   */
  enterHouse(id: number): void {
    const house = this.houses.find((entry) => entry.id === id);
    if (!house || this.options.reducedMotion || !this.running) {
      this.callbacks.onSelect(id);
      return;
    }
    const hinge = house.door.getWorldPosition(new Vector3());
    const forward = house.group.getWorldDirection(new Vector3());
    const toTarget = hinge.clone().add(new Vector3(0, 0.1, 0));
    this.controls.autoRotate = false;
    this.flight = {
      id,
      enter: true,
      start: performance.now(),
      fromPosition: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      toPosition: toTarget.clone().addScaledVector(forward, 1.7).add(new Vector3(0, 0.22, 0)),
      toTarget,
    };
    this.controls.enabled = false;
    this.selectedId = id;
    this.hoverId = id;
    this.canvas.style.cursor = "wait";
    this.callbacks.onEnter(id);
  }

/**
   * Pasa a primera persona: carga la física, coloca al jugador frente a una casa y suelta la cámara orbital.
   *
   * @param houseId - Casa frente a la que aparece, o `null` para la primera.
   * @param fromDoor - Si se viene de salir de su cuarto: su puerta empieza abierta y se cierra sola.
   * @returns Una promesa que se cumple cuando el paseo está listo; falla si no se puede cargar el motor.
   */
  async startWalking(houseId: number | null, fromDoor: boolean): Promise<void> {
    if (this.walker || this.walkPending) return;
    this.walkPending = true;
    try {
      const { WalkMode } = await import("../walk/WalkMode.js");
      this.walker = await WalkMode.begin({
        camera: this.camera,
        canvas: this.canvas,
        world: this.world,
        houses: this.houses,
        traffic: this.traffic,
        radius: this.radius,
        zones: this.zones,
        gaps: this.gaps,
        houseId,
        fromDoor,
        callbacks: {
          onPrompt: (prompt) => this.callbacks.onWalkPrompt(prompt),
          onLock: (locked) => this.callbacks.onWalkLock(locked),
          onEnter: (id) => this.callbacks.onEnter(id),
          onSelect: (id) => this.callbacks.onSelect(id),
          onDrive: (driving) => this.callbacks.onWalkDrive(driving),
        },
      });
    } finally {
      this.walkPending = false;
    }
    window.clearTimeout(this.idleTimer);
    this.flight = null;
    this.controls.enabled = false;
    this.controls.autoRotate = false;
    this.selectedId = null;
    this.hoverId = null;
    this.pinnedId = null;
    this.camera.fov = 72;
    this.camera.near = 0.03;
    this.camera.updateProjectionMatrix();
    this.fog.near = 3;
    this.fog.far = this.radius * 1.6;
    this.canvas.style.cursor = "";
    this.callbacks.onHover(null);
    this.callbacks.onPick(null);
    this.ensureRunning();
  }

  /**
   * Vuelve a la vista orbital de toda la isla.
   */
  stopWalking(): void {
    if (!this.walker) return;
    this.walker.dispose();
    this.walker = null;
    this.camera.fov = 26;
    this.camera.near = 0.5;
    this.camera.updateProjectionMatrix();
    this.controls.enabled = true;
    this.controls.autoRotate = !this.options.reducedMotion;
    this.canvas.style.cursor = "grab";
    this.resetView();
  }

  /**
   * Pide capturar el puntero para mirar con el ratón durante el paseo.
   */
  lockWalk(): void {
    this.walker?.lock();
  }

  /**
   * Abre la puerta que se tiene enfrente y entra, como al pulsar E.
   */
  interactWalk(): void {
    this.walker?.interact();
  }

  /**
   * Joystick virtual del paseo.
   *
   * @param x - Lateral entre -1 y 1.
   * @param y - Adelante (positivo) o atrás (negativo).
   */
  setWalkStick(x: number, y: number): void {
    this.walker?.setStick(x, y);
  }

  private ensureRunning(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  private flyCamera(now: number): void {
    const flight = this.flight;
    if (!flight) return;
    const progress = Math.min((now - flight.start) / (flight.enter ? FLIGHT_MS : FOCUS_MS), 1);
    const eased = NeighborhoodStage.easeInOut(progress);
    this.camera.position.lerpVectors(flight.fromPosition, flight.toPosition, eased);
    this.controls.target.lerpVectors(flight.fromTarget, flight.toTarget, eased);
    this.camera.lookAt(this.controls.target);
    const house = this.houses.find((entry) => entry.id === flight.id);
    if (house && flight.enter) {
      const opening = NeighborhoodStage.easeOut(MathUtils.clamp((progress - 0.35) / 0.45, 0, 1));
      house.door.rotation.y = DOOR_OPEN * opening;
    }
    if (progress < 1) return;
    this.flight = null;
    if (flight.enter) {
      this.callbacks.onSelect(flight.id);
      return;
    }
    this.controls.enabled = true;
    this.controls.update();
  }

  private static easeInOut(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private static easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.canvas);
    controls.enableDamping = !this.options.reducedMotion;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.7;
    controls.zoomSpeed = 0.8;
    controls.minDistance = 4.5;
    controls.minPolarAngle = 0.3;
    controls.maxPolarAngle = 1.38;
    controls.autoRotate = !this.options.reducedMotion;
    controls.autoRotateSpeed = 0.35;
    controls.addEventListener("start", () => {
      window.clearTimeout(this.idleTimer);
      controls.autoRotate = false;
    });
    controls.addEventListener("end", () => {
      window.clearTimeout(this.idleTimer);
      this.idleTimer = window.setTimeout(() => {
        controls.autoRotate = !this.options.reducedMotion;
      }, 6000);
    });
    controls.addEventListener("change", () => {
      if (this.flight) return;
      this.clampTarget();
      this.renderOnce();
    });
    this.canvas.style.cursor = "grab";
    return controls;
  }

  private clampTarget(): void {
    const target = this.controls.target;
    const limit = this.radius * 1.9;
    const reach = Math.hypot(target.x, target.z);
    if (reach > limit) {
      target.x *= limit / reach;
      target.z *= limit / reach;
    }
    target.y = MathUtils.clamp(target.y, 0, 3);
  }

  private fitDistance(): number {
    const half = MathUtils.degToRad(this.camera.fov / 2);
    const aspect = Math.max(Math.min(this.camera.aspect, 1.4), 0.45);
    return (this.radius * 1.55) / (Math.tan(half) * aspect);
  }

  private pick(event: PointerEvent): number | null {
    const box = this.canvas.getBoundingClientRect();
    const pointer = new Vector2(((event.clientX - box.left) / box.width) * 2 - 1, -((event.clientY - box.top) / box.height) * 2 + 1);
    this.raycaster.setFromCamera(pointer, this.camera);
    const hit = this.raycaster.intersectObjects(
      this.houses.map((house) => house.group),
      true,
    )[0];
    return hit ? NeighborhoodStage.categoryOf(hit.object) : null;
  }

  private static categoryOf(object: Object3D | null): number | null {
    if (!object) return null;
    const id = object.userData.categoryId as number | undefined;
    return id ?? NeighborhoodStage.categoryOf(object.parent);
  }

  private setHover(id: number | null): void {
    if (id === this.hoverId) {
      this.announce();
      return;
    }
    this.hoverId = id;
    this.announce();
    this.renderOnce();
  }

  private announce(): void {
    const house = this.houses.find((entry) => entry.id === (this.selectedId ?? this.hoverId));
    if (!house || this.flight?.enter) {
      this.lastHover = { x: -1, y: -1 };
      this.callbacks.onHover(null);
      return;
    }
    const selected = this.selectedId !== null;
    const top = house.group.position.clone().add(new Vector3(0, house.height + 0.35, 0)).project(this.camera);
    const box = this.canvas.getBoundingClientRect();
    const x = ((top.x + 1) / 2) * box.width;
    const y = ((1 - top.y) / 2) * box.height;
    if (selected === this.lastSelected && Math.abs(x - this.lastHover.x) < 0.5 && Math.abs(y - this.lastHover.y) < 0.5) return;
    this.lastHover = { x, y };
    this.lastSelected = selected;
    this.callbacks.onHover({ id: house.id, name: house.name, count: house.count, x, y, selected });
  }

  private stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  private renderOnce(): void {
    if (this.running) return;
    this.animate(performance.now());
    this.render();
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  private animate(now: number): void {
    const t = this.options.reducedMotion ? 0 : this.elapsed;
    this.applySky(t);
    this.animateHouses(t);
    this.traffic.update(t, this.state.night, !this.options.reducedMotion);
    this.dayLife.update(t, this.state.night, !this.options.reducedMotion);
    this.backdrop.update(t, this.state.night, !this.options.reducedMotion);    this.swaying.forEach((tree, index) => {
      tree.rotation.z = Math.sin(t * 1.1 + index) * 0.025;
    });
    this.flyCamera(now);
    this.announce();
  }

  private applySky(t: number): void {
    const hour = this.hourOverride ?? SkyCycle.hourOf();
    this.state = SkyCycle.at(hour);
    const { palette, night, arc } = this.state;
    const key = `${palette.top}${palette.mid}${palette.horizon}`;
    if (key !== this.skyKey.value) {
      SkyTexture.paint(this.sky, palette);
      this.skyKey.value = key;
    }
    this.fog.color.setHex(this.state.fog);
    this.sun.color.setHex(this.state.light);
    this.sun.intensity = this.state.lightIntensity;
    const reach = this.radius + 8;
    this.sun.position.set(-Math.cos(arc) * reach, Math.max(Math.sin(arc), 0.22) * reach, reach * 0.6);
    this.ambient.intensity = this.state.ambientIntensity;
    this.hemisphere.color.setHex(this.state.hemiSky);
    this.hemisphere.groundColor.setHex(this.state.hemiGround);
    this.nightSky.update(this.state, t);
    this.lamps.forEach((lamp) => {
      lamp.emissiveIntensity = 0.35 + night * 1.9;
    });
    if (Math.abs(hour - this.lastHour) > 0.004) {
      this.lastHour = hour;
      this.callbacks.onHour(hour);
    }
  }

  private animateHouses(t: number): void {
    const night = this.state.night;
    this.houses.forEach((house) => {
      const target = house.id === (this.selectedId ?? this.hoverId) ? 1 : 0;
      const current = this.levels.get(house.id) ?? 0;
      const level = this.options.reducedMotion ? target : current + (target - current) * 0.18;
      this.levels.set(house.id, level);
      house.group.position.y = house.baseY + level * LIFT;
      house.group.scale.setScalar(1 + level * GROW);
      const resting = house.count > 0 ? 0.12 + night * 1.5 : 0.02;
      house.glass.emissiveIntensity = resting + level * GLOW;
      const walkAngle = this.walker?.doorAngle(house.id) ?? null;
      if (walkAngle !== null) house.door.rotation.y = walkAngle;
      else if (this.flight?.id !== house.id) house.door.rotation.y = 0;
      house.bear.update(t, level, !this.options.reducedMotion);
      house.stars.forEach((star) => {
        const { angle, radius, height, phase } = star.userData as { angle: number; radius: number; height: number; phase: number };
        const turn = angle + t * 0.6;
        star.position.set(Math.cos(turn) * radius, height + Math.sin(t * 2 + phase) * 0.08, Math.sin(turn) * radius);
        star.rotation.y = t * 1.6 + phase;
      });
      house.smoke.forEach((puff) => {
        const p = this.options.reducedMotion ? puff.phase % 1 : (t * puff.speed + puff.phase) % 1;
        const [ox, oy, oz] = puff.origin;
        puff.mesh.position.set(ox + Math.sin(p * 5 + puff.phase * 6) * 0.09, oy + p * 1.05, oz);
        puff.mesh.scale.setScalar(0.07 + p * 0.2);
        puff.material.opacity = Math.sin(p * Math.PI) * 0.5;
      });
    });
  }

  private addLights(): void {
    const reach = this.radius + 8;
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -reach;
    this.sun.shadow.camera.right = reach;
    this.sun.shadow.camera.top = reach;
    this.sun.shadow.camera.bottom = -reach;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = reach * 4;
    this.sun.shadow.bias = -0.0006;
    this.scene.add(this.ambient, this.hemisphere, this.sun);
  }
}
