import { Color, ConeGeometry, DoubleSide, CylinderGeometry, Group, InstancedMesh, Mesh, MeshStandardMaterial, Object3D, SphereGeometry, Vector3 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { MARKET_FRUIT } from "../../../constantes/barrio_constantes.js";
import type { BearTone } from "../../../core/domain/inventoryBear.js";
import { BearBuilder } from "../BearBuilder.js";
import { MeshMerger } from "../MeshMerger.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { Solid } from "../walk/Solid.js";
import type { BearBudget } from "./BearBudget.js";
import { CivicParts } from "./CivicParts.js";
import { CraftMaterials } from "./CraftMaterials.js";
import type { ParticleSystem } from "./ParticleSystem.js";
import { TravelerBear } from "./TravelerBear.js";
import { VehicleDriver } from "./VehicleDriver.js";

interface Dancer {
  group: Group;
  radius: number;
  speed: number;
  phase: number;
  bounce: number;
}

const TONES: BearTone[] = ["rose", "sky", "sun", "lilac"];

export class MarketPlaza {
  readonly group = new Group();
  private readonly walkers: { bear: TravelerBear; phase: number }[] = [];
  private readonly dancers: Dancer[] = [];
  private readonly musician: Group | null;
  private readonly bears = new BearBuilder();

  /**
   * Plaza comercial de cuento en un lote, de frente hacia +z: piso de adoquín, fuente de dos tazas con chorro, bancas
   * con un osito sentado, quiosco de helados con sombrilla de rayas y conos, quiosco de flores con cubetas, un puesto de
   * mercado con sombrillas y cajas de fruta, compradores con bolsas que pasean alrededor de la fuente, un músico con su
   * tambor y ositos bailando. Fuente, bancas y quioscos son sólidos.
   *
   * @param seed - Número para variar a los ositos.
   * @param budget - Tope de ositos animados de las plazas.
   * @param particles - Partículas, para el agua de la fuente.
   * @param origin - Dónde queda la plaza en el mundo (para el chorro de agua).
   */
  constructor(seed: number, budget: BearBudget, particles: ParticleSystem, origin: () => Vector3) {
    const floor = new Mesh(new CylinderGeometry(1.8, 1.82, 0.05, 40), new MeshStandardMaterial({ color: 0xf3e3d0, map: SurfaceTextures.cobble(), bumpMap: SurfaceTextures.cobble(), bumpScale: 0.6, roughness: 0.9 }));
    floor.position.y = 0.035;
    floor.receiveShadow = true;
    this.group.add(floor, this.fountain(), ...this.benches(seed), this.iceCream(), this.flowers(), this.stall());
    particles.addStream({ kind: "agua", rate: 10, spread: 0.05, at: () => origin().add(new Vector3(0, 0.95, 0)) });
    for (let index = 0; index < 2; index += 1) {
      if (!budget.take()) break;
      const bear = new TravelerBear(this.bears, seed + index * 5, "camina", 0.2);
      const bag = new Mesh(new RoundedBoxGeometry(0.12, 0.14, 0.06, 2, 0.02), CraftMaterials.paint(index % 2 === 0 ? 0xff6f91 : 0x7fd0ea));
      bag.position.set(0.16, 0.14, 0.04);
      bear.group.add(bag);
      this.group.add(bear.group);
      this.walkers.push({ bear, phase: index * Math.PI });
    }
    this.musician = budget.take() ? this.drummer(seed) : null;
    for (let index = 0; index < 2; index += 1) {
      if (!budget.take()) break;
      const dancer = VehicleDriver.standing(TONES[(seed + index + 2) % TONES.length] as BearTone, "ninguno", 0.09);
      this.group.add(dancer.group);
      this.dancers.push({ group: dancer.group, radius: 0.25, speed: 1.6, phase: index * Math.PI, bounce: 0 });
    }
    this.update(0, 0, false);
  }

  /**
   * Hace pasear a los compradores, bailar a los ositos y tocar al músico.
   *
   * @param elapsed - Segundos transcurridos.
   * @param _night - Qué tan de noche es (no cambia nada).
   * @param moving - Si es `false` quedan quietos (movimiento reducido).
   */
  update(elapsed: number, _night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.walkers.forEach((walker) => {
      const angle = walker.phase + t * 0.25;
      walker.bear.group.position.set(Math.cos(angle) * 1.0, 0.06, Math.sin(angle) * 1.0);
      walker.bear.group.rotation.y = -angle;
      walker.bear.update(elapsed, moving);
    });
    this.dancers.forEach((dancer) => {
      const angle = dancer.phase + t * dancer.speed;
      dancer.group.position.set(-0.9 + Math.cos(angle) * dancer.radius, 0.06 + Math.abs(Math.sin(t * 6 + dancer.phase)) * 0.06, 1.2 + Math.sin(angle) * dancer.radius);
      dancer.group.rotation.y = t * 2 + dancer.phase;
    });
    if (this.musician) {
      this.musician.position.y = 0.06 + Math.abs(Math.sin(t * 4)) * 0.03;
      this.musician.rotation.z = Math.sin(t * 2) * 0.05;
    }
  }

  private fountain(): Group {
    const fountain = new Group();
    const stone = new MeshStandardMaterial({ color: 0xe6dcf0, map: SurfaceTextures.rock(), bumpMap: SurfaceTextures.rock(), bumpScale: 0.8, roughness: 0.85 });
    const water = new MeshStandardMaterial({ color: 0x8fd3f0, roughness: 0.15, transparent: true, opacity: 0.85 });
    const basin = new Mesh(new CylinderGeometry(0.6, 0.65, 0.28, 28, 1, true), stone);
    basin.position.y = 0.17;
    const rim = new Mesh(new CylinderGeometry(0.66, 0.66, 0.05, 28), stone);
    rim.position.y = 0.3;
    rim.scale.set(1, 1, 1);
    const pool = new Mesh(new CylinderGeometry(0.58, 0.58, 0.04, 28), water);
    pool.position.y = 0.25;
    const column = new Mesh(new CylinderGeometry(0.07, 0.11, 0.55, 12), stone);
    column.position.y = 0.5;
    const bowl = new Mesh(new SphereGeometry(0.28, 18, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), stone);
    bowl.position.y = 0.8;
    const top = new Mesh(new CylinderGeometry(0.26, 0.26, 0.03, 20), water);
    top.position.y = 0.79;
    const spout = new Mesh(new SphereGeometry(0.06, 10, 8), water);
    spout.position.y = 0.9;
    fountain.add(basin, rim, pool, column, bowl, top, spout);
    Solid.mark(fountain, { shape: "cylinder", radius: 0.66, height: 0.5, offset: [0, 0.25, 0] });
    return MeshMerger.merge(fountain);
  }

  private benches(seed: number): Group[] {
    return [-1, 1].map((side) => {
      const bench = new Group();
      const wood = CraftMaterials.wood(0xc4805a);
      const seat = new Mesh(new RoundedBoxGeometry(0.6, 0.05, 0.2, 2, 0.02), wood);
      seat.position.y = 0.22;
      const back = new Mesh(new RoundedBoxGeometry(0.6, 0.18, 0.04, 2, 0.015), wood);
      back.position.set(0, 0.36, -0.09);
      bench.add(seat, back);
      [-0.25, 0.25].forEach((x) => {
        const leg = new Mesh(new RoundedBoxGeometry(0.05, 0.2, 0.18, 1, 0.01), CraftMaterials.paint(0x3a2a40));
        leg.position.set(x, 0.1, 0);
        bench.add(leg);
      });
      if (side < 0) {
        const sitter = VehicleDriver.bear(TONES[seed % TONES.length] as BearTone, "ninguno", 0.11);
        sitter.group.position.set(0.1, 0.33, 0.02);
        sitter.group.rotation.y = -Math.PI / 2;
        bench.add(sitter.group);
      }
      bench.position.set(side * 1.2, 0.06, 0.55);
      bench.rotation.y = side * -1.1;
      Solid.mark(bench, { shape: "box", size: [0.62, 0.45, 0.24], offset: [0, 0.22, 0] });
      return bench;
    });
  }

  private umbrella(colors: readonly string[], height: number): Group {
    const umbrella = new Group();
    const pole = new Mesh(new CylinderGeometry(0.015, 0.015, height, 6), CraftMaterials.paint(0xfffaf2));
    pole.position.y = height / 2;
    const top = new Mesh(new ConeGeometry(0.42, 0.22, 16, 1, true), new MeshStandardMaterial({ map: CivicParts.awning(colors), roughness: 0.7, side: DoubleSide }));
    top.position.y = height + 0.05;
    umbrella.add(pole, top);
    return umbrella;
  }

  private iceCream(): Group {
    const kiosk = new Group();
    const cart = new Mesh(new RoundedBoxGeometry(0.5, 0.36, 0.32, 3, 0.08), CraftMaterials.paint(0xffc8d6));
    cart.position.y = 0.3;
    kiosk.add(cart, this.umbrella(["#ff8fb7", "#fffaf2"], 0.9));
    [-0.12, 0, 0.12].forEach((x, index) => {
      const cone = new Mesh(new ConeGeometry(0.035, 0.12, 8), CraftMaterials.paint(0xf0b060));
      cone.rotation.x = Math.PI;
      cone.position.set(x, 0.55, 0.05);
      const scoop = new Mesh(new SphereGeometry(0.045, 10, 8), CraftMaterials.paint([0xff9fc8, 0xfffaf2, 0x9a6040][index] as number));
      scoop.position.set(x, 0.63, 0.05);
      kiosk.add(cone, scoop);
    });
    [-1, 1].forEach((side) => {
      const wheel = new Mesh(new CylinderGeometry(0.08, 0.08, 0.04, 14), CraftMaterials.paint(0x3a2a40));
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(-0.15, 0.08, side * 0.17);
      kiosk.add(wheel);
    });
    kiosk.position.set(-1.15, 0.06, -0.85);
    kiosk.rotation.y = 0.6;
    Solid.mark(kiosk, { shape: "box", size: [0.55, 0.6, 0.36], offset: [0, 0.3, 0] });
    return MeshMerger.merge(kiosk);
  }

  private flowers(): Group {
    const kiosk = new Group();
    const stand = new Mesh(new RoundedBoxGeometry(0.55, 0.3, 0.3, 2, 0.05), CraftMaterials.wood(0x9be08a));
    stand.position.y = 0.2;
    kiosk.add(stand, this.umbrella(["#9be08a", "#fffaf2"], 0.9));
    [0xff6f91, 0xffd84d, 0xb98cf0, 0xff9fc8].forEach((color, index) => {
      const bucket = new Mesh(new CylinderGeometry(0.06, 0.05, 0.1, 10), CraftMaterials.paint(0x7fd0ea));
      bucket.position.set(-0.18 + index * 0.12, 0.4, 0);
      const bloom = new Mesh(new SphereGeometry(0.07, 10, 8), CraftMaterials.paint(color));
      bloom.position.set(-0.18 + index * 0.12, 0.5, 0);
      kiosk.add(bucket, bloom);
    });
    kiosk.position.set(1.15, 0.06, -0.85);
    kiosk.rotation.y = -0.6;
    Solid.mark(kiosk, { shape: "box", size: [0.58, 0.6, 0.34], offset: [0, 0.3, 0] });
    return MeshMerger.merge(kiosk);
  }

  private stall(): Group {
    const stall = new Group();
    const table = new Mesh(new RoundedBoxGeometry(1.1, 0.06, 0.4, 2, 0.02), CraftMaterials.wood(0xc4805a));
    table.position.y = 0.36;
    stall.add(table);
    [-0.5, 0.5].forEach((x) => {
      const leg = new Mesh(new CylinderGeometry(0.025, 0.025, 0.36, 6), CraftMaterials.wood(0x8a5a42));
      leg.position.set(x, 0.18, 0);
      stall.add(leg);
    });
    [-0.3, 0.3].forEach((x, index) => {
      const umbrella = this.umbrella(index === 0 ? ["#ffd84d", "#ff8a3d"] : ["#7fd0ea", "#fffaf2"], 0.85);
      umbrella.position.x = x;
      stall.add(umbrella);
    });
    const crates = 3;
    const fruit = new InstancedMesh(new SphereGeometry(0.035, 8, 6), CraftMaterials.paint(0xffffff), crates * 9);
    const holder = new Object3D();
    for (let crate = 0; crate < crates; crate += 1) {
      const box = new Mesh(new RoundedBoxGeometry(0.28, 0.08, 0.22, 1, 0.01), CraftMaterials.wood(0xb98060));
      box.position.set(-0.36 + crate * 0.36, 0.43, 0);
      stall.add(box);
      for (let item = 0; item < 9; item += 1) {
        holder.position.set(-0.36 + crate * 0.36 - 0.08 + (item % 3) * 0.08, 0.49, -0.06 + Math.floor(item / 3) * 0.06);
        holder.updateMatrix();
        fruit.setMatrixAt(crate * 9 + item, holder.matrix);
        fruit.setColorAt(crate * 9 + item, new Color(MARKET_FRUIT[crate % MARKET_FRUIT.length] as number));
      }
    }
    fruit.instanceMatrix.needsUpdate = true;
    if (fruit.instanceColor) fruit.instanceColor.needsUpdate = true;
    stall.add(fruit);
    stall.position.set(0, 0.06, -1.35);
    Solid.mark(stall, { shape: "box", size: [1.15, 0.6, 0.42], offset: [0, 0.3, 0] });
    return MeshMerger.merge(stall);
  }

  private drummer(seed: number): Group {
    const musician = VehicleDriver.standing(TONES[(seed + 1) % TONES.length] as BearTone, "gorra", 0.1);
    const drum = new Mesh(new CylinderGeometry(0.5, 0.5, 0.55, 14), CraftMaterials.paint(0xff4f5b));
    drum.rotation.x = Math.PI / 2;
    drum.position.set(0, 0.1, 0.95);
    musician.group.add(drum);
    musician.group.position.set(0.9, 0.06, 1.2);
    musician.group.rotation.y = 0;
    this.group.add(musician.group);
    return musician.group;
  }
}
