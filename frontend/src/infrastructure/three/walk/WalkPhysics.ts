import { Object3D, Quaternion, Vector3, type Group } from "three";
import { Solid } from "./Solid.js";
import type { WalkGap, WalkZone } from "./WalkArea.js";

type Rapier = typeof import("@dimforge/rapier3d-compat").default;

export interface PlayerState {
  x: number;
  y: number;
  z: number;
  grounded: boolean;
}

const RADIUS = 0.1;
const HALF_HEIGHT = 0.14;
const GRAVITY = 7;
const WALL_SEGMENTS = 40;
const CAR = { halfLength: 0.68, halfHeight: 0.24, halfWidth: 0.36, lift: 0.3 };

export class WalkPhysics {
  private world!: InstanceType<Rapier["World"]>;
  private body!: InstanceType<Rapier["RigidBody"]>;
  private collider!: InstanceType<Rapier["Collider"]>;
  private controller!: InstanceType<Rapier["KinematicCharacterController"]>;
  private rapier!: Rapier;
  private velocityY = 0;
  private grounded = false;
  private solids = 0;
  private driving = false;

  /**
   * Física del paseo en primera persona con Rapier: un suelo con la forma de la isla, un muro invisible en su
   * orilla, un colisionador por cada objeto marcado como sólido y un jugador capsular que se mueve con el
   * controlador de personaje (se desliza por las paredes, sube escalones bajitos y se pega al piso).
   */
  private constructor() {}

  /**
   * Carga el motor (WebAssembly) y arma el mundo físico a partir de los objetos sólidos de la escena.
   *
   * @param scene - Grupo del mundo; todo lo que tenga una forma sólida marcada se vuelve colisionable.
   * @param zones - Islas caminables (círculos); cada una tiene suelo y un muro en su orilla.
   * @param gaps - Aberturas del muro por donde se pasa a los puentes.
   * @param spawn - Dónde aparece el jugador, con los pies sobre el piso.
   * @returns La física lista para usarse.
   */
  static async create(scene: Group, zones: WalkZone[], gaps: WalkGap[], spawn: Vector3): Promise<WalkPhysics> {
    const physics = new WalkPhysics();
    const module = await import("@dimforge/rapier3d-compat");
    physics.rapier = module.default;
    await physics.rapier.init();
    physics.world = new physics.rapier.World({ x: 0, y: -GRAVITY, z: 0 });
    zones.forEach((zone) => physics.buildGround(zone, gaps));
    physics.buildSolids(scene);
    physics.buildPlayer(spawn);
    physics.world.step();
    return physics;
  }

  /**
   * @returns Cuántos objetos de la escena se volvieron colisionadores.
   */
  get solidCount(): number {
    return this.solids;
  }

  /**
   * Mueve al jugador un paso: aplica la gravedad, resuelve las colisiones y avanza el motor.
   *
   * @param wish - Desplazamiento horizontal deseado en unidades por segundo (plano XZ).
   * @param jump - Si se pidió saltar y hay piso debajo.
   * @param dt - Segundos del cuadro.
   * @returns La posición de los pies del jugador y si está en el piso.
   */
  step(wish: Vector3, jump: boolean, dt: number): PlayerState {
    if (this.grounded && jump) this.velocityY = 2.6;
    this.velocityY = this.grounded && this.velocityY <= 0 ? -0.5 : this.velocityY - GRAVITY * dt;
    const desired = { x: wish.x * dt, y: this.velocityY * dt, z: wish.z * dt };
    this.controller.computeColliderMovement(this.collider, desired);
    this.grounded = this.controller.computedGrounded();
    const move = this.controller.computedMovement();
    const position = this.body.translation();
    this.body.setNextKinematicTranslation({ x: position.x + move.x, y: position.y + move.y, z: position.z + move.z });
    this.world.step();
    const next = this.body.translation();
    return { x: next.x, y: next.y - HALF_HEIGHT - RADIUS, z: next.z, grounded: this.grounded };
  }

  /**
   * Coloca al jugador en un punto sin atravesar nada.
   *
   * @param feet - Posición de los pies.
   */
  teleport(feet: Vector3): void {
    this.body.setNextKinematicTranslation({ x: feet.x, y: feet.y + HALF_HEIGHT + RADIUS, z: feet.z });
    this.world.step();
    this.velocityY = 0;
  }

  /**
   * Cambia la cápsula del jugador por la caja de un coche en el mismo punto: a partir de aquí las colisiones se
   * calculan con el tamaño del coche.
   *
   * @param feet - Posición del suelo bajo el coche.
   * @param heading - Giro del coche sobre el eje vertical (el mismo de `rotation.y` del modelo).
   */
  enterVehicle(feet: Vector3, heading: number): void {
    const { ColliderDesc } = this.rapier;
    this.world.removeCollider(this.collider, false);
    this.body.setNextKinematicTranslation({ x: feet.x, y: feet.y + CAR.lift, z: feet.z });
    this.body.setNextKinematicRotation(WalkPhysics.yawOf(heading));
    this.collider = this.world.createCollider(ColliderDesc.cuboid(CAR.halfLength, CAR.halfHeight, CAR.halfWidth), this.body);
    this.driving = true;
    this.velocityY = 0;
    this.world.step();
  }

