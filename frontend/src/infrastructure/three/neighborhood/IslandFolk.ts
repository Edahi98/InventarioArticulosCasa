import {
  CatmullRomCurve3,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  TubeGeometry,
  Vector3,
  type CanvasTexture,
} from "three";
import type { BearTone } from "../../../core/domain/inventoryBear.js";
import { BearBuilder } from "../BearBuilder.js";
import { TextureCanvas } from "../TextureCanvas.js";
import { Solid } from "../walk/Solid.js";
import type { BearBudget } from "./BearBudget.js";
import { CraftMaterials } from "./CraftMaterials.js";
import { FarmAnimals, type FarmKind } from "./FarmAnimals.js";
import type { ParticleSystem } from "./ParticleSystem.js";
import { TravelerBear } from "./TravelerBear.js";
import { VehicleDriver } from "./VehicleDriver.js";

export type FolkRole = "paseo" | "charla" | "jardinero" | "pelota" | "cometa" | "tendedero" | "granja";

interface Spot {
  x: number;
  z: number;
}

const TONES: BearTone[] = ["rose", "sky", "sun", "lilac"];

export class IslandFolk {
  readonly group = new Group();
  private readonly strollers: { bear: TravelerBear; from: Vector3; to: Vector3; speed: number; phase: number }[] = [];
  private readonly bubbles: { sprite: Sprite; phase: number }[] = [];
  private readonly bobbers: { object: Group; phase: number; amount: number }[] = [];
  private readonly balls: { ball: Mesh; phase: number }[] = [];
  private readonly kites: { kite: Group; anchor: Vector3; phase: number }[] = [];
  private readonly cloths: { cloth: Mesh; phase: number }[] = [];
  private readonly heads: { head: Group; phase: number }[] = [];
  private readonly bears = new BearBuilder();

  /**
   * Habitantes de una isla repartidos en lugares libres según su tema: ositos que pasean, parejas que charlan con
   * globos de corazones y estrellas, jardineros que riegan (con chorrito de agua), niños con pelota que bota, una
   * cometa en el cielo, ropa tendida que se mece con el viento y animales de granja pastando. Respeta el tope de
   * ositos.
   *
   * @param spots - Lugares libres de la isla (en el mundo).
   * @param roles - Qué poner en cada lugar, en orden.
   * @param budget - Tope de ositos animados de los habitantes.
   * @param particles - Partículas, para el agua del jardinero.
   * @param seed - Número para variar a los ositos.
   */
  constructor(spots: Spot[], roles: FolkRole[], budget: BearBudget, particles: ParticleSystem, seed: number) {
    roles.forEach((role, index) => {
      const spot = spots[index];
      if (!spot) return;
      const next = spots[(index + 1) % spots.length] ?? spot;
      const at = new Vector3(spot.x, 0.06, spot.z);
      const tone = TONES[(seed + index) % TONES.length] as BearTone;
      const makers: Record<FolkRole, () => void> = {
        paseo: () => {
          if (!budget.take()) return;
          const bear = new TravelerBear(this.bears, seed + index, "camina", 0.24);
          const to = at.clone().lerp(new Vector3(next.x, 0.06, next.z), 0.45);
          this.group.add(bear.group);
          this.strollers.push({ bear, from: at, to, speed: 0.12, phase: index });
        },
        charla: () => {
          [-1, 1].forEach((side, item) => {
            if (!budget.take()) return;
            const bear = VehicleDriver.standing(TONES[(seed + index + item) % TONES.length] as BearTone, "ninguno", 0.11);
            bear.group.position.set(at.x + side * 0.3, 0.06, at.z);
            bear.group.rotation.y = -side * Math.PI / 2;
            this.group.add(bear.group);
            this.heads.push({ head: bear.head, phase: item * Math.PI });
            const sprite = new Sprite(new SpriteMaterial({ map: IslandFolk.bubble(item === 0 ? "corazon" : "estrella"), transparent: true, depthWrite: false }));
            sprite.scale.setScalar(0.32);
            sprite.position.set(at.x + side * 0.3, 0.6, at.z);
            this.group.add(sprite);
            this.bubbles.push({ sprite, phase: item * Math.PI });
          });
        },
        jardinero: () => {
          if (!budget.take()) return;
          const bear = VehicleDriver.standing(tone, "gorra", 0.11);
          const can = new Mesh(new CylinderGeometry(0.35, 0.4, 0.6, 12), CraftMaterials.paint(0x59c9b6));
          can.position.set(0.8, 0.1, 0.5);
          bear.group.children[0]?.add(can);
          bear.group.position.copy(at);
          this.group.add(bear.group, this.flowerBed(at));
          this.bobbers.push({ object: bear.group, phase: index, amount: 0.02 });
          const spout = at.clone().add(new Vector3(0.18, 0.18, 0.12));
          particles.addStream({ kind: "agua", rate: 6, spread: 0.02, at: () => spout });
        },
        pelota: () => {
          if (!budget.take()) return;
          const kid = VehicleDriver.standing(tone, "ninguno", 0.08);
          kid.group.position.copy(at);
          const ball = new Mesh(new SphereGeometry(0.07, 12, 10), CraftMaterials.paint(0xff6f91));
          ball.position.set(at.x + 0.3, 0.13, at.z);
          this.group.add(kid.group, ball);
          this.balls.push({ ball, phase: index });
          this.bobbers.push({ object: kid.group, phase: index, amount: 0.05 });
        },
        cometa: () => {
          if (!budget.take()) return;
          const kid = VehicleDriver.standing(tone, "gorra", 0.08);
          kid.group.position.copy(at);
          const kite = this.kite(index);
          this.group.add(kid.group, kite);
          this.kites.push({ kite, anchor: at.clone().add(new Vector3(0, 0.25, 0)), phase: index });
        },
        tendedero: () => this.clothesline(at, index),
        granja: () => {
          const kinds: FarmKind[] = ["oveja", "vaca", "oveja"];
          kinds.forEach((kind, item) => {
            const animal = FarmAnimals.build(kind);
            animal.group.position.set(at.x + (item - 1) * 0.6, 0.06, at.z + (item % 2) * 0.4);
            animal.group.rotation.y = item * 2.1;
            animal.group.scale.setScalar(kind === "vaca" ? 0.9 : 0.75);
            this.group.add(animal.group);
            this.heads.push({ head: animal.head, phase: item * 1.7 });
          });
        },
      };
      makers[role]();
    });
    this.update(0, 0, false);
  }

