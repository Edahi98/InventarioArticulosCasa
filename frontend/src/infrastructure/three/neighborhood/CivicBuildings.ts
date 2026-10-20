import {
  CatmullRomCurve3,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import type { CIVIC_KINDS } from "../../../constantes/barrio_constantes.js";
import type { BearTone } from "../../../core/domain/inventoryBear.js";
import { StarGeometry } from "../StarGeometry.js";
import { CivicParts } from "./CivicParts.js";
import { HouseParts } from "./HouseParts.js";
import { ServiceVehicle } from "./ServiceVehicle.js";

export type CivicKind = (typeof CIVIC_KINDS)[number];

export interface CivicBuilding {
  group: Group;
  glass: MeshStandardMaterial;
  width: number;
  depth: number;
  height: number;
  blinkers: MeshStandardMaterial[];
}

type Vec3 = [number, number, number];

const TRIM = 0xfff6dc;
const TONES: BearTone[] = ["rose", "sky", "sun", "lilac"];

export class CivicBuildings {
  private static blinking: MeshStandardMaterial[] = [];

  /**
   * Edificio del pueblo con oficio propio, de frente hacia +z: hospital con cruz roja, helipuerto y ambulancia; estación
   * de bomberos con portones, torre de campana y manguera; panadería con toldo de rayas y pastel gigante; escuela con
   * campanario, reloj y bandera; comisaría con estrella y faroles azules; biblioteca con columnas y libros gigantes;
   * correo con sobre y buzón; estación de tren con reloj, andén y locomotora; o un parque de juegos con columpios,
   * resbaladilla y subibaja. Las ventanas brillan de noche. No es interactivo como las casas.
   *
   * @param kind - Qué edificio es.
   * @param seed - Número para variar el conductor del vehículo estacionado.
   * @returns El edificio con su vidrio luminoso y sus medidas.
   */
  static build(kind: CivicKind, seed: number): CivicBuilding {
    const glass = new MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffd37a, emissiveIntensity: 0.5, roughness: 0.4 });
    const parts = new HouseParts(glass, TRIM);
    const group = new Group();
    const builders: Record<CivicKind, () => { width: number; depth: number; height: number }> = {
      hospital: () => this.hospital(group, parts, seed),
      bomberos: () => this.firehouse(group, parts),
      panaderia: () => this.bakery(group, parts),
      escuela: () => this.school(group, parts),
      comisaria: () => this.police(group, parts),
      biblioteca: () => this.library(group, parts),
      correo: () => this.postOffice(group, parts),
      estacion: () => this.station(group, parts),
      juegos: () => this.playground(group, parts),
    };
    const blinkers: MeshStandardMaterial[] = [];
    this.blinking = blinkers;
    const size = builders[kind]();
    group.traverse((part) => {
      part.castShadow = true;
      part.receiveShadow = true;
    });
    return { group, glass, blinkers, ...size };
  }

  private static mesh(group: Group, mesh: Mesh, at: Vec3, scale?: Vec3): Mesh {
    mesh.position.set(...at);
    if (scale) mesh.scale.set(...scale);
    group.add(mesh);
    return mesh;
  }

  private static placeSign(group: Group, text: string, color: number, width: number, at: Vec3): void {
    const sign = CivicParts.sign(text, color, width);
    sign.position.set(...at);
    group.add(sign);
  }

  private static windows(group: Group, parts: HouseParts, columns: number[], rows: number[], front: number, size = 0.28): void {
    columns.forEach((x) => rows.forEach((y) => group.add(parts.window(size, size, [x, y, front]))));
  }

  private static hospital(group: Group, parts: HouseParts, seed: number): { width: number; depth: number; height: number } {
    const width = 1.9;
    const depth = 1.5;
    const height = 1.75;
    const front = depth / 2 + 0.02;
    group.add(parts.box([width, height, depth], 0xfffaf2, [0, height / 2, 0]), parts.box([width + 0.06, 0.12, depth + 0.06], 0xff8fb7, [0, 0.9, 0], 0.05));
    group.add(parts.box([width + 0.1, 0.1, depth + 0.1], 0xff8fb7, [0, height + 0.05, 0], 0.05));
    group.add(parts.box([0.5, 0.14, 0.04], 0xff4f5b, [0, 1.32, front + 0.01], 0.03), parts.box([0.14, 0.5, 0.04], 0xff4f5b, [0, 1.32, front + 0.01], 0.03));
    this.windows(group, parts, [-0.62, 0.62], [0.55, 1.3], front, 0.3);
    const door = parts.door(0.46, 0.62, 0x7fd0ea, [0, 0.31, front]);
    group.add(door.group, parts.box([0.9, 0.06, 0.45], 0xff8fb7, [0, 0.74, front + 0.2], 0.03));
    [-0.4, 0.4].forEach((x) => group.add(parts.pole(0.025, 0.72, TRIM, [x, 0.36, front + 0.38])));
    const pad = CivicParts.disc("helipuerto", 0.62);
    this.mesh(group, pad, [0, height + 0.12, 0]);
    [0x4fe08a, 0xffd84d].forEach((color) => this.blinking.push(new MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.2 })));
    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2;
      this.mesh(group, new Mesh(new SphereGeometry(0.04, 8, 6), this.blinking[index % 2] as MeshStandardMaterial), [Math.cos(angle) * 0.7, height + 0.15, Math.sin(angle) * 0.7]);
    }
    this.placeSign(group, "Hospital", 0xff4f5b, 1.1, [0, 1.62, front + 0.02]);
    const ambulance = ServiceVehicle.build("ambulancia", TONES[seed % TONES.length] as BearTone, seed);
    ambulance.group.scale.setScalar(0.8);
    ambulance.group.position.set(width / 2 + 0.45, 0, 0.1);
    ambulance.group.rotation.y = -Math.PI / 2;
    group.add(ambulance.group);
    return { width: width + 1.1, depth: 1.9, height: height + 0.15 };
  }

  private static firehouse(group: Group, parts: HouseParts): { width: number; depth: number; height: number } {
    const width = 2;
    const depth = 1.5;
    const height = 1.3;
    const front = depth / 2 + 0.02;
    group.add(parts.box([width, height, depth], 0xe8502d, [0, height / 2, 0]), parts.gableRoof(width + 0.2, depth + 0.2, 0.55, height, 0x8a2a2a));
    [-0.48, 0.48].forEach((x) => {
      group.add(parts.box([0.74, 0.86, 0.05], TRIM, [x, 0.45, front], 0.04));
      [0.2, 0.38, 0.56, 0.74].forEach((y) => group.add(parts.box([0.7, 0.025, 0.03], 0xd8cbe8, [x, y, front + 0.03], 0.01)));
      group.add(parts.window(0.5, 0.12, [x, 0.66, front + 0.04]));
    });
    const roof = parts.cone(0.32, 0.5, height + 0.95, 0x8a2a2a);
    roof.position.x = -width / 2 + 0.05;
    roof.position.z = -0.3;
    group.add(parts.box([0.42, 1.1, 0.42], 0xe8502d, [-width / 2 + 0.05, height + 0.4, -0.3]), roof);
    this.mesh(group, new Mesh(new SphereGeometry(0.12, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), parts.material(0xffd43b)), [-width / 2 + 0.05, height + 0.62, -0.3], [1, -1.2, 1]);
    group.add(parts.window(0.16, 0.2, [-width / 2 + 0.05, height + 0.62, -0.08]));
    this.mesh(group, new Mesh(new TorusGeometry(0.16, 0.06, 10, 20), parts.material(0xffe35c)), [width / 2 + 0.12, 0.45, 0.2]).rotation.y = Math.PI / 2;
    this.mesh(group, new Mesh(new CylinderGeometry(0.07, 0.09, 0.32, 12), parts.material(0xff3b4f)), [width / 2 + 0.2, 0.16, front + 0.1]);
    this.placeSign(group, "Bomberos", 0x2a2233, 1.1, [0, 1.08, front + 0.03]);
    return { width: width + 0.4, depth, height: height + 1.45 };
  }

  private static bakery(group: Group, parts: HouseParts): { width: number; depth: number; height: number } {
    const width = 1.8;
    const depth = 1.5;
    const height = 1.25;
    const front = depth / 2 + 0.02;
    group.add(parts.box([width, height, depth], 0xfff1d6, [0, height / 2, 0]), parts.hipRoof(width, depth, 0.55, height, 0xff9fc8));
    group.add(parts.window(0.62, 0.4, [-0.42, 0.55, front]), parts.door(0.4, 0.66, 0xc4805a, [0.5, 0.33, front]).group);
    const canvas = new MeshStandardMaterial({ map: CivicParts.awning(["#ff8fb7", "#fffaf2"]), roughness: 0.7 });
    const awning = this.mesh(group, new Mesh(new CylinderGeometry(0.3, 0.3, width + 0.1, 20, 1, true, 0, Math.PI), canvas), [0, 1.02, front + 0.05]);
    awning.rotation.z = Math.PI / 2;
    const cake = new Group();
    this.mesh(cake, new Mesh(new CylinderGeometry(0.28, 0.3, 0.2, 24), parts.material(0xffe9c9)), [0, 0.1, 0]);
    this.mesh(cake, new Mesh(new CylinderGeometry(0.2, 0.22, 0.18, 24), parts.material(0xff9fc8)), [0, 0.29, 0]);
    this.mesh(cake, new Mesh(new SphereGeometry(0.06, 12, 10), parts.material(0xff3b4f)), [0, 0.43, 0]);
    this.mesh(cake, new Mesh(new TorusGeometry(0.27, 0.035, 8, 24), parts.material(0xfffaf2)), [0, 0.2, 0]).rotation.x = Math.PI / 2;
    cake.position.set(0, height + 0.5, 0);
    group.add(cake);
    const croissant = this.mesh(group, new Mesh(new TorusGeometry(0.12, 0.06, 10, 16, Math.PI * 1.2), parts.material(0xf0b060)), [-0.42, 0.42, front + 0.12]);
    croissant.rotation.z = 0.3;
    this.placeSign(group, "Panadería", 0xc4805a, 1.1, [0, 1.42, front + 0.25]);
    return { width, depth: depth + 0.3, height: height + 1 };
  }

  private static school(group: Group, parts: HouseParts): { width: number; depth: number; height: number } {
    const width = 2.1;
    const depth = 1.5;
    const height = 1.3;
    const front = depth / 2 + 0.02;
    group.add(parts.box([width, height, depth], 0xffd9a8, [0, height / 2, 0]), parts.gableRoof(width + 0.2, depth + 0.2, 0.6, height, 0xff6b6b));
    this.windows(group, parts, [-0.72, -0.36, 0.36, 0.72], [0.75], front, 0.24);
    group.add(parts.door(0.4, 0.62, 0x7fd0ea, [0, 0.31, front]).group);
    group.add(parts.box([0.42, 0.55, 0.42], 0xfffaf2, [0, height + 0.7, 0]), parts.cone(0.34, 0.5, height + 0.97, 0xff6b6b));
    this.mesh(group, new Mesh(new SphereGeometry(0.11, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), parts.material(0xffd43b)), [0, height + 0.85, 0], [1, -1.3, 1]);
    const clock = CivicParts.disc("reloj", 0.17);
    this.mesh(group, clock, [0, height + 0.32, front - 0.1]);
    group.add(parts.pole(0.02, 1.6, 0xe6ebf2, [width / 2 + 0.25, 0.8, front]));
    group.add(parts.box([0.36, 0.22, 0.02], 0x86d6a8, [width / 2 + 0.44, 1.45, front], 0.01));
    this.placeSign(group, "Escuela", 0x5a3d57, 0.9, [0, 1.12, front + 0.03]);
    return { width: width + 0.5, depth, height: height + 1.5 };
  }

  private static police(group: Group, parts: HouseParts): { width: number; depth: number; height: number } {
    const width = 1.9;
    const depth = 1.5;
    const height = 1.4;
    const front = depth / 2 + 0.02;
    group.add(parts.box([width, height, depth], 0xbfd8f5, [0, height / 2, 0]), parts.box([width + 0.12, 0.16, depth + 0.12], 0x2a3a6b, [0, height + 0.08, 0], 0.05));
    this.windows(group, parts, [-0.6, 0.6], [0.55, 1.05], front, 0.28);
    group.add(parts.door(0.44, 0.66, 0x2a3a6b, [0, 0.33, front]).group);
    const star = this.mesh(group, new Mesh(StarGeometry.build(), parts.material(0xffd43b)), [0, 1.08, front + 0.04], [0.2, 0.2, 0.2]);
    star.castShadow = true;
    [-0.36, 0.36].forEach((x) => {
      group.add(parts.pole(0.02, 0.5, 0x2a2233, [x, 0.95, front + 0.06]));
      this.mesh(group, new Mesh(new SphereGeometry(0.07, 12, 10), new MeshStandardMaterial({ color: 0x6cb2ff, emissive: 0x3b8bff, emissiveIntensity: 0.9 })), [x, 0.78, front + 0.08]);
    });
    group.add(parts.pole(0.02, 1.7, 0xe6ebf2, [-width / 2 - 0.2, 0.85, front - 0.1]), parts.box([0.36, 0.22, 0.02], 0x7fd0ea, [-width / 2 - 0.01, 1.55, front - 0.1], 0.01));
    this.placeSign(group, "Policía", 0x2a3a6b, 0.9, [0, 1.32, front + 0.03]);
    return { width: width + 0.5, depth, height: height + 0.2 };
  }

  private static library(group: Group, parts: HouseParts): { width: number; depth: number; height: number } {
    const width = 1.9;
    const depth = 1.4;
    const height = 1.3;
    const front = depth / 2 + 0.02;
    group.add(parts.box([width, height, depth], 0xd8cbe8, [0, height / 2, 0]), parts.gableRoof(width + 0.3, depth + 0.5, 0.45, height, 0xb89cf2));
    [-0.66, -0.22, 0.22, 0.66].forEach((x) => group.add(parts.pole(0.07, height - 0.1, 0xfffaf2, [x, height / 2, front + 0.2])));
    group.add(parts.box([width + 0.2, 0.08, 0.5], 0xfffaf2, [0, 0.04, front + 0.2], 0.03), parts.box([width, 0.06, 0.32], 0xfffaf2, [0, 0.1, front + 0.14], 0.02));
    group.add(parts.door(0.4, 0.66, 0x7a4fb8, [0, 0.43, front]).group);
    this.windows(group, parts, [-0.45, 0.45], [0.75], front, 0.24);
    [0xff6b6b, 0x7fd0ea, 0xffe35c].forEach((color, index) => {
      const book = parts.box([0.5, 0.12, 0.34], color, [width / 2 + 0.3, 0.06 + index * 0.12, 0.2], 0.03);
      book.rotation.y = index * 0.25;
      group.add(book);
    });
    this.placeSign(group, "Biblioteca", 0x5a3d57, 1.1, [0, height + 0.15, front + 0.25]);
    return { width: width + 0.6, depth: depth + 0.4, height: height + 0.5 };
  }

  private static postOffice(group: Group, parts: HouseParts): { width: number; depth: number; height: number } {
    const width = 1.8;
    const depth = 1.4;
    const height = 1.25;
    const front = depth / 2 + 0.02;
    group.add(parts.box([width, height, depth], 0xbfe6ff, [0, height / 2, 0]), parts.gableRoof(width + 0.2, depth + 0.2, 0.55, height, 0x3b6bd8));
    this.windows(group, parts, [-0.55, 0.55], [0.7], front, 0.3);
    group.add(parts.door(0.4, 0.64, 0xffd43b, [0, 0.32, front]).group);
    const envelope = new Group();
    envelope.add(parts.box([0.6, 0.38, 0.05], 0xfffaf2, [0, 0, 0], 0.03));
    const flap = this.mesh(envelope, new Mesh(new ConeGeometry(0.34, 0.2, 3), parts.material(0xff8fb7)), [0, 0.08, 0.03], [1, 1, 0.12]);
    flap.rotation.z = Math.PI;
    envelope.position.set(0, height + 0.25, front + 0.1);
    group.add(envelope);
    const box = new Group();
    box.add(parts.pole(0.03, 0.3, 0x2a3a6b, [0, 0.15, 0]), parts.box([0.26, 0.34, 0.24], 0x3b6bd8, [0, 0.45, 0], 0.08));
    box.position.set(width / 2 + 0.2, 0, front + 0.2);
    group.add(box);
    this.placeSign(group, "Correo", 0x3b6bd8, 0.9, [0, 1.08, front + 0.03]);
    return { width: width + 0.5, depth, height: height + 0.6 };
  }

  private static station(group: Group, parts: HouseParts): { width: number; depth: number; height: number } {
    const width = 1.7;
    const depth = 1.2;
    const height = 1.2;
    const front = depth / 2 + 0.02;
    const roof = parts.hipRoof(width, depth, 0.45, height, 0x86d6a8);
    roof.position.x = -0.2;
    roof.position.z = -0.2;
    const tower = parts.cone(0.32, 0.45, height + 0.7, 0x86d6a8);
    tower.position.x = 0.55;
    tower.position.z = -0.2;
    group.add(parts.box([width, height, depth], 0xffe9c9, [-0.2, height / 2, -0.2]), roof, parts.box([0.4, 1.0, 0.4], 0xffe9c9, [0.55, height + 0.2, -0.2]), tower);
    this.mesh(group, CivicParts.disc("reloj", 0.15), [0.55, height + 0.4, 0.02]);
    group.add(parts.door(0.38, 0.6, 0x5a3d57, [-0.4, 0.3, front - 0.2]).group, parts.window(0.3, 0.3, [0.1, 0.65, front - 0.2]));
    group.add(parts.box([2.2, 0.08, 0.5], 0xd8cbe8, [0, 0.04, front + 0.3], 0.03));
    [-1, 1].forEach((side) => group.add(parts.box([2.3, 0.03, 0.04], 0xc9d1d9, [0, 0.03, front + 0.75 + side * 0.13], 0.01)));
    const engine = new Group();
    engine.add(parts.box([0.34, 0.2, 0.26], 0xff6b6b, [-0.15, 0.24, 0], 0.05));
    this.mesh(engine, new Mesh(new CylinderGeometry(0.11, 0.11, 0.4, 16), parts.material(0x3b6bd8)), [0.18, 0.24, 0]).rotation.z = Math.PI / 2;
    this.mesh(engine, new Mesh(new CylinderGeometry(0.04, 0.06, 0.14, 10), parts.material(0x2a2233)), [0.3, 0.42, 0]);
    [-0.2, 0.05, 0.28].forEach((x) =>
      [-1, 1].forEach((side) => {
        this.mesh(engine, new Mesh(new CylinderGeometry(0.07, 0.07, 0.03, 14), parts.material(0x2a2233)), [x, 0.08, side * 0.14]).rotation.x = Math.PI / 2;
      }),
    );
    engine.position.set(-0.3, 0, front + 0.75);
    group.add(engine);
    this.placeSign(group, "Estación", 0x5a3d57, 0.9, [-0.2, 1.05, front - 0.17]);
    return { width: 2.3, depth: depth + 0.6, height: height + 1.1 };
  }

  private static playground(group: Group, parts: HouseParts): { width: number; depth: number; height: number } {
    group.add(parts.box([2.2, 0.04, 1.8], 0xffe58a, [0, 0.03, 0], 0.02));
    [-0.85, -0.05].forEach((x) =>
      [-1, 1].forEach((side) => {
        const leg = parts.pole(0.03, 1.05, 0xff6b6b, [x + side * 0.12, 0.5, -0.4]);
        leg.rotation.z = side * 0.22;
        group.add(leg);
      }),
    );
    const bar = parts.pole(0.035, 0.9, 0xff6b6b, [-0.45, 1.0, -0.4]);
    bar.rotation.z = Math.PI / 2;
    group.add(bar);
    [-0.65, -0.25].forEach((x) => {
      group.add(parts.pole(0.008, 0.6, 0x2a2233, [x - 0.06, 0.7, -0.4]), parts.pole(0.008, 0.6, 0x2a2233, [x + 0.06, 0.7, -0.4]), parts.box([0.18, 0.03, 0.12], 0x7fd0ea, [x, 0.4, -0.4], 0.01));
    });
    const slide = new Mesh(
      new TubeGeometry(new CatmullRomCurve3([new Vector3(0.5, 0.95, -0.5), new Vector3(0.65, 0.6, -0.1), new Vector3(0.75, 0.2, 0.35), new Vector3(0.78, 0.12, 0.6)]), 20, 0.12, 10),
      parts.material(0xffd43b),
    );
    group.add(slide, parts.box([0.36, 0.06, 0.36], 0x86d6a8, [0.5, 0.95, -0.6], 0.02));
    [-1, 1].forEach((side) => group.add(parts.pole(0.025, 0.95, 0x86d6a8, [0.5 + side * 0.15, 0.47, -0.75])));
    group.add(parts.box([1.0, 0.04, 0.12], 0xb89cf2, [-0.4, 0.22, 0.45], 0.02), parts.box([0.16, 0.16, 0.16], 0xff8fb7, [-0.4, 0.1, 0.45], 0.05));
    group.add(parts.box([0.6, 0.1, 0.6], 0xc4805a, [0.55, 0.05, 0.1], 0.03), parts.box([0.5, 0.06, 0.5], 0xfff1c4, [0.55, 0.08, 0.1], 0.02));
    this.placeSign(group, "Juegos", 0xff6b6b, 0.8, [0, 0.5, 0.95]);
    group.add(parts.pole(0.025, 0.5, 0x5a3d57, [-0.3, 0.25, 0.92]), parts.pole(0.025, 0.5, 0x5a3d57, [0.3, 0.25, 0.92]));
    return { width: 2.2, depth: 1.8, height: 1.1 };
  }
}
