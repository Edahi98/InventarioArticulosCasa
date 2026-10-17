import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry } from "three";
import { SeededRandom } from "./SeededRandom.js";

type Maker = (x: number, z: number) => Group;

const PAINT = 0xfffaf2;
const WOOD = 0xb06a4a;
const HYDRANT = 0xff4f5b;
const BIN = 0x4fc3b0;
const SIGN = 0x7fd0ea;
const POLE = 0x5a3d57;

export class StreetFurniture {
  private readonly materials = new Map<number, MeshStandardMaterial>();
  private readonly rng = new SeededRandom("mobiliario");

  /**
   * Pasos de cebra, bancas, hidrantes, botes de basura y señales a lo largo de las calles.
   *
   * @param roadsZ - Posición en z del centro de cada calle.
   * @param width - Largo de las calles.
   * @param roadWidth - Ancho de la calle.
   * @returns El mobiliario de todas las calles.
   */
  build(roadsZ: number[], width: number, roadWidth: number): Group {
    const furniture = new Group();
    const makers: Maker[] = [(x, z) => this.bench(x, z), (x, z) => this.hydrant(x, z), (x, z) => this.bin(x, z), (x, z) => this.sign(x, z)];
    roadsZ.forEach((roadZ) => {
      const crossings = [-width * 0.22, width * 0.27];
      crossings.forEach((x) => furniture.add(this.crosswalk(x, roadZ, roadWidth)));
      const slots = Math.max(Math.floor(width / 3.4), 2);
      for (let slot = 0; slot < slots; slot += 1) {
        const x = -width / 2 + (slot + 0.5) * (width / slots) + this.rng.between(-0.3, 0.3);
        if (crossings.some((crossing) => Math.abs(crossing - x) < 0.9)) continue;
        furniture.add(this.rng.pick(makers)(x, roadZ + roadWidth / 2 + 0.12));
      }
    });
    return furniture;
  }

  private material(color: number): MeshStandardMaterial {
    const cached = this.materials.get(color);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness: 0.8 });
    this.materials.set(color, created);
    return created;
  }

  private place(group: Group, x: number, z: number): Group {
    group.position.set(x, 0.12, z);
    group.rotation.y = Math.PI;
    group.traverse((part) => {
      part.castShadow = true;
    });
    return group;
  }

  private crosswalk(x: number, roadZ: number, roadWidth: number): Group {
    const crosswalk = new Group();
    const bars = Math.floor((roadWidth - 0.2) / 0.22);
    for (let index = 0; index < bars; index += 1) {
      const bar = new Mesh(new BoxGeometry(0.55, 0.012, 0.1), this.material(PAINT));
      bar.position.set(x, 0.047, roadZ - (bars - 1) * 0.11 + index * 0.22);
      bar.receiveShadow = true;
      crosswalk.add(bar);
    }
    return crosswalk;
  }

  private bench(x: number, z: number): Group {
    const bench = new Group();
    const seat = new Mesh(new BoxGeometry(0.5, 0.035, 0.16), this.material(WOOD));
    seat.position.y = 0.16;
    const back = new Mesh(new BoxGeometry(0.5, 0.13, 0.03), this.material(WOOD));
    back.position.set(0, 0.25, -0.07);
    bench.add(seat, back);
    [-0.2, 0.2].forEach((leg) => {
      const support = new Mesh(new BoxGeometry(0.03, 0.15, 0.14), this.material(POLE));
      support.position.set(leg, 0.075, 0);
      bench.add(support);
    });
    return this.place(bench, x, z);
  }

  private hydrant(x: number, z: number): Group {
    const hydrant = new Group();
    const body = new Mesh(new CylinderGeometry(0.055, 0.065, 0.22, 10), this.material(HYDRANT));
    body.position.y = 0.11;
    const cap = new Mesh(new SphereGeometry(0.06, 10, 8), this.material(HYDRANT));
    cap.position.y = 0.23;
    hydrant.add(body, cap);
    [-1, 1].forEach((side) => {
      const nub = new Mesh(new CylinderGeometry(0.02, 0.02, 0.06, 8), this.material(PAINT));
      nub.rotation.z = Math.PI / 2;
      nub.position.set(side * 0.07, 0.14, 0);
      hydrant.add(nub);
    });
    return this.place(hydrant, x, z);
  }

  private bin(x: number, z: number): Group {
    const bin = new Group();
    const can = new Mesh(new CylinderGeometry(0.08, 0.065, 0.22, 12), this.material(BIN));
    can.position.y = 0.11;
    const lid = new Mesh(new CylinderGeometry(0.09, 0.09, 0.025, 12), this.material(POLE));
    lid.position.y = 0.235;
    bin.add(can, lid);
    return this.place(bin, x, z);
  }

  private sign(x: number, z: number): Group {
    const sign = new Group();
    const pole = new Mesh(new CylinderGeometry(0.018, 0.018, 0.9, 8), this.material(POLE));
    pole.position.y = 0.45;
    const plate = new Mesh(new BoxGeometry(0.34, 0.1, 0.02), this.material(SIGN));
    plate.position.set(0.1, 0.84, 0.02);
    const stripe = new Mesh(new BoxGeometry(0.28, 0.02, 0.025), this.material(PAINT));
    stripe.position.set(0.1, 0.84, 0.025);
    sign.add(pole, plate, stripe);
    return this.place(sign, x, z);
  }
}