  /**
   * Hace pasear, charlar, regar, botar la pelota, volar la cometa, mecerse la ropa y cabecear a los animales.
   *
   * @param elapsed - Segundos transcurridos.
   * @param _night - Qué tan de noche es (no cambia nada).
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, _night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.strollers.forEach((stroller) => {
      const wave = t * stroller.speed + stroller.phase;
      const u = 0.5 - 0.5 * Math.cos(wave);
      stroller.bear.group.position.lerpVectors(stroller.from, stroller.to, u);
      const ahead = Math.sin(wave) >= 0 ? stroller.to : stroller.from;
      stroller.bear.group.rotation.y = Math.atan2(ahead.x - stroller.bear.group.position.x, ahead.z - stroller.bear.group.position.z);
      stroller.bear.update(elapsed, moving);
    });
    this.bubbles.forEach((bubble) => {
      const talk = Math.sin(t * 0.9 + bubble.phase);
      bubble.sprite.visible = !moving || talk > 0;
      bubble.sprite.position.y = 0.6 + Math.abs(talk) * 0.08;
    });
    this.heads.forEach((entry) => {
      entry.head.rotation.x = Math.sin(t * 1.4 + entry.phase) * 0.15;
    });
    this.bobbers.forEach((bobber) => {
      bobber.object.position.y = 0.06 + Math.abs(Math.sin(t * 3 + bobber.phase)) * bobber.amount;
    });
    this.balls.forEach((entry) => {
      entry.ball.position.y = 0.13 + Math.abs(Math.sin(t * 3 + entry.phase)) * 0.35;
    });
    this.kites.forEach((entry) => {
      entry.kite.position.set(entry.anchor.x + 1.5 + Math.sin(t * 0.6 + entry.phase) * 0.4, 4 + Math.sin(t * 0.9 + entry.phase) * 0.3, entry.anchor.z + Math.cos(t * 0.5 + entry.phase) * 0.4);
      entry.kite.rotation.z = Math.sin(t * 1.3 + entry.phase) * 0.2;
    });
    this.cloths.forEach((entry) => {
      entry.cloth.rotation.x = Math.sin(t * 2.2 + entry.phase) * 0.35;
    });
  }

  private static bubble(kind: "corazon" | "estrella"): CanvasTexture {
    return TextureCanvas.build(`globo-${kind}`, 64, 64, false, (context, _rng, width, height) => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#fffaf2";
      context.strokeStyle = "#5a3d57";
      context.lineWidth = 3;
      context.beginPath();
      context.ellipse(width / 2, height * 0.42, 26, 20, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(width * 0.38, height * 0.68);
      context.lineTo(width * 0.32, height * 0.88);
      context.lineTo(width * 0.52, height * 0.7);
      context.fill();
      context.fillStyle = kind === "corazon" ? "#ff6f91" : "#ffc94d";
      context.beginPath();
      if (kind === "corazon") {
        context.moveTo(32, 36);
        context.bezierCurveTo(14, 24, 22, 12, 32, 20);
        context.bezierCurveTo(42, 12, 50, 24, 32, 36);
      }
      if (kind === "estrella") {
        for (let point = 0; point < 10; point += 1) {
          const radius = point % 2 === 0 ? 12 : 5;
          const angle = (point / 10) * Math.PI * 2 - Math.PI / 2;
          context.lineTo(32 + Math.cos(angle) * radius, 27 + Math.sin(angle) * radius);
        }
      }
      context.fill();
    });
  }

  private flowerBed(at: Vector3): Group {
    const bed = new Group();
    const soil = new Mesh(new CylinderGeometry(0.35, 0.38, 0.08, 16), CraftMaterials.wood(0x8a5a42));
    soil.position.set(at.x + 0.35, 0.08, at.z + 0.3);
    bed.add(soil);
    [0xff6f91, 0xffd84d, 0xb98cf0, 0xff9a3b].forEach((color, index) => {
      const bloom = new Mesh(new SphereGeometry(0.07, 10, 8), CraftMaterials.paint(color));
      bloom.position.set(at.x + 0.2 + (index % 2) * 0.3, 0.2, at.z + 0.18 + Math.floor(index / 2) * 0.25);
      bed.add(bloom);
    });
    return bed;
  }

  private kite(index: number): Group {
    const kite = new Group();
    const diamond = new Shape();
    diamond.moveTo(0, 0.35);
    diamond.lineTo(0.22, 0);
    diamond.lineTo(0, -0.4);
    diamond.lineTo(-0.22, 0);
    diamond.closePath();
    const sail = new Mesh(new ShapeGeometry(diamond), new MeshStandardMaterial({ color: index % 2 === 0 ? 0xff6f91 : 0x7fd0ea, side: DoubleSide, roughness: 0.6 }));
    const tail = new Mesh(new TubeGeometry(new CatmullRomCurve3([new Vector3(0, -0.4, 0), new Vector3(0.1, -0.7, 0), new Vector3(-0.05, -1.0, 0), new Vector3(0.08, -1.3, 0)]), 12, 0.012, 4), CraftMaterials.paint(0xffd84d));
    kite.add(sail, tail);
    return kite;
  }

  private clothesline(at: Vector3, index: number): void {
    const line = new Group();
    [-0.7, 0.7].forEach((x) => {
      const post = new Mesh(new CylinderGeometry(0.03, 0.035, 0.9, 6), CraftMaterials.wood(0x8a5a42));
      post.position.set(at.x + x, 0.45, at.z);
      Solid.mark(post, { shape: "cylinder", radius: 0.04, height: 0.9, offset: [0, 0, 0] });
      line.add(post);
    });
    const rope = new Mesh(new CylinderGeometry(0.006, 0.006, 1.4, 4), CraftMaterials.rope());
    rope.rotation.z = Math.PI / 2;
    rope.position.set(at.x, 0.86, at.z);
    line.add(rope);
    [0xff9fc8, 0x7fd0ea, 0xffd84d, 0xfffaf2].forEach((color, item) => {
      const cloth = new Mesh(new PlaneGeometry(0.22, 0.28).translate(0, -0.14, 0), new MeshStandardMaterial({ color, side: DoubleSide, roughness: 0.8 }));
      cloth.position.set(at.x - 0.48 + item * 0.32, 0.86, at.z);
      line.add(cloth);
      this.cloths.push({ cloth, phase: index + item * 0.7 });
    });
    this.group.add(line);
  }
}