  /**
   * Devuelve la cápsula del jugador en el punto indicado, de pie.
   *
   * @param feet - Posición de los pies.
   */
  exitVehicle(feet: Vector3): void {
    const { ColliderDesc } = this.rapier;
    this.world.removeCollider(this.collider, false);
    this.body.setNextKinematicRotation({ x: 0, y: 0, z: 0, w: 1 });
    this.body.setNextKinematicTranslation({ x: feet.x, y: feet.y + HALF_HEIGHT + RADIUS, z: feet.z });
    this.collider = this.world.createCollider(ColliderDesc.capsule(HALF_HEIGHT, RADIUS), this.body);
    this.driving = false;
    this.velocityY = 0;
    this.world.step();
  }

  /**
   * Avanza el coche un paso: lo orienta, lo empuja hacia delante y deja que las paredes, árboles y casas lo frenen.
   *
   * @param speed - Velocidad con signo, en unidades por segundo (negativa para ir de reversa).
   * @param heading - Giro del coche sobre el eje vertical.
   * @param dt - Segundos del cuadro.
   * @returns La posición del suelo bajo el coche y la distancia realmente recorrida entre lo pedido (0 a 1).
   */
  driveStep(speed: number, heading: number, dt: number): { x: number; y: number; z: number; progress: number } {
    this.body.setNextKinematicRotation(WalkPhysics.yawOf(heading));
    const dx = Math.cos(heading) * speed * dt;
    const dz = -Math.sin(heading) * speed * dt;
    this.controller.computeColliderMovement(this.collider, { x: dx, y: -0.4 * dt, z: dz });
    const move = this.controller.computedMovement();
    const position = this.body.translation();
    this.body.setNextKinematicTranslation({ x: position.x + move.x, y: position.y + move.y, z: position.z + move.z });
    this.world.step();
    const next = this.body.translation();
    const wanted = Math.hypot(dx, dz);
    return { x: next.x, y: next.y - CAR.lift, z: next.z, progress: wanted < 1e-6 ? 1 : Math.min(Math.hypot(move.x, move.z) / wanted, 1) };
  }

  /**
   * @returns Si el jugador está dentro de un coche.
   */
  get inVehicle(): boolean {
    return this.driving;
  }

  /**
   * Libera el mundo físico.
   */
  dispose(): void {
    this.world.free();
  }

  private static yawOf(angle: number): { x: number; y: number; z: number; w: number } {
    const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), angle);
    return { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w };
  }

  private buildGround(zone: WalkZone, gaps: WalkGap[]): void {
    const { ColliderDesc } = this.rapier;
    this.world.createCollider(ColliderDesc.cylinder(0.5, zone.radius).setTranslation(zone.x, 0.06 - 0.5, zone.z));
    const wall = zone.radius - 0.55;
    const length = (Math.PI * 2 * wall) / WALL_SEGMENTS / 2 + 0.05;
    for (let index = 0; index < WALL_SEGMENTS; index += 1) {
      const angle = (index / WALL_SEGMENTS) * Math.PI * 2;
      const x = zone.x + Math.cos(angle) * (wall + 0.2);
      const z = zone.z + Math.sin(angle) * (wall + 0.2);
      if (gaps.some((gap) => Math.hypot(gap.x - x, gap.z - z) < gap.half + length)) continue;
      const rotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -angle);
      this.world.createCollider(
        ColliderDesc.cuboid(0.2, 2, length)
          .setTranslation(x, 2, z)
          .setRotation({ x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w }),
      );
    }
  }

  private buildSolids(scene: Group): void {
    scene.updateMatrixWorld(true);
    const position = new Vector3();
    const scale = new Vector3();
    const rotation = new Quaternion();
    scene.traverse((object: Object3D) => {
      const solid = Solid.of(object);
      if (!solid) return;
      object.matrixWorld.decompose(position, rotation, scale);
      const offset = new Vector3(...solid.offset).multiply(scale).applyQuaternion(rotation).add(position);
      const { ColliderDesc } = this.rapier;
      const desc =
        solid.shape === "box"
          ? ColliderDesc.cuboid((solid.size[0] * scale.x) / 2, (solid.size[1] * scale.y) / 2, (solid.size[2] * scale.z) / 2)
          : ColliderDesc.cylinder((solid.height * scale.y) / 2, solid.radius * Math.max(scale.x, scale.z));
      this.world.createCollider(desc.setTranslation(offset.x, offset.y, offset.z).setRotation({ x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w }));
      this.solids += 1;
    });
  }

  private buildPlayer(spawn: Vector3): void {
    const { RigidBodyDesc, ColliderDesc } = this.rapier;
    this.body = this.world.createRigidBody(RigidBodyDesc.kinematicPositionBased().setTranslation(spawn.x, spawn.y + HALF_HEIGHT + RADIUS, spawn.z));
    this.collider = this.world.createCollider(ColliderDesc.capsule(HALF_HEIGHT, RADIUS), this.body);
    this.controller = this.world.createCharacterController(0.01);
    this.controller.setUp({ x: 0, y: 1, z: 0 });
    this.controller.enableAutostep(0.1, 0.05, false);
    this.controller.enableSnapToGround(0.08);
    this.controller.setSlideEnabled(true);
  }
}
