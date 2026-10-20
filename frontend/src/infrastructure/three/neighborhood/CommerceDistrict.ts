import { CatmullRomCurve3, Color, CylinderGeometry, Group, InstancedMesh, Mesh, MeshStandardMaterial, Object3D, Shape, ShapeGeometry, TubeGeometry, Vector3 } from "three";
import { SHOP_KINDS } from "../../../constantes/barrio_constantes.js";
import { MeshMerger } from "../MeshMerger.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { Solid } from "../walk/Solid.js";
import type { BearBudget } from "./BearBudget.js";
import { CraftMaterials } from "./CraftMaterials.js";
import { MarketPlaza } from "./MarketPlaza.js";
import { MiniMall } from "./MiniMall.js";
import type { NightLights } from "./NightLights.js";
import type { ParticleSystem } from "./ParticleSystem.js";
import type { LotSlot } from "./RingLayout.js";
import { ShopFront, type BuiltShop, type ShopKind } from "./ShopFront.js";

const GROUND = 0.06;
const FLAG_COLORS = [0xff6f91, 0xffd84d, 0x7fd0ea, 0x9be08a, 0xb98cf0] as const;

export class CommerceDistrict {
  readonly group = new Group();
  readonly lamps: MeshStandardMaterial[] = [];
  readonly plaza: MarketPlaza;

  /**
   * Zona comercial de cuento en tres lotes seguidos del anillo: al centro la plaza con fuente, quioscos y puestos; a los
   * lados dos tiendas con toldo y letrero colgante en cada lote (o el centro comercial de vidrio en uno de ellos); y al
   * frente, sobre la banqueta, una calle peatonal con banderines de colores y una guirnalda de foquitos que se enciende
   * de noche.
   *
   * @param slots - Los tres lotes, en orden alrededor del anillo.
   * @param seed - Número que reparte los oficios de las tiendas.
   * @param withMall - Si uno de los lotes lleva el centro comercial.
   * @param budget - Tope de ositos animados de las plazas.
   * @param lights - Luces de la noche, para la guirnalda.
   * @param particles - Partículas, para la fuente.
   */
  constructor(slots: LotSlot[], seed: number, withMall: boolean, budget: BearBudget, lights: NightLights, particles: ParticleSystem) {
    const [left, middle, right] = slots as [LotSlot, LotSlot, LotSlot];
    this.plaza = new MarketPlaza(seed, budget, particles, () => new Vector3(middle.x, GROUND, middle.z));
    this.plaza.group.position.set(middle.x, 0, middle.z);
    this.plaza.group.rotation.y = middle.yaw;
    this.group.add(this.plaza.group, this.shops(left, seed, false), this.shops(right, seed + 3, withMall), this.street(slots, lights));
  }

  /**
   * Anima la plaza (compradores, músico y baile).
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    this.plaza.update(elapsed, night, moving);
  }

  private shops(slot: LotSlot, seed: number, mall: boolean): Group {
    const lot = new Group();
    const pad = new Mesh(new CylinderGeometry(1.85, 1.89, 0.06, 40), new MeshStandardMaterial({ color: 0xf3e3d0, map: SurfaceTextures.cobble(), bumpMap: SurfaceTextures.cobble(), bumpScale: 0.6, roughness: 0.9 }));
    pad.position.y = 0.03;
    pad.receiveShadow = true;
    lot.add(pad);
    const place = (built: BuiltShop, x: number): void => {
      MeshMerger.merge(built.group);
      built.group.position.set(x, GROUND, -0.15);
      Solid.mark(built.group, { shape: "box", size: [built.width * 0.9, built.height, built.depth * 0.8], offset: [0, built.height / 2, -0.1] });
      this.lamps.push(built.glass);
      lot.add(built.group);
    };
    if (mall) place(MiniMall.build(), 0);
    if (!mall) [-0.86, 0.86].forEach((x, index) => place(ShopFront.build(SHOP_KINDS[(seed + index) % SHOP_KINDS.length] as ShopKind, seed + index), x));
    lot.position.set(slot.x, 0, slot.z);
    lot.rotation.y = slot.yaw;
    return lot;
  }

  private street(slots: LotSlot[], lights: NightLights): Group {
    const street = new Group();
    const fronts = slots.map((slot) => new Vector3(slot.x + Math.sin(slot.yaw) * 1.75, 1.75, slot.z + Math.cos(slot.yaw) * 1.75));
    const first = fronts[0] as Vector3;
    const last = fronts[fronts.length - 1] as Vector3;
    const ends = [first.clone().addScaledVector(first.clone().sub(last).setY(0).normalize(), 1.6), ...fronts, last.clone().addScaledVector(last.clone().sub(first).setY(0).normalize(), 1.6)];
    const posts = ends.map((point) => {
      const post = new Mesh(new CylinderGeometry(0.03, 0.04, 1.8, 8), CraftMaterials.paint(0x6b4a6a));
      post.position.set(point.x, 0.9 + GROUND, point.z);
      Solid.mark(post, { shape: "cylinder", radius: 0.05, height: 1.8, offset: [0, 0, 0] });
      return post;
    });
    street.add(...posts);
    const sag = (from: Vector3, to: Vector3, u: number, drop: number): Vector3 => from.clone().lerp(to, u).add(new Vector3(0, -drop * Math.sin(u * Math.PI), 0));
    const flagPoints: Vector3[] = [];
    const bulbPoints: Vector3[] = [];
    ends.slice(0, -1).forEach((from, index) => {
      const to = ends[index + 1] as Vector3;
      const rope = new CatmullRomCurve3(Array.from({ length: 9 }, (_, step) => sag(from, to, step / 8, 0.3)));
      street.add(new Mesh(new TubeGeometry(rope, 16, 0.008, 4), CraftMaterials.rope()));
      for (let flag = 1; flag < 9; flag += 1) flagPoints.push(sag(from, to, flag / 9, 0.3));
      for (let bulb = 1; bulb < 12; bulb += 1) bulbPoints.push(sag(from, to, bulb / 12, 0.42).add(new Vector3(0, -0.12, 0)));
    });
    const triangle = new Shape();
    triangle.moveTo(-0.07, 0);
    triangle.lineTo(0.07, 0);
    triangle.lineTo(0, -0.16);
    triangle.closePath();
    const flags = new InstancedMesh(new ShapeGeometry(triangle), new MeshStandardMaterial({ side: 2, roughness: 0.7 }), flagPoints.length);
    const holder = new Object3D();
    flagPoints.forEach((point, index) => {
      holder.position.copy(point);
      holder.rotation.set(0, Math.atan2(last.x - first.x, last.z - first.z) + Math.PI / 2, 0);
      holder.updateMatrix();
      flags.setMatrixAt(index, holder.matrix);
      flags.setColorAt(index, new Color(FLAG_COLORS[index % FLAG_COLORS.length] as number));
    });
    flags.instanceMatrix.needsUpdate = true;
    if (flags.instanceColor) flags.instanceColor.needsUpdate = true;
    street.add(flags, lights.garland(bulbPoints));
    return street;
  }
}
