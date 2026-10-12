import {
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Shape,
  SphereGeometry,
  TorusGeometry,
  type BufferGeometry,
} from "three";
import type { BearSymbol } from "../../core/domain/inventoryBear.js";

const HEART_COLOR = 0xff4f7b;
const STAR_COLOR = 0xffc933;
const CLOUD_COLOR = 0xffffff;
const RAINBOW_COLORS = [0xff5d73, 0xffd23f, 0x4fd1b0];

export class BearSymbolBuilder {
  /**
   * Arma el símbolo que va sobre la panza del oso.
   *
   * @param symbol - Símbolo de la categoría.
   * @returns Grupo centrado en el origen, de unos 0.5 de ancho, mirando a +z.
   */
  build(symbol: BearSymbol): Group {
    const builders: Record<BearSymbol, () => Group> = {
      heart: () => this.heart(),
      star: () => this.star(),
      rainbow: () => this.rainbow(),
      cloud: () => this.cloud(),
    };
    return builders[symbol]();
  }

  private material(color: number): MeshStandardMaterial {
    return new MeshStandardMaterial({ color, roughness: 0.55, metalness: 0 });
  }

  private extruded(shape: Shape, color: number, scale: number): Group {
    const geometry: BufferGeometry = new ExtrudeGeometry(shape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelSize: 0.05,
      bevelThickness: 0.05,
      bevelSegments: 4,
      curveSegments: 20,
    });
    geometry.translate(0, 0, -0.08);
    const mesh = new Mesh(geometry, this.material(color));
    mesh.scale.setScalar(scale);
    const group = new Group();
    group.add(mesh);
    return group;
  }

  private heart(): Group {
    const shape = new Shape();
    shape.moveTo(0, -0.5);
    shape.bezierCurveTo(-0.15, -0.35, -0.5, -0.1, -0.5, 0.15);
    shape.bezierCurveTo(-0.5, 0.4, -0.2, 0.5, 0, 0.3);
    shape.bezierCurveTo(0.2, 0.5, 0.5, 0.4, 0.5, 0.15);
    shape.bezierCurveTo(0.5, -0.1, 0.15, -0.35, 0, -0.5);
    return this.extruded(shape, HEART_COLOR, 0.5);
  }

  private star(): Group {
    const shape = new Shape();
    for (let point = 0; point < 10; point += 1) {
      const radius = point % 2 === 0 ? 0.5 : 0.24;
      const angle = Math.PI / 2 + (point * Math.PI) / 5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (point === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return this.extruded(shape, STAR_COLOR, 0.5);
  }

  private rainbow(): Group {
    const group = new Group();
    RAINBOW_COLORS.forEach((color, index) => {
      const radius = 0.34 - index * 0.1;
      const arc = new Mesh(new TorusGeometry(radius, 0.055, 10, 28, Math.PI), this.material(color));
      arc.position.y = -0.1;
      arc.scale.z = 0.7;
      group.add(arc);
    });
    return group;
  }

  private cloud(): Group {
    const group = new Group();
    const puffs: Array<[number, number, number]> = [
      [-0.2, -0.04, 0.17],
      [0, 0.06, 0.22],
      [0.21, -0.04, 0.16],
      [0, -0.08, 0.2],
    ];
    puffs.forEach(([x, y, radius]) => {
      const puff = new Mesh(new SphereGeometry(radius, 20, 16), this.material(CLOUD_COLOR));
      puff.position.set(x, y, 0);
      puff.scale.z = 0.5;
      group.add(puff);
    });
    return group;
  }
}
