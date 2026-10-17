import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, type Curve, type Vector3 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoadBuilder } from "./RoadBuilder.js";
import { SeededRandom } from "./SeededRandom.js";

type Maker = () => Group;

const PAINT = 0xfffaf2;
const WOOD = 0xc4805a;
const HYDRANT = 0xff6b78;
const BIN = 0x59c9b6;
const SIGN = 0x7fd0ea;
const POLE = 0x6b4a6a;

export class StreetFurniture {
  private readonly materials = new Map<number, MeshStandardMaterial>();
  private readonly rng = new SeededRandom("mobiliario");

  /**
   * Bancas, hidrantes, botes de basura y señales repartidos a lo largo de la calle, sobre las
   * banquetas y mirando hacia el asfalto.
   *
   * @param curve - Curva cerrada de la calle.
   * @param roadWidth - Ancho de la calle.
   * @param avoid - Posiciones (entre 0 y 1) que se dejan libres, por ejemplo los pasos de cebra.
   * @returns El mobiliario.
   */
  build(curve: Curve<Vector3>, roadWidth: number, avoid: number[]): Group {
    const furniture = new Group();
    const makers: Maker[] = [() => this.bench(), () => this.hydrant(), () => this.bin(), () => this.sign()];
    const count = Math.max(Math.floor(curve.getLength() / 4.2), 4);
    for (let index = 0; index < count; index += 1) {
      const at = (index + 0.5) / count + this.rng.between(-0.012, 0.012);
      if (avoid.some((spot) => Math.abs(spot - at) < 0.025)) continue;
      const side = this.rng.chance(0.5) ? 1 : -1;
      const { point, normal } = RoadBuilder.frame(curve, at);
      const offset = side * (roadWidth / 2 + 0.2);
      const piece = this.rng.pick(makers)();
      piece.position.set(point.x + normal.x * offset, 0.06, point.z + normal.z * offset);
      piece.rotation.y = Math.atan2(-normal.x * side, -normal.z * side);
      piece.traverse((part) => {
        part.castShadow = true;
      });
      furniture.add(piece);
    }
    return furniture;
  }

  private material(color: number): MeshStandardMaterial {
    const cached = this.materials.get(color);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness: 0.7 });
    this.materials.set(color, created);
    return created;
  }

  private bench(): Group {
    const bench = new Group();
    const seat = new Mesh(new RoundedBoxGeometry(0.52, 0.05, 0.18, 2, 0.02), this.material(WOOD));
    seat.position.y = 0.17;
    const back = new Mesh(new RoundedBoxGeometry(0.52, 0.14, 0.04, 2, 0.02), this.material(WOOD));
    back.position.set(0, 0.27, -0.08);
    bench.add(seat, back);
    [-0.21, 0.21].forEach((leg) => {
      const support = new Mesh(new RoundedBoxGeometry(0.04, 0.16, 0.15, 2, 0.015), this.material(POLE));
      support.position.set(leg, 0.08, 0);
      bench.add(support);
    });
    return bench;
  }

  private hydrant(): Group {
    const hydrant = new Group();
    const body = new Mesh(new CylinderGeometry(0.06, 0.07, 0.22, 14), this.material(HYDRANT));
    body.position.y = 0.11;
    const cap = new Mesh(new SphereGeometry(0.066, 14, 10), this.material(HYDRANT));
    cap.position.y = 0.23;
    hydrant.add(body, cap);
    [-1, 1].forEach((side) => {
      const nub = new Mesh(new CylinderGeometry(0.022, 0.022, 0.07, 10), this.material(PAINT));
      nub.rotation.z = Math.PI / 2;
      nub.position.set(side * 0.075, 0.14, 0);
      hydrant.add(nub);
    });
    return hydrant;
  }

  private bin(): Group {
    const bin = new Group();
    const can = new Mesh(new CylinderGeometry(0.085, 0.07, 0.23, 16), this.material(BIN));
    can.position.y = 0.115;
    const lid = new Mesh(new SphereGeometry(0.09, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), this.material(POLE));
    lid.position.y = 0.23;
    lid.scale.y = 0.55;
    bin.add(can, lid);
    return bin;
  }

  private sign(): Group {
    const sign = new Group();
    const pole = new Mesh(new CylinderGeometry(0.02, 0.02, 0.9, 10), this.material(POLE));
    pole.position.y = 0.45;
    const plate = new Mesh(new RoundedBoxGeometry(0.36, 0.11, 0.025, 2, 0.04), this.material(SIGN));
    plate.position.set(0.1, 0.84, 0.02);
    const stripe = new Mesh(new RoundedBoxGeometry(0.28, 0.025, 0.03, 2, 0.012), this.material(PAINT));
    stripe.position.set(0.1, 0.84, 0.03);
    sign.add(pole, plate, stripe);
    return sign;
  }
}
