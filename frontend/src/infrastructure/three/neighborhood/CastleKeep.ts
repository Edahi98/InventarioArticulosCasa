import {
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  RingGeometry,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  type CanvasTexture,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { CASTLE_MOAT, CASTLE_ROOF, CASTLE_STONE, CASTLE_TOWERS, CASTLE_WALL_RADIUS } from "../../../constantes/barrio_constantes.js";
import { MeshMerger } from "../MeshMerger.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { TextureCanvas } from "../TextureCanvas.js";
import { Solid } from "../walk/Solid.js";
import { CraftMaterials } from "./CraftMaterials.js";
import type { NightLights } from "./NightLights.js";

const WALL_HEIGHT = 1.6;
const WALL_SEGMENTS = 14;
const GATE_HALF = 0.32;
const BANNERS = [0xe8402d, 0x3b6bd8, 0xffd84d, 0x9be08a] as const;

export class CastleKeep {
  readonly group = new Group();
  readonly lamps: MeshStandardMaterial[] = [];
  readonly flags: Object3D[] = [];
  readonly torches: MeshStandardMaterial[] = [];
  private readonly stone = new MeshStandardMaterial({ color: CASTLE_STONE, map: SurfaceTextures.rock(), bumpMap: SurfaceTextures.rock(), bumpScale: 1.2, roughness: 0.9 });
  private readonly roof = new MeshStandardMaterial({ color: CASTLE_ROOF, roughness: 0.7, map: SurfaceTextures.roundShingles(), bumpMap: SurfaceTextures.roundShingles(), bumpScale: 1.1 });

  /**
   * Castillo de cuento con el portón mirando hacia +x: foso de agua con bordes de piedra, puente levadizo bajado con
   * cadenas, murallas almenadas en anillo, torres redondas con techos cónicos de tejas y banderas, dos torres cuadradas
   * de portón con rastrillo a medio subir y escudos, torre del homenaje al centro con torrecillas, vitrales que brillan
   * de noche y estandarte, y antorchas encendidas. Murallas, torres y torre del homenaje son sólidas; el puente
   * levadizo es caminable.
   *
   * @param lights - Luces de la noche, para los halos de las antorchas.
   */
  constructor(lights: NightLights) {
    this.group.add(this.moat(), this.drawbridge(), ...this.walls(), this.merlons(), ...this.towers(), ...this.gate(lights), this.keep(lights));
    this.group.traverse((part) => {
      part.castShadow = true;
      part.receiveShadow = true;
    });
  }

  private static vitral(): CanvasTexture {
    return TextureCanvas.build("vitral", 64, 96, false, (context, rng, width, height) => {
      const colors = ["#ff6f91", "#7fd0ea", "#ffd84d", "#9be08a", "#b98cf0"];
      for (let row = 0; row < 6; row += 1) {
        for (let column = 0; column < 4; column += 1) {
          context.fillStyle = rng.pick(colors);
          context.fillRect(column * 16, row * 16, 16, 16);
        }
      }
      context.strokeStyle = "#2a2233";
      context.lineWidth = 3;
      for (let x = 0; x <= width; x += 16) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      for (let y = 0; y <= height; y += 16) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }
    });
  }

  private glass(): MeshStandardMaterial {
    const texture = CastleKeep.vitral();
    const material = new MeshStandardMaterial({ map: texture, emissive: 0xffffff, emissiveMap: texture, emissiveIntensity: 0.3, roughness: 0.3 });
    this.lamps.push(material);
    return material;
  }

  private moat(): Group {
    const moat = new Group();
    const water = new Mesh(new RingGeometry(CASTLE_MOAT[0], CASTLE_MOAT[1], 64, 1), new MeshStandardMaterial({ color: 0x6cc6f0, roughness: 0.15, map: SurfaceTextures.ripples() }));
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.035;
    moat.add(water);
    CASTLE_MOAT.forEach((radius) => {
      const rim = new Mesh(new TorusGeometry(radius, 0.12, 6, 64), this.stone);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.06;
      moat.add(rim);
    });
    const outer = CASTLE_MOAT[1];
    const pieces = 28;
    for (let index = 0; index < pieces; index += 1) {
      const angle = (index / pieces) * Math.PI * 2;
      if (Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))) < 0.3) continue;
      const wall = Solid.mark(new Object3D(), { shape: "box", size: [0.3, 0.6, (Math.PI * 2 * outer) / pieces + 0.05], offset: [0, 0.3, 0] });
      wall.position.set(Math.cos(angle) * outer, 0, Math.sin(angle) * outer);
      wall.rotation.y = -angle;
      moat.add(wall);
    }
    return moat;
  }

  private drawbridge(): Group {
    const bridge = new Group();
    const length = CASTLE_MOAT[1] - CASTLE_WALL_RADIUS + 0.5;
    const deck = new Mesh(new RoundedBoxGeometry(length, 0.08, GATE_HALF * 2 + 0.3, 2, 0.03), CraftMaterials.wood(0x9a6b52));
    deck.position.set(CASTLE_WALL_RADIUS + length / 2 - 0.2, 0.08, 0);
    bridge.add(deck);
    [-1, 1].forEach((side) => {
      const chain = new Mesh(new CylinderGeometry(0.02, 0.02, 2.1, 5), CraftMaterials.paint(0x3a2a40));
      chain.position.set(CASTLE_WALL_RADIUS + 0.95, 1.0, side * (GATE_HALF + 0.12));
      chain.rotation.z = 0.95;
      bridge.add(chain);
    });
    return MeshMerger.merge(bridge);
  }

  private walls(): Object3D[] {
    const items: Object3D[] = [];
    const span = (Math.PI * 2) / WALL_SEGMENTS;
    for (let index = 0; index < WALL_SEGMENTS; index += 1) {
      const angle = index * span;
      const gap = index === 0;
      const length = 2 * CASTLE_WALL_RADIUS * Math.sin(span / 2) + 0.06;
      if (gap) continue;
      const wall = new Mesh(new RoundedBoxGeometry(0.45, WALL_HEIGHT, length, 2, 0.05), this.stone);
      wall.position.set(Math.cos(angle) * CASTLE_WALL_RADIUS, WALL_HEIGHT / 2, Math.sin(angle) * CASTLE_WALL_RADIUS);
      wall.rotation.y = -angle;
      Solid.mark(wall, { shape: "box", size: [0.5, WALL_HEIGHT, length], offset: [0, 0, 0] });
      items.push(wall);
    }
    return items;
  }

  private merlons(): InstancedMesh {
    const step = 0.36;
    const count = Math.floor((Math.PI * 2 * CASTLE_WALL_RADIUS) / step);
    const mesh = new InstancedMesh(new RoundedBoxGeometry(0.47, 0.22, 0.2, 1, 0.03), this.stone, count);
    const holder = new Object3D();
    let used = 0;
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2;
      if (Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))) < 0.28 || index % 2 === 1) continue;
      holder.position.set(Math.cos(angle) * CASTLE_WALL_RADIUS, WALL_HEIGHT + 0.11, Math.sin(angle) * CASTLE_WALL_RADIUS);
      holder.rotation.y = -angle;
      holder.updateMatrix();
      mesh.setMatrixAt(used, holder.matrix);
      used += 1;
    }
    mesh.count = used;
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }

  private cone(radius: number, height: number): Mesh {
    const profile = [new Vector2(radius * 1.15, 0), new Vector2(radius * 0.9, height * 0.25), new Vector2(radius * 0.45, height * 0.65), new Vector2(0, height)];
    return new Mesh(new LatheGeometry(profile, 20), this.roof);
  }

  private flag(color: number, height: number): Group {
    const holder = new Group();
    const pole = new Mesh(new CylinderGeometry(0.02, 0.02, 0.7, 6), CraftMaterials.paint(0x3a2a40));
    pole.position.y = 0.35;
    const pivot = new Group();
    pivot.position.y = 0.6;
    const cloth = new Mesh(new PlaneGeometry(0.4, 0.22, 4, 1), new MeshStandardMaterial({ color, side: DoubleSide, roughness: 0.8 }));
    cloth.position.x = 0.2;
    pivot.add(cloth);
    holder.add(pole, pivot);
    holder.position.y = height;
    this.flags.push(pivot);
    return holder;
  }

  private towers(): Group[] {
    return Array.from({ length: CASTLE_TOWERS }, (_, index) => {
      const angle = ((index + 0.5) / CASTLE_TOWERS) * Math.PI * 2 + 0.2;
      const tower = new Group();
      const height = 2.5 + (index % 2) * 0.5;
      const body = new Mesh(new CylinderGeometry(0.62, 0.7, height, 20), this.stone);
      body.position.y = height / 2;
      const crown = new Mesh(new CylinderGeometry(0.75, 0.68, 0.3, 20), this.stone);
      crown.position.y = height + 0.1;
      const roof = this.cone(0.72, 1.2);
      roof.position.y = height + 0.25;
      const window = new Mesh(new RoundedBoxGeometry(0.16, 0.28, 0.05, 2, 0.05), this.glass());
      window.position.set(0.66, height * 0.65, 0);
      window.rotation.y = Math.PI / 2;
      tower.add(body, crown, roof, window, this.flag(BANNERS[index % BANNERS.length] as number, height + 1.4));
      tower.position.set(Math.cos(angle) * CASTLE_WALL_RADIUS, 0, Math.sin(angle) * CASTLE_WALL_RADIUS);
      tower.rotation.y = -angle;
      Solid.mark(tower, { shape: "cylinder", radius: 0.72, height, offset: [0, height / 2, 0] });
      return tower;
    });
  }

  private torch(lights: NightLights, x: number, y: number, z: number): Group {
    const torch = new Group();
    const stick = new Mesh(new CylinderGeometry(0.025, 0.02, 0.28, 6), CraftMaterials.wood(0x6b4a3a));
    const flame = new MeshStandardMaterial({ color: 0xffb036, emissive: 0xff8a1f, emissiveIntensity: 1 });
    this.torches.push(flame);
    const fire = new Mesh(new SphereGeometry(0.06, 10, 8), flame);
    fire.scale.set(1, 1.6, 1);
    fire.position.y = 0.2;
    const halo = lights.halo(0.9);
    halo.position.y = 0.22;
    torch.add(stick, fire, halo);
    torch.position.set(x, y, z);
    return torch;
  }

  private gate(lights: NightLights): Group[] {
    const gate = new Group();
    [-1, 1].forEach((side) => {
      const tower = new Mesh(new RoundedBoxGeometry(0.9, 2.4, 0.9, 2, 0.08), this.stone);
      tower.position.set(CASTLE_WALL_RADIUS, 1.2, side * (GATE_HALF + 0.48));
      Solid.mark(tower, { shape: "box", size: [0.9, 2.4, 0.9], offset: [0, 0, 0] });
      const roof = this.cone(0.62, 0.9);
      roof.position.set(CASTLE_WALL_RADIUS, 2.4, side * (GATE_HALF + 0.48));
      const shield = new Mesh(new CylinderGeometry(0.2, 0.2, 0.04, 3), CraftMaterials.paint(BANNERS[side > 0 ? 0 : 1] as number));
      shield.rotation.set(0, 0, Math.PI / 2);
      shield.position.set(CASTLE_WALL_RADIUS + 0.47, 1.5, side * (GATE_HALF + 0.48));
      gate.add(tower, roof, shield, this.torch(lights, CASTLE_WALL_RADIUS + 0.5, 1.0, side * (GATE_HALF + 0.05)));
    });
    const arch = new Mesh(new RoundedBoxGeometry(0.9, 0.6, GATE_HALF * 2 + 0.1, 2, 0.06), this.stone);
    arch.position.set(CASTLE_WALL_RADIUS, 2.0, 0);
    gate.add(arch);
    const bars = new InstancedMesh(new CylinderGeometry(0.02, 0.02, 0.9, 5), CraftMaterials.paint(0x3a2a40), 8);
    const holder = new Object3D();
    for (let index = 0; index < 6; index += 1) {
      holder.position.set(CASTLE_WALL_RADIUS + 0.4, 1.55, -GATE_HALF + 0.05 + index * ((GATE_HALF * 2 - 0.1) / 5));
      holder.rotation.set(0, 0, 0);
      holder.updateMatrix();
      bars.setMatrixAt(index, holder.matrix);
    }
    [1.3, 1.75].forEach((y, index) => {
      holder.position.set(CASTLE_WALL_RADIUS + 0.4, y, 0);
      holder.rotation.set(Math.PI / 2, 0, 0);
      holder.scale.set(1, 0.75, 1);
      holder.updateMatrix();
      bars.setMatrixAt(6 + index, holder.matrix);
    });
    bars.instanceMatrix.needsUpdate = true;
    gate.add(bars);
    return [MeshMerger.merge(gate, gate.children.filter((child) => child instanceof Group))];
  }

  private keep(lights: NightLights): Group {
    const keep = new Group();
    const height = 4.2;
    const body = new Mesh(new RoundedBoxGeometry(2.2, height, 2.2, 3, 0.1), this.stone);
    body.position.y = height / 2;
    const roof = this.cone(1.35, 2);
    roof.position.y = height;
    keep.add(body, roof);
    [-1, 1].forEach((sx) =>
      [-1, 1].forEach((sz) => {
        const turret = new Mesh(new CylinderGeometry(0.28, 0.3, 0.9, 12), this.stone);
        turret.position.set(sx * 1.05, height + 0.2, sz * 1.05);
        const cap = this.cone(0.3, 0.7);
        cap.position.set(sx * 1.05, height + 0.65, sz * 1.05);
        keep.add(turret, cap);
      }),
    );
    const glass = this.glass();
    [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach((turn) => {
      const window = new Mesh(new RoundedBoxGeometry(0.4, 0.7, 0.05, 2, 0.12), glass);
      window.position.set(Math.cos(turn) * 1.11, height * 0.62, -Math.sin(turn) * 1.11);
      window.rotation.y = turn + Math.PI / 2;
      keep.add(window);
    });
    const banner = new Mesh(new PlaneGeometry(0.5, 1.1), new MeshStandardMaterial({ color: 0xe8402d, side: DoubleSide, roughness: 0.8 }));
    banner.position.set(1.12, height * 0.35, 0);
    banner.rotation.y = Math.PI / 2;
    const crest = new Mesh(new CylinderGeometry(0.16, 0.16, 0.02, 5), CraftMaterials.paint(0xffd84d));
    crest.rotation.z = Math.PI / 2;
    crest.position.set(1.14, height * 0.38, 0);
    keep.add(banner, crest, this.torch(lights, 1.15, 1.0, 0.45), this.torch(lights, 1.15, 1.0, -0.45), this.flag(0xffd84d, height + 2));
    Solid.mark(keep, { shape: "box", size: [2.2, height, 2.2], offset: [0, height / 2, 0] });
    return MeshMerger.merge(keep, keep.children.filter((child) => child instanceof Group));
  }
}
