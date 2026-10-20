import {
  CapsuleGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
  type BufferGeometry,
  type Curve,
} from "three";
import { PETS_PER_ISLAND } from "../../../constantes/barrio_constantes.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { RoadBuilder } from "./RoadBuilder.js";
import { SeededRandom } from "./SeededRandom.js";

type PetKind = "perro" | "gato" | "conejo";
type Vec3 = [number, number, number];

interface Pet {
  kind: PetKind;
  group: Group;
  body: Group;
  legs: Group[];
  tail: Group;
  curve: Curve<Vector3>;
  length: number;
  offset: number;
  start: number;
  speed: number;
  phase: number;
}

const KINDS: PetKind[] = ["perro", "gato", "conejo", "perro"];
const COATS: Record<PetKind, readonly number[]> = {
  perro: [0xe0b07a, 0xfffaf2, 0x8a6a5a],
  gato: [0xffb066, 0x9a9aa8, 0x3a2a40],
  conejo: [0xfffaf2, 0xd8cbe8, 0xc9a98a],
};
const DARK = 0x2a2233;
const PINK = 0xff9db1;

export class PetAnimals {
  readonly group = new Group();
  private readonly pets: Pet[] = [];
  private readonly materials = new Map<number, MeshStandardMaterial>();

  /**
   * Mascotas de juguete que pasean por la orilla de cada calle: perritos de orejas caídas con collar que menean la
   * cola, gatitos de cola larga y curva y conejitos que van dando saltitos.
   *
   * @param roads - Curvas de las calles de cada isla.
   * @param roadWidth - Ancho de la calle, para caminar por fuera de ella.
   */
  constructor(roads: Curve<Vector3>[], roadWidth: number) {
    const rng = new SeededRandom("mascotas");
    roads.forEach((curve) => {
      for (let index = 0; index < PETS_PER_ISLAND; index += 1) {
        const kind = KINDS[index % KINDS.length] as PetKind;
        const coat = rng.pick(COATS[kind]);
        const built = this.animal(kind, coat);
        this.group.add(built.group);
        this.pets.push({
          kind,
          ...built,
          curve,
          length: curve.getLength(),
          offset: (rng.chance(0.5) ? 1 : -1) * (roadWidth / 2 + rng.between(0.3, 0.38)),
          start: rng.between(0, 1),
          speed: kind === "conejo" ? rng.between(0.25, 0.35) : rng.between(0.18, 0.3),
          phase: rng.between(0, Math.PI * 2),
        });
      }
    });
    this.update(0, 0, false);
  }

  /**
   * Hace caminar a las mascotas por la orilla de la calle: mueven las patas y la cola, y los conejos saltan.
   *
   * @param elapsed - Segundos transcurridos.
   * @param _night - Qué tan de noche es (no cambia nada).
   * @param moving - Si es `false` quedan quietas (movimiento reducido).
   */
  update(elapsed: number, _night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.pets.forEach((pet) => {
      const at = pet.start + (t * pet.speed) / pet.length;
      const { point, tangent, normal } = RoadBuilder.frame(pet.curve, at);
      pet.group.position.set(point.x + normal.x * pet.offset, 0.06, point.z + normal.z * pet.offset);
      pet.group.rotation.y = Math.atan2(tangent.x, tangent.z);
      const step = t * 9 + pet.phase;
      const hop = pet.kind === "conejo" ? Math.max(0, Math.sin(step * 0.6)) * 0.12 : Math.abs(Math.sin(step)) * 0.015;
      pet.body.position.y = hop;
      pet.legs.forEach((leg, index) => {
        leg.rotation.x = pet.kind === "conejo" ? Math.sin(step * 0.6) * 0.4 : Math.sin(step + (index % 2) * Math.PI) * 0.5;
      });
      pet.tail.rotation.y = Math.sin(t * (pet.kind === "perro" ? 14 : 3) + pet.phase) * 0.5;
    });
  }

