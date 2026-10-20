import {
  Color,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { PACKAGE_COLORS, RECEIVER_CYCLE, RECEIVER_SLOTS } from "../../../constantes/barrio_constantes.js";
import { BearBuilder } from "../BearBuilder.js";
import { MeshMerger } from "../MeshMerger.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { Solid } from "../walk/Solid.js";
import { CivicParts } from "./CivicParts.js";
import { CraftMaterials } from "./CraftMaterials.js";
import type { ParticleSystem } from "./ParticleSystem.js";
import { TravelerBear } from "./TravelerBear.js";

type Carrier = "paracaidas" | "globo" | "dron";

const CARRIERS: Carrier[] = ["paracaidas", "globo", "dron"];
const DROP_HEIGHT = 11;
const PAD = new Vector3(0.2, 0.18, 0.55);
const IDLE = new Vector3(-0.5, 0.06, -0.35);
const SHED = new Vector3(1.25, 0.06, -0.6);
const COLUMNS = 4;
const ROWS = 3;

export class SkyReceiver {
  readonly group = new Group();
  readonly lamps: MeshStandardMaterial[] = [];
  private readonly bear: TravelerBear;
  private readonly helper: TravelerBear;
  private readonly parcel = new Group();
  private readonly looks: Object3D[] = [];
  private readonly carriers = new Map<Carrier, Group>();
  private readonly rotors: Object3D[] = [];
  private readonly stock: InstancedMesh;
  private readonly bows: InstancedMesh;
  private readonly barrow = new Group();
  private readonly progress: Mesh;
  private readonly dish = new Group();
  private readonly beacon = new MeshStandardMaterial({ color: 0xff4f5b, emissive: 0xff3b3b, emissiveIntensity: 0.6 });
  private readonly spot = new Vector3();
  private readonly fired = new Set<string>();

  /**
   * Estación del oso recibidor, de frente hacia +z: una plataforma redonda con diana donde bajan del cielo paquetes de
   * colores (cajas con moño, cofres, frascos, pelotas de juguete y peluches) colgados de un paracaídas, de un globo o de
   * un dron de juguete; rebotan al tocar el piso entre polvo y destellos, el osito los atrapa, los carga y los acomoda
   * en una estantería de doce huecos que se va llenando, con una barra que cuenta lo acomodado y confeti en cada
   * entrega. Cuando la estantería se llena, un oso ayudante se lleva todo en una carretilla al almacén. Torre de
   * recepción con antena giratoria y baliza para verla desde lejos. Estantería, almacén y torre son sólidos. Todo sale
   * del tiempo transcurrido, así que es determinista.
   *
   * @param seed - Número para variar a los ositos.
   * @param particles - Partículas para el polvo, los destellos y el confeti.
   */
  constructor(
    seed: number,
    private readonly particles: ParticleSystem,
  ) {
    const bears = new BearBuilder();
    this.bear = new TravelerBear(bears, seed, "camina", 0.24);
    this.helper = new TravelerBear(bears, seed + 2, "camina", 0.22);
    this.lamps.push(this.beacon);
    const shelf = this.shelf();
    this.stock = new InstancedMesh(new RoundedBoxGeometry(0.26, 0.24, 0.24, 2, 0.04), new MeshStandardMaterial({ roughness: 0.6, map: SurfaceTextures.clay() }), RECEIVER_SLOTS);
    this.bows = new InstancedMesh(new TorusGeometry(0.06, 0.02, 6, 12), CraftMaterials.paint(0xfffaf2), RECEIVER_SLOTS);
    const holder = new Object3D();
    for (let index = 0; index < RECEIVER_SLOTS; index += 1) {
      holder.position.copy(SkyReceiver.slot(index));
      holder.updateMatrix();
      this.stock.setMatrixAt(index, holder.matrix);
      this.stock.setColorAt(index, new Color(PACKAGE_COLORS[index % PACKAGE_COLORS.length] as number));
      holder.position.y += 0.15;
      holder.updateMatrix();
      this.bows.setMatrixAt(index, holder.matrix);
    }
    this.stock.instanceMatrix.needsUpdate = true;
    this.bows.instanceMatrix.needsUpdate = true;
    if (this.stock.instanceColor) this.stock.instanceColor.needsUpdate = true;
    this.progress = new Mesh(new RoundedBoxGeometry(1.6, 0.08, 0.05, 1, 0.02), new MeshStandardMaterial({ color: 0x9be08a, emissive: 0x4fe08a, emissiveIntensity: 0.6 }));
    this.lamps.push(this.progress.material as MeshStandardMaterial);
    this.progress.position.set(-0.25, 1.75, -1.1);
    this.group.add(this.pad(), shelf, this.stock, this.bows, this.progress, this.shed(), this.tower(), this.bear.group, this.helper.group, this.parcel, this.makeBarrow());
    this.makeParcel();
    this.update(0, 0, false);
  }

  /**
   * Avanza el ciclo de entregas: baja el paquete, rebota, el oso lo lleva a su hueco y, cuando se llena la estantería,
   * el ayudante se lo lleva al almacén.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` queda una escena fija (estantería a medias y paquete en la plataforma).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const t = moving ? elapsed : RECEIVER_CYCLE * 5.6;
    const step = Math.floor(t / RECEIVER_CYCLE);
    const u = (t % RECEIVER_CYCLE) / RECEIVER_CYCLE;
    const round = step % (RECEIVER_SLOTS + 1);
    this.dish.rotation.y = t * 0.8;
    this.rotors.forEach((rotor) => {
      rotor.rotation.y = t * 30;
    });
    this.beacon.emissiveIntensity = (moving ? (Math.sin(t * 4) > 0 ? 1 : 0.2) : 1) * (0.5 + night * 1.5);
    if (round === RECEIVER_SLOTS) {
      this.unload(u, elapsed, moving);
      return;
    }
    this.helper.group.position.copy(SHED).add(new Vector3(-0.35, 0, 0.4));
    this.helper.group.rotation.y = -Math.PI / 2;
    this.helper.update(0, false);
    this.barrow.position.copy(SHED).add(new Vector3(-0.1, 0, 0.75));
    this.barrow.visible = true;
    (this.barrow.children[1] as Object3D).visible = false;
    this.deliver(step, round, u, elapsed, moving);
  }

  private static slot(index: number): Vector3 {
    const column = index % COLUMNS;
    const row = Math.floor(index / COLUMNS);
    return new Vector3(-1.0 + column * 0.5, 0.36 + row * 0.42, -1.25);
  }

  private deliver(step: number, filled: number, u: number, elapsed: number, moving: boolean): void {
    const carrier = CARRIERS[step % CARRIERS.length] as Carrier;
    this.looks.forEach((look, index) => {
      look.visible = index === step % this.looks.length;
    });
    this.carriers.forEach((group, kind) => {
      group.visible = kind === carrier && u < 0.42;
    });
    const fall = Math.min(u / 0.4, 1);
    const target = SkyReceiver.slot(filled);
    const placed = u >= 0.86;
    this.stock.count = filled + (placed ? 1 : 0);
    this.bows.count = this.stock.count;
    this.progress.scale.x = Math.max(this.stock.count / RECEIVER_SLOTS, 0.02);
    this.progress.position.x = -0.25 - 0.8 * (1 - this.progress.scale.x);
    const bearAt = (from: Vector3, to: Vector3, start: number, end: number): void => {
      const k = Math.min(Math.max((u - start) / (end - start), 0), 1);
      this.bear.group.position.lerpVectors(from, to, k);
      if (k > 0 && k < 1) this.bear.group.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
    };
    this.bear.group.position.copy(IDLE);
    this.bear.group.rotation.y = 0.4;
    if (u >= 0.47 && u < 0.55) bearAt(IDLE, PAD, 0.47, 0.55);
    if (u >= 0.55 && u < 0.62) this.bear.group.position.copy(PAD);
    const shelfFront = target.clone().setY(0.06).add(new Vector3(0, 0, 0.45));
    if (u >= 0.62 && u < 0.86) bearAt(PAD.clone().setY(0.06), shelfFront, 0.62, 0.86);
    if (u >= 0.86 && u < 0.9) this.bear.group.position.copy(shelfFront);
    if (u >= 0.9) bearAt(shelfFront, IDLE, 0.9, 1);
    this.bear.update(elapsed, moving && ((u > 0.47 && u < 0.55) || (u > 0.62 && u < 0.86) || u > 0.9));
    this.parcel.visible = !placed;
    if (u < 0.4) this.parcel.position.set(PAD.x, PAD.y + DROP_HEIGHT * (1 - fall * fall * (3 - 2 * fall)), PAD.z);
    if (u >= 0.4 && u < 0.62) this.parcel.position.set(PAD.x, PAD.y + Math.abs(Math.sin(((u - 0.4) / 0.07) * Math.PI)) * 0.25 * Math.max(0, 1 - (u - 0.4) / 0.1), PAD.z);
    if (u >= 0.62 && u < 0.86) this.parcel.position.copy(this.bear.group.position).add(new Vector3(0, 0.55, 0));
    this.parcel.rotation.y = u < 0.4 ? u * 4 : 0;
    this.carriers.forEach((group) => group.position.copy(this.parcel.position));
    if (moving) this.events(u);
  }

  private events(u: number): void {
    const fire = (name: string, at: number, run: () => void): void => {
      if (u < at || this.fired.has(name)) return;
      this.fired.add(name);
      run();
    };
    if (u < 0.05) this.fired.clear();
    this.group.updateMatrixWorld(true);
    fire("aterriza", 0.4, () => {
      this.particles.burst("polvo", this.group.localToWorld(this.spot.copy(PAD)), 12, 0.25);
      this.particles.burst("destello", this.group.localToWorld(this.spot.copy(PAD).add(new Vector3(0, 0.2, 0))), 8, 0.2);
    });
    fire("acomoda", 0.86, () => {
      this.particles.burst("confeti", this.group.localToWorld(this.spot.copy(this.parcel.position).add(new Vector3(0, 0.3, 0))), 18, 0.2);
      this.particles.burst("estrella", this.group.localToWorld(this.spot.copy(this.parcel.position).add(new Vector3(0, 0.4, 0))), 6, 0.2);
    });
  }

  private unload(u: number, elapsed: number, moving: boolean): void {
    this.carriers.forEach((group) => {
      group.visible = false;
    });
    this.parcel.visible = false;
    this.stock.count = u < 0.15 ? RECEIVER_SLOTS : 0;
    this.bows.count = this.stock.count;
    this.progress.scale.x = Math.max(1 - u, 0.02);
    this.bear.group.position.copy(IDLE);
    this.bear.update(0, false);
    const start = new Vector3(-0.2, 0.06, -0.55);
    const k = u < 0.15 ? 0 : Math.min((u - 0.15) / 0.6, 1);
    const going = u < 0.75;
    this.barrow.position.lerpVectors(start, SHED.clone().add(new Vector3(-0.1, 0, 0.75)), going ? k : 1 - Math.min((u - 0.75) / 0.25, 1));
    this.barrow.rotation.y = going ? Math.PI / 2 : -Math.PI / 2;
    (this.barrow.children[1] as Object3D).visible = going && u >= 0.15;
    this.helper.group.position.copy(this.barrow.position).add(new Vector3(going ? -0.4 : 0.4, 0, 0));
    this.helper.group.rotation.y = this.barrow.rotation.y;
    this.helper.update(elapsed, moving);
  }

  private pad(): Group {
    const pad = new Group();
    const disc = new Mesh(new CylinderGeometry(0.75, 0.8, 0.12, 32), CraftMaterials.paint(0xfffaf2));
    disc.position.set(PAD.x, 0.06, PAD.z);
    const ring = new Mesh(new TorusGeometry(0.55, 0.05, 8, 32), CraftMaterials.paint(0xff6f91));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(PAD.x, 0.13, PAD.z);
    const dot = new Mesh(new CylinderGeometry(0.18, 0.18, 0.02, 20), CraftMaterials.paint(0xff6f91));
    dot.position.set(PAD.x, 0.13, PAD.z);
    pad.add(disc, ring, dot);
    return MeshMerger.merge(pad);
  }

  private shelf(): Group {
    const shelf = new Group();
    const wood = CraftMaterials.wood(0xc4805a);
    [-1.27, 0.77].forEach((x) => {
      const side = new Mesh(new RoundedBoxGeometry(0.06, 1.5, 0.4, 1, 0.02), wood);
      side.position.set(x, 0.75, -1.25);
      shelf.add(side);
    });
    for (let row = 0; row <= ROWS; row += 1) {
      const board = new Mesh(new RoundedBoxGeometry(2.1, 0.05, 0.4, 1, 0.02), wood);
      board.position.set(-0.25, 0.22 + row * 0.42, -1.25);
      shelf.add(board);
    }
    const back = new Mesh(new RoundedBoxGeometry(2.1, 1.5, 0.04, 1, 0.01), CraftMaterials.wood(0x9a6b52));
    back.position.set(-0.25, 0.75, -1.45);
    const sign = CivicParts.sign("Lo que llega", 0x5a3d57, 1.2);
    sign.position.set(-0.25, 1.95, -1.25);
    shelf.add(back, sign);
    Solid.mark(shelf, { shape: "box", size: [2.1, 1.5, 0.45], offset: [-0.25, 0.75, -1.25] });
    return MeshMerger.merge(shelf);
  }

  private shed(): Group {
    const shed = new Group();
    const body = new Mesh(new RoundedBoxGeometry(0.9, 0.8, 0.8, 2, 0.06), CraftMaterials.wood(0xe8502d));
    body.position.y = 0.4;
    const roof = new Mesh(new CylinderGeometry(0.0, 0.7, 0.45, 4), CraftMaterials.paint(0xfffaf2));
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 1.02;
    const door = new Mesh(new RoundedBoxGeometry(0.4, 0.55, 0.04, 1, 0.02), CraftMaterials.wood(0xfff1e0));
    door.position.set(0, 0.3, 0.41);
    shed.add(body, roof, door);
    shed.position.copy(SHED);
    Solid.mark(shed, { shape: "box", size: [0.9, 0.8, 0.8], offset: [0, 0.4, 0] });
    return MeshMerger.merge(shed);
  }

  private tower(): Group {
    const tower = new Group();
    const mast = new Mesh(new CylinderGeometry(0.05, 0.08, 3, 8), CraftMaterials.paint(0xfffaf2));
    mast.position.y = 1.5;
    const stripe = new Mesh(new TorusGeometry(0.07, 0.02, 6, 12), CraftMaterials.paint(0xff6f91));
    stripe.rotation.x = Math.PI / 2;
    stripe.position.y = 2.2;
    const bowl = new Mesh(new SphereGeometry(0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), CraftMaterials.paint(0x7fd0ea));
    bowl.rotation.x = Math.PI * 0.75;
    bowl.position.y = 0.05;
    this.dish.add(bowl);
    this.dish.position.y = 3.05;
    const light = new Mesh(new SphereGeometry(0.08, 10, 8), this.beacon);
    light.position.y = 3.4;
    tower.add(mast, stripe, this.dish, light);
    tower.position.set(-1.5, 0.06, 0.4);
    Solid.mark(tower, { shape: "cylinder", radius: 0.1, height: 3, offset: [0, 1.5, 0] });
    return tower;
  }

  private makeBarrow(): Group {
    const tray = new Mesh(new RoundedBoxGeometry(0.5, 0.14, 0.32, 2, 0.04), CraftMaterials.paint(0x7fd0ea));
    tray.position.y = 0.22;
    const load = new Mesh(new RoundedBoxGeometry(0.4, 0.3, 0.26, 2, 0.04), CraftMaterials.paint(0xffd84d));
    load.position.y = 0.42;
    const wheel = new Mesh(new CylinderGeometry(0.1, 0.1, 0.05, 12), CraftMaterials.paint(0x3a2a40));
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(0.3, 0.1, 0);
    this.barrow.add(tray, load, wheel);
    return this.barrow;
  }

  private makeParcel(): void {
    const color = (index: number): MeshStandardMaterial => CraftMaterials.paint(PACKAGE_COLORS[index % PACKAGE_COLORS.length] as number);
    const gift = new Group();
    gift.add(new Mesh(new RoundedBoxGeometry(0.3, 0.26, 0.3, 2, 0.04), color(0)), new Mesh(new TorusGeometry(0.07, 0.025, 6, 12), CraftMaterials.paint(0xfffaf2)));
    (gift.children[1] as Mesh).position.y = 0.16;
    const chest = new Group();
    chest.add(new Mesh(new RoundedBoxGeometry(0.34, 0.2, 0.24, 2, 0.03), CraftMaterials.wood(0x8a4a2a)), new Mesh(new SphereGeometry(0.06, 8, 6), CraftMaterials.paint(0xffc94d)));
    (chest.children[1] as Mesh).position.set(0, 0.04, 0.12);
    const jar = new Group();
    jar.add(new Mesh(new CylinderGeometry(0.12, 0.12, 0.26, 14), new MeshStandardMaterial({ color: 0xd8f3ff, roughness: 0.15, transparent: true, opacity: 0.7 })), new Mesh(new CylinderGeometry(0.13, 0.13, 0.05, 14), color(2)));
    (jar.children[1] as Mesh).position.y = 0.15;
    const ball = new Group();
    ball.add(new Mesh(new SphereGeometry(0.15, 16, 12), color(1)), new Mesh(new TorusGeometry(0.15, 0.025, 6, 20), CraftMaterials.paint(0xfffaf2)));
    const plush = new Group();
    const head = new Mesh(new SphereGeometry(0.13, 14, 10), CraftMaterials.paint(0xc4905a));
    const ears = [-1, 1].map((side) => {
      const ear = new Mesh(new SphereGeometry(0.05, 8, 6), CraftMaterials.paint(0xc4905a));
      ear.position.set(side * 0.1, 0.1, 0);
      return ear;
    });
    plush.add(head, ...ears);
    this.looks.push(gift, chest, jar, ball, plush);
    this.parcel.add(...this.looks);
    const chute = new Group();
    const canopy = new Mesh(new SphereGeometry(0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new MeshStandardMaterial({ map: CivicParts.awning(["#ff8fb7", "#fffaf2"]), roughness: 0.7 }));
    canopy.position.y = 0.9;
    chute.add(canopy);
    [-1, 1].forEach((sx) =>
      [-1, 1].forEach((sz) => {
        const line = new Mesh(new CylinderGeometry(0.006, 0.006, 0.8, 4), CraftMaterials.rope());
        line.position.set(sx * 0.2, 0.55, sz * 0.2);
        line.rotation.set(sz * 0.3, 0, -sx * 0.3);
        chute.add(line);
      }),
    );
    const balloon = new Group();
    const bubble = new Mesh(new SphereGeometry(0.3, 16, 12), CraftMaterials.paint(0xffd84d));
    bubble.scale.y = 1.2;
    bubble.position.y = 0.95;
    const string = new Mesh(new CylinderGeometry(0.006, 0.006, 0.6, 4), CraftMaterials.rope());
    string.position.y = 0.45;
    balloon.add(bubble, string);
    const drone = new Group();
    const body = new Mesh(new RoundedBoxGeometry(0.3, 0.08, 0.3, 2, 0.03), CraftMaterials.paint(0x3a2a40));
    body.position.y = 0.32;
    drone.add(body);
    [-1, 1].forEach((sx) =>
      [-1, 1].forEach((sz) => {
        const rotor = new Mesh(new RoundedBoxGeometry(0.22, 0.01, 0.04, 1, 0.004), CraftMaterials.paint(0x7fd0ea));
        rotor.position.set(sx * 0.2, 0.37, sz * 0.2);
        this.rotors.push(rotor);
        drone.add(rotor);
      }),
    );
    this.carriers.set("paracaidas", chute);
    this.carriers.set("globo", balloon);
    this.carriers.set("dron", drone);
    this.group.add(chute, balloon, drone);
  }
}
