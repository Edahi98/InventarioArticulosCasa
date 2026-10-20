import { CylinderGeometry, DoubleSide, ExtrudeGeometry, Group, Mesh, MeshStandardMaterial, Shape, SphereGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { SHOP_AWNINGS, type SHOP_KINDS } from "../../../constantes/barrio_constantes.js";
import { CivicParts } from "./CivicParts.js";
import { HouseParts } from "./HouseParts.js";

export type ShopKind = (typeof SHOP_KINDS)[number];

export interface BuiltShop {
  group: Group;
  glass: MeshStandardMaterial;
  width: number;
  depth: number;
  height: number;
}

const LABELS: Record<ShopKind, string> = {
  jugueteria: "Juguetería",
  fruteria: "Frutería",
  libreria: "Librería",
  cafeteria: "Cafetería",
  mercado: "Mercado",
  panaderia: "Panadería",
};
const WALLS: Record<ShopKind, number> = { jugueteria: 0xffd9e6, fruteria: 0xe6f7d6, libreria: 0xe8dcf7, cafeteria: 0xf6e3cf, mercado: 0xfff1c9, panaderia: 0xfff1d6 };
const ROOFS: Record<ShopKind, number> = { jugueteria: 0xff6f91, fruteria: 0x6fbf5a, libreria: 0x7a58c9, cafeteria: 0x9a6040, mercado: 0xff9a3b, panaderia: 0xff9fc8 };
const TRIM = 0xfff6dc;

export class ShopFront {
  /**
   * Tienda de cuento de frente hacia +z: muros de plastilina, techo de tejas a dos aguas, escaparate grande con marco y
   * vitrina que brilla de noche, puerta redonda con aldaba, toldo de rayas con festón ondulado, macetas con flores a
   * los lados, letrero colgante de un brazo de hierro y la mercancía de su oficio en la vitrina (juguetes, frutas,
   * libros, tazas, cajas o panes).
   *
   * @param kind - Qué tienda es.
   * @param stripe - Número que elige los colores del toldo.
   * @returns La tienda, su vidrio luminoso y sus medidas.
   */
  static build(kind: ShopKind, stripe: number): BuiltShop {
    const glass = new MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffd37a, emissiveIntensity: 0.5, roughness: 0.3 });
    const parts = new HouseParts(glass, TRIM);
    const group = new Group();
    const width = 1.55;
    const depth = 1.2;
    const height = 1.15;
    const front = depth / 2 + 0.02;
    group.add(parts.box([width, height, depth], WALLS[kind], [0, height / 2, 0]), parts.gableRoof(width + 0.2, depth + 0.25, 0.5, height, ROOFS[kind]));
    group.add(parts.box([width + 0.04, 0.1, depth + 0.04], TRIM, [0, 0.05, 0], 0.03));
    group.add(parts.window(0.62, 0.42, [-0.32, 0.55, front]), parts.box([0.72, 0.06, 0.14], TRIM, [-0.32, 0.28, front + 0.05], 0.02));
    group.add(this.door(parts, ROOFS[kind], [0.4, 0, front]));
    group.add(this.awning(width, front, stripe));
    group.add(this.sign(kind, width, front));
    group.add(...this.planters(parts, width, front));
    group.add(this.goods(kind, parts, front));
    group.traverse((part) => {
      part.castShadow = true;
      part.receiveShadow = true;
    });
    return { group, glass, width: width + 0.3, depth: depth + 0.5, height: height + 0.6 };
  }

  private static door(parts: HouseParts, color: number, at: [number, number, number]): Group {
    const door = new Group();
    const outline = new Shape();
    outline.moveTo(-0.17, 0);
    outline.lineTo(-0.17, 0.42);
    outline.absarc(0, 0.42, 0.17, Math.PI, 0, true);
    outline.lineTo(0.17, 0);
    outline.closePath();
    const leaf = new Mesh(new ExtrudeGeometry(outline, { depth: 0.05, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2, curveSegments: 12 }), parts.material(color));
    const frame = new Mesh(new ExtrudeGeometry(outline, { depth: 0.03, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.01, bevelSegments: 1, curveSegments: 12 }), parts.material(TRIM));
    frame.position.z = -0.02;
    const knocker = new Mesh(new SphereGeometry(0.025, 8, 6), new MeshStandardMaterial({ color: 0xffd37a, metalness: 0.5, roughness: 0.3 }));
    knocker.position.set(0.1, 0.32, 0.08);
    door.add(frame, leaf, knocker);
    door.position.set(...at);
    return door;
  }

  private static awning(width: number, front: number, stripe: number): Group {
    const awning = new Group();
    const canvas = new MeshStandardMaterial({ map: CivicParts.awning(SHOP_AWNINGS[stripe % SHOP_AWNINGS.length] as readonly string[]), roughness: 0.7, side: DoubleSide });
    const sheet = new Mesh(new CylinderGeometry(0.32, 0.32, width + 0.05, 16, 1, true, Math.PI, Math.PI / 2), canvas);
    sheet.rotation.z = Math.PI / 2;
    sheet.position.set(0, 0.98, front);
    awning.add(sheet);
    const scallops = Math.round(width / 0.14);
    for (let index = 0; index < scallops; index += 1) {
      const scallop = new Mesh(new SphereGeometry(0.07, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), canvas);
      scallop.scale.set(1, 0.8, 0.35);
      scallop.position.set(-width / 2 + (index + 0.5) * (width / scallops), 0.67, front + 0.32);
      awning.add(scallop);
    }
    return awning;
  }

  private static sign(kind: ShopKind, width: number, front: number): Group {
    const holder = new Group();
    const iron = new MeshStandardMaterial({ color: 0x3a2a40, roughness: 0.5, metalness: 0.4 });
    const arm = new Mesh(new CylinderGeometry(0.015, 0.015, 0.45, 6), iron);
    arm.rotation.x = Math.PI / 2;
    arm.position.set(width / 2 - 0.05, 1.12, front + 0.2);
    const board = CivicParts.sign(LABELS[kind], 0x5a3d57, 0.62);
    board.rotation.y = Math.PI / 2;
    board.position.set(width / 2 - 0.05, 0.98, front + 0.38);
    const top = CivicParts.sign(LABELS[kind], 0x5a3d57, 0.9);
    top.position.set(0, 1.3, front + 0.05);
    holder.add(arm, board, top);
    return holder;
  }

  private static planters(parts: HouseParts, width: number, front: number): Mesh[] {
    return [-1, 1].flatMap((side) => {
      const pot = parts.box([0.2, 0.18, 0.2], 0xc4805a, [side * (width / 2 + 0.05), 0.09, front + 0.15], 0.05);
      const bush = new Mesh(new SphereGeometry(0.13, 12, 10), parts.material(side > 0 ? 0xff8fb7 : 0xffd84d));
      bush.position.set(side * (width / 2 + 0.05), 0.27, front + 0.15);
      return [pot, bush];
    });
  }

  private static goods(kind: ShopKind, parts: HouseParts, front: number): Group {
    const goods = new Group();
    const colors: Record<ShopKind, number[]> = {
      jugueteria: [0xff4f5b, 0x7fd0ea, 0xffd84d],
      fruteria: [0xff4f5b, 0xffb036, 0x9be08a],
      libreria: [0x7a58c9, 0xff6f91, 0x59c9b6],
      cafeteria: [0xfffaf2, 0x9a6040, 0xffc8d6],
      mercado: [0xc4805a, 0xffe35c, 0x9be08a],
      panaderia: [0xf0b060, 0xffe9c9, 0xff9fc8],
    };
    (colors[kind] as number[]).forEach((color, index) => {
      const item =
        kind === "libreria" || kind === "mercado"
          ? parts.box([0.12, 0.16, 0.08], color, [-0.52 + index * 0.18, 0.43, front + 0.09], 0.02)
          : new Mesh(new SphereGeometry(0.07, 12, 10), parts.material(color));
      item.position.set(-0.52 + index * 0.18, 0.4, front + 0.1);
      goods.add(item);
    });
    return goods;
  }
}