  private material(color: number): MeshStandardMaterial {
    const cached = this.materials.get(color);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness: 0.8, map: SurfaceTextures.fur(), bumpMap: SurfaceTextures.fur(), bumpScale: 0.6 });
    this.materials.set(color, created);
    return created;
  }

  private add(parent: Group, geometry: BufferGeometry, color: number, at: Vec3, scale: Vec3 = [1, 1, 1]): Mesh {
    const mesh = new Mesh(geometry, this.material(color));
    mesh.position.set(...at);
    mesh.scale.set(...scale);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  private animal(kind: PetKind, coat: number): { group: Group; body: Group; legs: Group[]; tail: Group } {
    const group = new Group();
    const body = new Group();
    group.add(body);
    const rabbit = kind === "conejo";
    const legLength = rabbit ? 0.05 : 0.1;
    this.add(body, new SphereGeometry(0.1, 16, 12), coat, [0, legLength + 0.08, 0], rabbit ? [1, 1, 1.2] : [0.85, 0.8, 1.5]);
    const head = new Group();
    head.position.set(0, legLength + (rabbit ? 0.17 : 0.16), rabbit ? 0.1 : 0.15);
    body.add(head);
    this.add(head, new SphereGeometry(0.075, 16, 12), coat, [0, 0, 0]);
    [-1, 1].forEach((side) => {
      this.add(head, new SphereGeometry(0.012, 8, 6), DARK, [side * 0.03, 0.015, 0.065]);
      const ears: Record<PetKind, () => void> = {
        perro: () => {
          this.add(head, new SphereGeometry(0.035, 10, 8), coat === 0xfffaf2 ? 0xe0b07a : DARK, [side * 0.065, -0.005, -0.005], [0.5, 1.3, 0.9]);
        },
        gato: () => {
          this.add(head, new ConeGeometry(0.03, 0.06, 8), coat, [side * 0.045, 0.07, 0]).rotation.z = -side * 0.3;
        },
        conejo: () => {
          const ear = this.add(head, new CapsuleGeometry(0.018, 0.1, 4, 8), coat, [side * 0.025, 0.11, -0.01]);
          ear.rotation.z = -side * 0.15;
          this.add(head, new CapsuleGeometry(0.009, 0.08, 4, 6), PINK, [side * 0.025, 0.11, 0.006]).rotation.z = -side * 0.15;
        },
      };
      ears[kind]();
    });
    this.add(head, new SphereGeometry(kind === "perro" ? 0.035 : 0.025, 12, 10), kind === "perro" ? 0xfffaf2 : coat, [0, -0.025, 0.06], [1, 0.8, 1]);
    this.add(head, new SphereGeometry(0.012, 8, 6), kind === "gato" ? PINK : DARK, [0, -0.01, kind === "perro" ? 0.095 : 0.083]);
    if (kind === "perro") this.add(head, new TorusGeometry(0.05, 0.01, 6, 16), 0xff4f5b, [0, -0.06, -0.02]).rotation.x = Math.PI / 2;
    const legs = [-1, 1].flatMap((side) =>
      [-1, 1].map((end) => {
        const hip = new Group();
        hip.position.set(side * 0.045, legLength + 0.04, end * (rabbit ? 0.05 : 0.08));
        this.add(hip, new CapsuleGeometry(0.018, legLength, 4, 8), coat, [0, -legLength / 2 - 0.01, 0]);
        body.add(hip);
        return hip;
      }),
    );
    const tail = new Group();
    tail.position.set(0, legLength + 0.1, rabbit ? -0.11 : -0.14);
    body.add(tail);
    const tails: Record<PetKind, () => void> = {
      perro: () => {
        this.add(tail, new CapsuleGeometry(0.014, 0.08, 4, 6), coat, [0, 0.04, -0.02]).rotation.x = -0.7;
      },
      gato: () => {
        const curve = new CatmullRomCurve3([new Vector3(0, 0, 0), new Vector3(0, 0.08, -0.06), new Vector3(0, 0.16, -0.04), new Vector3(0, 0.2, 0.02)]);
        tail.add(Object.assign(new Mesh(new TubeGeometry(curve, 12, 0.013, 6), this.material(coat)), { castShadow: true }));
      },
      conejo: () => {
        this.add(tail, new SphereGeometry(0.035, 10, 8), 0xfffaf2, [0, 0, 0]);
      },
    };
    tails[kind]();
    group.scale.setScalar(1.6);
    return { group, body, legs, tail };
  }
}
