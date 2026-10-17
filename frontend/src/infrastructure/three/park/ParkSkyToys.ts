import {
  CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { SeededRandom } from "../neighborhood/SeededRandom.js";
import { StarGeometry } from "../StarGeometry.js";
import type { ClayMaterials } from "./ClayMaterials.js";
import type { Interactive } from "./ParkInteraction.js";
import { POND } from "./ParkScenery.js";

interface Floater {
  group: Group;
  base: [number, number, number];
  phase: number;
  spin: number;
  hitAt: number;
  poppedAt: number;
}

interface Kite {
  group: Group;
  tail: Mesh[];
  phase: number;
  hitAt: number;
}

interface Duck {
  group: Group;
  radius: number;
  speed: number;
  phase: number;
  hitAt: number;
}

const BLOCKS = [0xff8fb7, 0x7fd0ea, 0xffe35c, 0xb89cf2, 0x86d6a8, 0xffb066] as const;
const STRIPES = ["#ff8fb7", "#fff6dc", "#7fd0ea", "#fff6dc", "#ffe35c", "#fff6dc"] as const;
const RESPAWN = 4;

export class ParkSkyToys {
  readonly group = new Group();
  readonly interactives: Interactive[] = [];
  private readonly blocks: Floater[] = [];
  private readonly stars: Floater[] = [];
  private readonly kites: Kite[] = [];
  private readonly ducks: Duck[] = [];
  private readonly balloon = new Group();
  private readonly starMaterial = new MeshStandardMaterial({ color: 0xffd43b, emissive: 0xffb300, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.2 });
  private readonly rng = new SeededRandom("juguetes");
  private balloonHitAt = -10;

  /**
   * Los juguetes que decoran el cielo y el estanque, todos con su propia animación: bloques de colores que
   * flotan y giran, estrellas doradas, cometas con cola, un globo aerostático rayado y tres patitos nadando.
   * Cada uno reacciona de forma ligera al toque; las estrellas explotan en confeti y reaparecen.
   *
   * @param clay - Materiales compartidos.
   * @param onPop - Aviso con el punto donde explota una estrella, para lanzar confeti.
   */
  constructor(
    private readonly clay: ClayMaterials,
    private readonly onPop: (point: Vector3) => void,
  ) {
    this.group.add(...this.makeBlocks(), ...this.makeStars(), ...this.makeKites(), this.makeBalloon(), ...this.makeDucks());
  }

  /**
   * Mece los bloques, las estrellas, las cometas y el globo, hace nadar a los patitos y aplica las reacciones.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.blocks.forEach((block) => this.floatItem(block, t, elapsed));
    this.stars.forEach((star) => {
      const sinceTouch = elapsed - star.poppedAt;
      star.group.visible = sinceTouch > RESPAWN;
      if (!star.group.visible) return;
      this.floatItem(star, t, elapsed);
      star.group.scale.setScalar(Math.min((sinceTouch - RESPAWN) / 0.6, 1));
    });
    this.starMaterial.emissiveIntensity = 0.55 + night * 0.9 + Math.sin(t * 2) * 0.1;
    this.kites.forEach((kite) => {
      const progress = Math.min((elapsed - kite.hitAt) / 1.1, 1);
      const turn = 1 - Math.pow(1 - progress, 3);
      kite.group.rotation.z = Math.sin(t * 0.8 + kite.phase) * 0.28 + turn * Math.PI * 2;
      kite.tail.forEach((piece, index) => {
        piece.position.x = Math.sin(t * 2 + kite.phase + index * 0.7) * 0.054 * (index + 1);
      });
    });
    const lift = Math.max(0, 1 - (elapsed - this.balloonHitAt) / 2.5);
    this.balloon.position.y = 13 + Math.sin(t * 0.4) * 0.7 + lift * lift * 3.5;
    this.balloon.position.x = 3 + Math.sin(t * 0.15) * 1.8;
    this.balloon.rotation.y = t * 0.1 + lift * 1.5;
    this.ducks.forEach((duck) => {
      const angle = duck.phase + t * duck.speed;
      const hop = Math.max(0, 1 - (elapsed - duck.hitAt) / 0.7);
      duck.group.position.set(POND.x + Math.cos(angle) * duck.radius, 0.1 + Math.sin(t * 2 + duck.phase) * 0.02 + Math.abs(Math.sin(hop * Math.PI * 2)) * hop * 0.5, POND.z + Math.sin(angle) * duck.radius);
      duck.group.rotation.y = -angle + Math.PI;
    });
  }

  private floatItem(item: Floater, t: number, elapsed: number): void {
    const [x, y, z] = item.base;
    const kick = Math.max(0, 1 - (elapsed - item.hitAt) / 0.9);
    item.group.position.set(x, y + Math.sin(t * 0.7 + item.phase) * 0.45 + Math.abs(Math.sin(kick * Math.PI * 3)) * kick * 1.1, z);
    item.group.rotation.y = item.phase + t * item.spin + kick * 5;
    item.group.rotation.x = Math.sin(t * 0.5 + item.phase) * 0.25;
  }

  private register(id: string, object: Group, hit: (now: number, point: Vector3) => void): void {
    object.userData.interactiveId = id;
    this.interactives.push({ id, object, hit });
  }

  private makeBlocks(): Group[] {
    return Array.from({ length: 12 }, (_, index) => {
      const size = this.rng.between(0.8, 1.6);
      const block = new Group();
      const body = new Mesh(new RoundedBoxGeometry(size, size, size, 3, size * 0.2), this.clay.get(BLOCKS[index % BLOCKS.length] as number));
      body.castShadow = true;
      block.add(body);
      const base: [number, number, number] = [this.rng.between(3, 26), this.rng.between(3.5, 15), this.rng.between(-14, 8)];
      block.position.set(...base);
      const item: Floater = { group: block, base, phase: this.rng.between(0, Math.PI * 2), spin: this.rng.between(-0.3, 0.3), hitAt: -10, poppedAt: -10 };
      this.blocks.push(item);
      this.register(`bloque-${index}`, block, (now) => {
        item.hitAt = now;
      });
      return block;
    });
  }

  private makeStars(): Group[] {
    const geometry = StarGeometry.build();
    return Array.from({ length: 9 }, (_, index) => {
      const star = new Group();
      const mesh = new Mesh(geometry, this.starMaterial);
      mesh.scale.setScalar(this.rng.between(0.45, 0.8));
      star.add(mesh);
      const base: [number, number, number] = [this.rng.between(2, 27), this.rng.between(5, 16), this.rng.between(-12, 6)];
      star.position.set(...base);
      const item: Floater = { group: star, base, phase: this.rng.between(0, Math.PI * 2), spin: this.rng.between(0.4, 1.1), hitAt: -10, poppedAt: -10 };
      this.stars.push(item);
      this.register(`estrella-${index}`, star, (now, point) => {
        if (now - item.poppedAt < RESPAWN) return;
        item.poppedAt = now;
        this.onPop(point);
      });
      return star;
    });
  }

  private makeKites(): Group[] {
    const colors = [0xff8fb7, 0x7fd0ea, 0xffe35c] as const;
    return colors.map((color, index) => {
      const kite = new Group();
      const outline = new Shape();
      outline.moveTo(0, 1.2);
      outline.lineTo(0.8, 0);
      outline.lineTo(0, -1.5);
      outline.lineTo(-0.8, 0);
      outline.closePath();
      const sail = new Mesh(new ExtrudeGeometry(outline, { depth: 0.05, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.03, bevelSegments: 2 }), this.clay.get(color));
      kite.add(sail);
      const tail: Mesh[] = [];
      for (let piece = 0; piece < 7; piece += 1) {
        const bow = new Mesh(new RoundedBoxGeometry(0.3, 0.12, 0.05, 2, 0.03), this.clay.get(piece % 2 === 0 ? 0xfff6dc : color));
        bow.position.set(0, -1.9 - piece * 0.38, 0);
        tail.push(bow);
        kite.add(bow);
      }
      kite.position.set(6 + index * 6.5, 12.5 + (index % 2) * 2.5, -9 - index * 2);
      kite.scale.setScalar(1.5);
      const item: Kite = { group: kite, tail, phase: index * 2.1, hitAt: -10 };
      this.kites.push(item);
      this.register(`cometa-${index}`, kite, (now) => {
        item.hitAt = now;
      });
      return kite;
    });
  }

  private stripes(): CanvasTexture {
    const surface = document.createElement("canvas");
    surface.width = 256;
    surface.height = 8;
    const context = surface.getContext("2d");
    if (context) {
      STRIPES.forEach((color, index) => {
        context.fillStyle = color;
        context.fillRect((index / STRIPES.length) * 256, 0, 256 / STRIPES.length + 1, 8);
      });
    }
    const texture = new CanvasTexture(surface);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }

  private makeBalloon(): Group {
    const canopy = new Mesh(new SphereGeometry(1, 30, 22), new MeshStandardMaterial({ map: this.stripes(), roughness: 0.6 }));
    canopy.scale.set(1, 1.12, 1);
    canopy.position.y = 1.5;
    const basket = new Mesh(new RoundedBoxGeometry(0.5, 0.36, 0.5, 2, 0.08), this.clay.get(0xc4805a));
    basket.position.y = -0.35;
    this.balloon.add(canopy, basket);
    [-1, 1].forEach((x) => [-1, 1].forEach((z) => {
      const rope = new Mesh(new CylinderGeometry(0.012, 0.012, 1.1, 5), this.clay.get(0x6b4a6a));
      rope.position.set(x * 0.4, 0.2, z * 0.4);
      rope.rotation.set(z * 0.5, 0, -x * 0.5);
      this.balloon.add(rope);
    }));
    this.balloon.scale.setScalar(2.2);
    this.balloon.position.set(3, 13, -14);
    this.register("globo", this.balloon, (now) => {
      this.balloonHitAt = now;
    });
    return this.balloon;
  }

  private makeDucks(): Group[] {
    return Array.from({ length: 3 }, (_, index) => {
      const duck = new Group();
      const body = new Mesh(new SphereGeometry(0.3, 14, 10), this.clay.get(0xffe35c));
      body.scale.set(0.9, 0.7, 1.2);
      body.position.y = 0.18;
      const head = new Mesh(new SphereGeometry(0.17, 12, 10), this.clay.get(0xffe35c));
      head.position.set(0, 0.46, 0.28);
      const beak = new Mesh(new ConeGeometry(0.07, 0.16, 8), this.clay.get(0xffa043));
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 0.44, 0.47);
      const eye = new Mesh(new SphereGeometry(0.03, 8, 6), this.clay.get(0x2a1730));
      eye.position.set(0.1, 0.5, 0.38);
      const eyeOther = eye.clone();
      eyeOther.position.x = -0.1;
      duck.add(body, head, beak, eye, eyeOther);
      duck.traverse((part) => {
        part.castShadow = true;
      });
      const item: Duck = { group: duck, radius: 0.9 + index * 0.55, speed: (index % 2 === 0 ? 1 : -1) * (0.35 + index * 0.08), phase: index * 2.1, hitAt: -10 };
      this.ducks.push(item);
      this.register(`pato-${index}`, duck, (now) => {
        item.hitAt = now;
      });
      return duck;
    });
  }
}
