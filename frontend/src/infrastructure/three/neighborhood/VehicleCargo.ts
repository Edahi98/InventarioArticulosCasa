import { BoxGeometry, ConeGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, TorusGeometry, type BufferGeometry } from "three";
import { SurfaceTextures } from "../SurfaceTextures.js";

const CARDBOARD = 0xd9a066;
const DARK = 0x2a2233;

export class VehicleCargo {
  private static readonly materials = new Map<string, MeshStandardMaterial>();

  /**
   * @returns Una computadora de escritorio: monitor con pantalla encendida, base, teclado y torre.
   */
  static computer(): Group {
    const computer = new Group();
    computer.add(
      this.part(new BoxGeometry(0.3, 0.22, 0.03), DARK, [0, 0.2, 0]),
      this.part(new BoxGeometry(0.26, 0.18, 0.012), 0x7fd0ea, [0, 0.2, 0.02], 0x7fd0ea),
      this.part(new CylinderGeometry(0.025, 0.04, 0.09, 10), 0xc9d1d9, [0, 0.045, 0]),
      this.part(new BoxGeometry(0.26, 0.02, 0.09), 0xfffaf2, [0, 0.01, 0.12]),
      this.part(new BoxGeometry(0.09, 0.2, 0.18), 0xe9e2d6, [0.24, 0.1, 0]),
      this.part(new SphereGeometry(0.012, 8, 6), 0x86d6a8, [0.24, 0.17, 0.095], 0x86d6a8),
    );
    return computer;
  }

  /**
   * @returns Una laptop abierta con la pantalla encendida.
   */
  static laptop(): Group {
    const laptop = new Group();
    const lid = this.part(new BoxGeometry(0.28, 0.2, 0.015), DARK, [0, 0.12, -0.09]);
    lid.rotation.x = -0.25;
    const screen = this.part(new BoxGeometry(0.25, 0.16, 0.008), 0xffe35c, [0, 0.12, -0.082], 0xffe35c);
    screen.rotation.x = -0.25;
    laptop.add(this.part(new BoxGeometry(0.28, 0.02, 0.2), 0xc9d1d9, [0, 0.01, 0]), lid, screen);
    return laptop;
  }

  /**
   * @param color - Color de la cinta; la caja es de cartón.
   * @returns Una caja de cartón cerrada con cinta.
   */
  static crate(color = 0xff8fb7): Group {
    const crate = new Group();
    crate.add(this.part(new BoxGeometry(0.22, 0.18, 0.22), CARDBOARD, [0, 0.09, 0]), this.part(new BoxGeometry(0.05, 0.185, 0.225), color, [0, 0.09, 0]));
    return crate;
  }

  /**
   * @returns Una lámpara de pie con pantalla amarilla que brilla.
   */
  static lamp(): Group {
    const lamp = new Group();
    lamp.add(
      this.part(new CylinderGeometry(0.06, 0.07, 0.025, 12), 0x5a3d57, [0, 0.012, 0]),
      this.part(new CylinderGeometry(0.01, 0.01, 0.3, 8), 0x5a3d57, [0, 0.17, 0]),
      this.part(new ConeGeometry(0.1, 0.11, 14, 1, true), 0xffe35c, [0, 0.35, 0], 0xffd43b),
    );
    return lamp;
  }

  /**
   * @returns Una maceta con una plantita.
   */
  static plant(): Group {
    const plant = new Group();
    plant.add(this.part(new CylinderGeometry(0.07, 0.05, 0.1, 12), 0xc4805a, [0, 0.05, 0]));
    [[0, 0.17, 0, 0.07], [-0.05, 0.13, 0.02, 0.05], [0.05, 0.14, -0.02, 0.05]].forEach(([x, y, z, r]) => plant.add(this.part(new SphereGeometry(r as number, 10, 8), 0x5fb87a, [x as number, y as number, z as number])));
    return plant;
  }

  /**
   * @param color - Color de la maleta.
   * @returns Una maleta con asa y cierres.
   */
  static suitcase(color = 0x7fd0ea): Group {
    const suitcase = new Group();
    const handle = new Mesh(new TorusGeometry(0.05, 0.012, 6, 14, Math.PI), this.material(DARK));
    handle.position.set(0, 0.22, 0);
    suitcase.add(this.part(new BoxGeometry(0.3, 0.2, 0.12), color, [0, 0.1, 0]), this.part(new BoxGeometry(0.04, 0.03, 0.125), 0xffe35c, [-0.08, 0.15, 0]), this.part(new BoxGeometry(0.04, 0.03, 0.125), 0xffe35c, [0.08, 0.15, 0]), handle);
    return suitcase;
  }

  /**
   * @returns Un barril de madera con dos aros.
   */
  static barrel(): Group {
    const barrel = new Group();
    barrel.add(this.part(new CylinderGeometry(0.09, 0.08, 0.2, 14), 0xb57a46, [0, 0.1, 0]), this.part(new CylinderGeometry(0.093, 0.093, 0.015, 14), 0x5a3d57, [0, 0.05, 0]), this.part(new CylinderGeometry(0.093, 0.093, 0.015, 14), 0x5a3d57, [0, 0.15, 0]));
    return barrel;
  }

  /**
   * @returns Un cajón abierto con tres pescados.
   */
  static fishCrate(): Group {
    const crate = new Group();
    crate.add(this.part(new BoxGeometry(0.3, 0.1, 0.2), 0xb57a46, [0, 0.05, 0]));
    [0x7fd0ea, 0xff8fb7, 0xffb066].forEach((color, index) => {
      const fish = this.part(new SphereGeometry(0.06, 10, 8), color, [-0.08 + index * 0.08, 0.12, (index % 2) * 0.04 - 0.02]);
      fish.scale.set(1.6, 0.7, 0.6);
      fish.rotation.y = index * 0.5;
      crate.add(fish);
    });
    return crate;
  }

  /**
   * @param index - Número de la carga, para repartir las piezas.
   * @returns Un grupo con una carga de oficina o de mudanza: computadora, laptop, cajas, lámpara, planta o maleta.
   */
  static pile(index: number): Group {
    const sets: (() => Group)[][] = [
      [() => this.computer(), () => this.crate(0xff8fb7)],
      [() => this.crate(0x7fd0ea), () => this.lamp(), () => this.crate(0xffe35c)],
      [() => this.laptop(), () => this.suitcase(0xb89cf2), () => this.plant()],
    ];
    const pile = new Group();
    (sets[index % sets.length] ?? []).forEach((make, position) => {
      const item = make();
      item.position.set(position * 0.26 - 0.1, position === 1 ? 0.0 : 0, (position % 2) * 0.06);
      pile.add(item);
    });
    return pile;
  }

  private static material(color: number, emissive?: number): MeshStandardMaterial {
    const key = `${color}-${emissive ?? 0}`;
    const cached = this.materials.get(key);
    if (cached) return cached;
    const created = new MeshStandardMaterial({
      color,
      roughness: 0.6,
      map: SurfaceTextures.clay(),
      bumpMap: SurfaceTextures.clay(),
      bumpScale: 0.3,
      ...(emissive === undefined ? {} : { emissive, emissiveIntensity: 0.7 }),
    });
    this.materials.set(key, created);
    return created;
  }

  private static part(geometry: BufferGeometry, color: number, at: [number, number, number], emissive?: number): Mesh {
    const mesh = new Mesh(geometry, this.material(color, emissive));
    mesh.position.set(...at);
    mesh.castShadow = true;
    return mesh;
  }
}
