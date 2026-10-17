import {
  CatmullRomCurve3,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoadBuilder } from "../neighborhood/RoadBuilder.js";
import type { ClayMaterials } from "./ClayMaterials.js";
import type { Interactive } from "./ParkInteraction.js";

interface Puff {
  mesh: Mesh;
  material: MeshBasicMaterial;
  phase: number;
}

interface Car {
  group: Group;
  offset: number;
}

const WAGONS = [0xb89cf2, 0x7fd0ea, 0xffe35c] as const;
const CRATES = [0xff8fb7, 0x86d6a8, 0xffb066, 0xb89cf2] as const;
const SPACING = 1.9;
const TRACK_Y = 0.12;

export class ToyTrain {
  readonly group = new Group();
  readonly interactives: Interactive[] = [];
  private readonly carriage = new Group();
  private readonly curve: CatmullRomCurve3;
  private readonly length: number;
  private readonly cars: Car[] = [];
  private readonly puffs: Puff[] = [];
  private readonly lamp = new MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffd37a, emissiveIntensity: 0.4 });
  private distance = 0;
  private boost = 0;
  private last = 0;
  private jumpedAt = -10;
  private hovered = false;

  /**
   * Trencito de juguete sobre una vía ovalada: una locomotora rosa con humo y tres vagones que cargan cajas de
   * colores, que da vueltas sin parar. Al tocarlo acelera un momento, echa más humo y las cajas brincan.
   *
   * @param clay - Materiales compartidos.
   * @param width - Medio ancho de la vía.
   * @param depth - Medio fondo de la vía.
   */
  constructor(
    private readonly clay: ClayMaterials,
    width = 9.8,
    depth = 5,
  ) {
    const points = Array.from({ length: 64 }, (_, index) => {
      const theta = (index / 64) * Math.PI * 2;
      return new Vector3(Math.cos(theta) * width, TRACK_Y, Math.sin(theta) * depth);
    });
    this.curve = new CatmullRomCurve3(points, true, "centripetal");
    this.length = this.curve.getLength();
    this.group.add(...this.track(), this.carriage);
    this.carriage.userData.interactiveId = "tren";
    this.addCar(this.engine(), 0);
    WAGONS.forEach((color, index) => this.addCar(this.wagon(color, index), -(index + 1) * SPACING));
    this.interactives.push({
      id: "tren",
      object: this.carriage,
      hit: (now) => {
        this.boost = 3;
        this.jumpedAt = now;
      },
      hover: (on) => {
        this.hovered = on;
      },
    });
  }

  /**
   * Hace avanzar el tren por la vía y echar humo, y enciende el faro de noche.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const dt = Math.min(Math.max(elapsed - this.last, 0), 0.1);
    this.last = elapsed;
    this.boost *= Math.exp(-dt * 0.9);
    if (moving) this.distance += (1.25 + this.boost) * dt;
    const since = elapsed - this.jumpedAt;
    const hop = Math.max(0, 1 - since) * Math.abs(Math.sin(since * 11)) * 0.16;
    this.cars.forEach((car, index) => {
      const { point, tangent } = RoadBuilder.frame(this.curve, (this.distance + car.offset) / this.length);
      car.group.position.set(point.x, point.y + (index > 0 ? hop : 0), point.z);
      car.group.rotation.y = Math.atan2(tangent.x, tangent.z);
    });
    this.lamp.emissiveIntensity = 0.4 + night * 2 + (this.hovered ? 0.8 : 0);
    const t = moving ? elapsed : 0;
    this.puffs.forEach((puff) => {
      const p = (t * 0.5 + puff.phase) % 1;
      puff.mesh.position.set(Math.sin(p * 5 + puff.phase * 6) * 0.08, 0.9 + p * (1.2 + this.boost * 0.25), 0.4);
      puff.mesh.scale.setScalar(0.1 + p * (0.3 + this.boost * 0.05));
      puff.material.opacity = Math.sin(p * Math.PI) * 0.55;
    });
  }

  private track(): Object3D[] {
    const rail = (side: number): Mesh => {
      const points = Array.from({ length: 120 }, (_, index) => {
        const { point, normal } = RoadBuilder.frame(this.curve, index / 120);
        return new Vector3(point.x + normal.x * side * 0.34, TRACK_Y + 0.05, point.z + normal.z * side * 0.34);
      });
      const tube = new Mesh(new TubeGeometry(new CatmullRomCurve3(points, true), 280, 0.05, 6, true), this.clay.get(0xcfc3e6));
      tube.receiveShadow = true;
      return tube;
    };
    const count = Math.floor(this.length / 0.62);
    const sleepers = new InstancedMesh(new RoundedBoxGeometry(0.95, 0.07, 0.17, 2, 0.03), this.clay.get(0xc4805a), count);
    const holder = new Object3D();
    for (let index = 0; index < count; index += 1) {
      const { point, normal } = RoadBuilder.frame(this.curve, index / count);
      holder.position.set(point.x, TRACK_Y + 0.02, point.z);
      holder.rotation.y = Math.atan2(-normal.z, normal.x);
      holder.updateMatrix();
      sleepers.setMatrixAt(index, holder.matrix);
    }
    sleepers.instanceMatrix.needsUpdate = true;
    sleepers.receiveShadow = true;
    return [rail(-1), rail(1), sleepers];
  }

  private addCar(group: Group, offset: number): void {
    group.traverse((part) => {
      part.castShadow = true;
    });
    this.carriage.add(group);
    this.cars.push({ group, offset });
  }

  private wheels(group: Group, z: number[]): void {
    const geometry = new CylinderGeometry(0.2, 0.2, 0.12, 14);
    z.forEach((at) => [-1, 1].forEach((side) => {
      const wheel = new Mesh(geometry, this.clay.get(0x6b4a6a));
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * 0.46, 0.2, at);
      group.add(wheel);
    }));
  }

  private engine(): Group {
    const engine = new Group();
    const boiler = new Mesh(new CylinderGeometry(0.36, 0.36, 1.15, 18), this.clay.get(0xff8fb7));
    boiler.rotation.x = Math.PI / 2;
    boiler.position.set(0, 0.62, 0.3);
    const nose = new Mesh(new SphereGeometry(0.36, 16, 12), this.clay.get(0xff8fb7));
    nose.position.set(0, 0.62, 0.87);
    const cab = new Mesh(new RoundedBoxGeometry(0.85, 0.95, 0.72, 3, 0.14), this.clay.get(0xfff6dc));
    cab.position.set(0, 0.7, -0.48);
    const roof = new Mesh(new RoundedBoxGeometry(0.98, 0.1, 0.86, 2, 0.04), this.clay.get(0xffd37a));
    roof.position.set(0, 1.22, -0.48);
    const chimney = new Mesh(new CylinderGeometry(0.1, 0.13, 0.42, 12), this.clay.get(0x6b4a6a));
    chimney.position.set(0, 1.08, 0.4);
    const lamp = new Mesh(new SphereGeometry(0.1, 12, 10), this.lamp);
    lamp.position.set(0, 0.62, 1.2);
    const chassis = new Mesh(new RoundedBoxGeometry(0.9, 0.18, 1.9, 2, 0.06), this.clay.get(0xb89cf2));
    chassis.position.set(0, 0.28, 0.1);
    engine.add(boiler, nose, cab, roof, chimney, lamp, chassis);
    this.wheels(engine, [-0.5, 0.15, 0.7]);
    for (let index = 0; index < 4; index += 1) {
      const material = new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
      const mesh = new Mesh(new SphereGeometry(1, 10, 8), material);
      engine.add(mesh);
      this.puffs.push({ mesh, material, phase: index / 4 });
    }
    return engine;
  }

  private wagon(color: number, index: number): Group {
    const wagon = new Group();
    const chassis = new Mesh(new RoundedBoxGeometry(0.98, 0.2, 1.4, 2, 0.07), this.clay.get(color));
    chassis.position.y = 0.3;
    wagon.add(chassis);
    this.wheels(wagon, [-0.42, 0.42]);
    const crates = index === 1 ? 1 : 2;
    for (let slot = 0; slot < crates; slot += 1) {
      const crate = new Group();
      const body = new Mesh(new RoundedBoxGeometry(0.58, 0.52, 0.58, 3, 0.1), this.clay.get(CRATES[(index + slot) % CRATES.length] as number));
      const ribbon = new Mesh(new RoundedBoxGeometry(0.62, 0.1, 0.16, 2, 0.04), this.clay.get(0xfffaf2));
      ribbon.position.y = 0.27;
      crate.add(body, ribbon);
      crate.position.set(0, 0.68, crates === 1 ? 0 : slot === 0 ? -0.34 : 0.34);
      wagon.add(crate);
    }
    return wagon;
  }
}
