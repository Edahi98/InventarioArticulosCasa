import {
  AmbientLight,
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
} from "three";
import type { InventoryBear } from "../../core/domain/inventoryBear.js";
import { BearBuilder } from "./BearBuilder.js";

interface RoomStyle {
  column: number;
  row: number;
  wall: number;
  rug: number;
}

const ROOM_WIDTH = 2.6;
const ROOM_HEIGHT = 2.1;
const ROOM_DEPTH = 1.8;
const WALL = 0.12;
const BEAR_SCALE = 0.6;

const FRAME_COLOR = 0x5a3d57;
const FLOOR_COLOR = 0x8a6384;
const ROOF_COLOR = 0xff8fb7;
const WINDOW_COLOR = 0xfffaf2;
const GLASS_COLOR = 0xfff0d6;

const ROOMS: Record<string, RoomStyle> = {
  libros: { column: 0, row: 0, wall: 0xfff1c2, rug: 0xb89cf2 },
  herramientas: { column: 1, row: 0, wall: 0xc9f0e0, rug: 0xffe35c },
  cocina: { column: 0, row: 1, wall: 0xffd9c7, rug: 0x7fd0ea },
  bodega: { column: 1, row: 1, wall: 0xdcebd0, rug: 0xff8fb7 },
};

export class DollhouseStage {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(30, 1, 0.1, 60);
  private readonly house = new Group();

  constructor(canvas: HTMLCanvasElement, bears: InventoryBear[]) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.camera.position.set(0, 0.4, 14);
    this.camera.lookAt(0, 0.3, 0);

    const key = new DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 7, 8);
    this.scene.add(new AmbientLight(0xffffff, 0.7), new HemisphereLight(0xfff0f6, 0x2a2233, 0.8), key, this.house);

    this.buildStructure();
    const builder = new BearBuilder();
    bears.forEach((bear) => this.addRoom(builder, bear));
  }

  /**
   * Ajusta el lienzo y encuadra la casa completa.
   *
   * @param width - Ancho en píxeles CSS.
   * @param height - Alto en píxeles CSS.
   */
  resize(width: number, height: number): void {
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    const halfFov = MathUtils.degToRad(this.camera.fov / 2);
    const forHeight = 3.9 / Math.tan(halfFov);
    const forWidth = 3.2 / (Math.tan(halfFov) * this.camera.aspect);
    this.camera.position.z = Math.max(forHeight, forWidth);
    this.camera.updateProjectionMatrix();
    this.render();
  }

  /**
   * Inclina un poco la casa hacia el puntero para que se vea su profundidad.
   *
   * @param x - Horizontal entre -1 y 1.
   * @param y - Vertical entre -1 y 1.
   */
  setPointer(x: number, y: number): void {
    this.house.rotation.y = x * 0.22;
    this.house.rotation.x = y * 0.06;
    this.render();
  }

  /**
   * Libera geometrías, materiales y el contexto WebGL.
   */
  dispose(): void {
    this.scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      (object.geometry as BufferGeometry).dispose();
      (object.material as Material).dispose();
    });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  private material(color: number): MeshStandardMaterial {
    return new MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.02 });
  }

  private box(size: [number, number, number], color: number, position: [number, number, number]): Mesh {
    const mesh = new Mesh(new BoxGeometry(...size), this.material(color));
    mesh.position.set(...position);
    return mesh;
  }

  private buildStructure(): void {
    const totalWidth = ROOM_WIDTH * 2;
    const top = ROOM_HEIGHT;
    const dividers = [-ROOM_WIDTH, 0, ROOM_WIDTH].map((x) =>
      this.box([WALL, ROOM_HEIGHT * 2 + WALL, ROOM_DEPTH], FRAME_COLOR, [x, 0, 0]),
    );
    const base = this.box([totalWidth + 0.5, 0.22, ROOM_DEPTH + 0.5], FRAME_COLOR, [0, -top - 0.11, 0.1]);
    const roofGeometry = new ConeGeometry((totalWidth + 0.7) / Math.SQRT2, 1.35, 4);
    roofGeometry.rotateY(Math.PI / 4);
    const roof = new Mesh(roofGeometry, this.material(ROOF_COLOR));
    roof.scale.z = (ROOM_DEPTH + 0.5) / (totalWidth + 0.7);
    roof.position.set(0, top + 0.675, 0);
    const chimney = this.box([0.4, 0.9, 0.4], FRAME_COLOR, [1.7, top + 1.1, -0.2]);

    this.house.add(...dividers, base, roof, chimney);
  }

  private addRoom(builder: BearBuilder, bear: InventoryBear): void {
    const style = ROOMS[bear.id];
    if (!style) return;
    const x = (style.column - 0.5) * ROOM_WIDTH;
    const y = (0.5 - style.row) * ROOM_HEIGHT;
    const floorTop = y - ROOM_HEIGHT / 2 + WALL;

    const backWall = this.box([ROOM_WIDTH - WALL, ROOM_HEIGHT, WALL], style.wall, [x, y, -ROOM_DEPTH / 2]);
    const floor = this.box([ROOM_WIDTH - WALL, WALL, ROOM_DEPTH], FLOOR_COLOR, [x, y - ROOM_HEIGHT / 2 + WALL / 2, 0]);
    const ceiling = this.box([ROOM_WIDTH - WALL, WALL, ROOM_DEPTH], FRAME_COLOR, [x, y + ROOM_HEIGHT / 2, 0]);
    const rug = new Mesh(new CylinderGeometry(0.78, 0.78, 0.03, 36), this.material(style.rug));
    rug.position.set(x - 0.15, floorTop + 0.015, 0.15);

    const bearModel = builder.build(bear);
    bearModel.scale.setScalar(BEAR_SCALE);
    bearModel.position.set(x - 0.15, floorTop + 0.62, 0.15);

    this.house.add(backWall, floor, ceiling, rug, ...this.windowAt(x + 0.62, y + 0.25), bearModel);
  }

  private windowAt(x: number, y: number): Mesh[] {
    const z = -ROOM_DEPTH / 2 + WALL / 2 + 0.03;
    return [
      this.box([0.78, 0.78, 0.05], WINDOW_COLOR, [x, y, z]),
      this.box([0.62, 0.62, 0.06], GLASS_COLOR, [x, y, z + 0.01]),
      this.box([0.05, 0.62, 0.07], WINDOW_COLOR, [x, y, z + 0.02]),
      this.box([0.62, 0.05, 0.07], WINDOW_COLOR, [x, y, z + 0.02]),
    ];
  }
}
