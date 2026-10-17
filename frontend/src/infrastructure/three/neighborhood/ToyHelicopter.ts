import { BoxGeometry, CircleGeometry, ConeGeometry, CylinderGeometry, DoubleSide, Group, Mesh, MeshStandardMaterial, SphereGeometry, TorusGeometry, type BufferGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { BearTone } from "../../../core/domain/inventoryBear.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { VehicleCargo } from "./VehicleCargo.js";
import { VehicleDriver, type DriverHat } from "./VehicleDriver.js";

export type HelicopterKind = "carguero" | "rescate" | "reparto";

export interface BuiltHelicopter {
  group: Group;
  rotor: Group;
  tailRotor: Group;
  sling: Group | null;
}

const WHITE = 0xfffaf2;
const DARK = 0x2a2233;
const HATS: Record<HelicopterKind, DriverHat> = { carguero: "gorra", rescate: "capitan", reparto: "lentes" };

export class ToyHelicopter {
  private static readonly materials = new Map<string, MeshStandardMaterial>();

  /**
   * Helicóptero de juguete con un osito piloto. Mira hacia +x. El rotor y el rotor de cola se giran desde fuera
   * (`rotor.rotation.y` y `tailRotor.rotation.z`) y la carga colgante (`sling`) se mece.
   * El carguero lleva una computadora y una caja colgadas de una cuerda; el de rescate, un salvavidas en un
   * cabrestante y barra de luces; el de reparto, cajas a los lados y una laptop sobre el techo.
   *
   * @param color - Color del fuselaje.
   * @param kind - Tipo de helicóptero.
   * @param tone - Color del pelaje del osito piloto.
   * @returns El helicóptero, su rotor, su rotor de cola y su carga colgante (si la lleva).
   */
  static build(color: number, kind: HelicopterKind, tone: BearTone): BuiltHelicopter {
    const group = new Group();
    const body = new Mesh(new RoundedBoxGeometry(0.78, 0.4, 0.46, 3, 0.16), this.material(color));
    body.position.y = 0.3;
    const belly = this.part(new BoxGeometry(0.78, 0.05, 0.47), WHITE, [0, 0.14, 0]);
    const nose = new Mesh(new SphereGeometry(0.24, 16, 12), new MeshStandardMaterial({ color: 0xfff6dc, roughness: 0.2, transparent: true, opacity: 0.5 }));
    nose.position.set(0.3, 0.34, 0);
    nose.scale.set(1.1, 0.95, 1.05);
    group.add(body, belly, nose);

    const head = VehicleDriver.head(tone, HATS[kind]);
    head.position.set(0.3, 0.34, 0);
    head.scale.multiplyScalar(0.95);
    group.add(head);

    const boom = new Mesh(new CylinderGeometry(0.035, 0.09, 0.85, 10), this.material(color));
    boom.rotation.z = Math.PI / 2;
    boom.position.set(-0.78, 0.34, 0);
    const fin = this.part(new BoxGeometry(0.16, 0.26, 0.03), WHITE, [-1.18, 0.46, 0]);
    const stabilizer = this.part(new BoxGeometry(0.1, 0.02, 0.26), WHITE, [-1.14, 0.36, 0]);
    const tailLight = this.part(new SphereGeometry(0.03, 8, 6), 0xff4f6d, [-1.22, 0.58, 0], 0xff4f6d);
    group.add(boom, fin, stabilizer, tailLight);

    const tailRotor = new Group();
    [0, Math.PI / 2].forEach((angle) => {
      const blade = this.part(new BoxGeometry(0.28, 0.025, 0.012), DARK, [0, 0, 0]);
      blade.rotation.z = angle;
      tailRotor.add(blade);
    });
    tailRotor.position.set(-1.2, 0.46, 0.05);
    group.add(tailRotor);

    const mast = this.part(new CylinderGeometry(0.03, 0.04, 0.12, 8), DARK, [-0.05, 0.56, 0]);
    const engine = this.part(new RoundedBoxGeometry(0.34, 0.12, 0.26, 2, 0.05), WHITE, [-0.08, 0.54, 0]);
    const rotor = new Group();
    [0, Math.PI / 2].forEach((angle) => {
      const blade = this.part(new BoxGeometry(1.7, 0.016, 0.085), DARK, [0, 0, 0]);
      blade.rotation.y = angle;
      rotor.add(blade);
    });
    const blur = new Mesh(new CircleGeometry(0.85, 32), new MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, side: DoubleSide, depthWrite: false }));
    blur.rotation.x = -Math.PI / 2;
    rotor.add(blur);
    rotor.position.set(-0.05, 0.63, 0);
    group.add(mast, engine, rotor);

    [-0.17, 0.17].forEach((z) => {
      const skid = new Mesh(new CylinderGeometry(0.018, 0.018, 0.95, 8), this.material(DARK));
      skid.rotation.z = Math.PI / 2;
      skid.position.set(0.02, -0.02, z);
      group.add(skid, this.part(new CylinderGeometry(0.014, 0.014, 0.2, 6), DARK, [0.22, 0.07, z]), this.part(new CylinderGeometry(0.014, 0.014, 0.2, 6), DARK, [-0.18, 0.07, z]));
    });
    group.add(this.part(new SphereGeometry(0.03, 8, 6), 0xffe35c, [0.5, 0.28, 0], 0xffe35c));

    const sling = ToyHelicopter.carry(group, kind, color);
    group.traverse((part) => {
      part.castShadow = true;
    });
    return { group, rotor, tailRotor, sling };
  }

  private static carry(group: Group, kind: HelicopterKind, color: number): Group | null {
    const loads: Record<HelicopterKind, () => Group | null> = {
      carguero: () => {
        const sling = new Group();
        const rope = this.part(new CylinderGeometry(0.006, 0.006, 0.42, 4), WHITE, [0, -0.21, 0]);
        const crate = VehicleCargo.crate(0xff8fb7);
        crate.position.set(-0.1, -0.62, 0);
        const computer = VehicleCargo.computer();
        computer.position.set(0.14, -0.6, 0);
        computer.scale.setScalar(0.8);
        sling.add(rope, crate, computer);
        sling.position.set(0.02, 0.0, 0);
        group.add(sling);
        return sling;
      },
      rescate: () => {
        const sling = new Group();
        const rope = this.part(new CylinderGeometry(0.006, 0.006, 0.5, 4), WHITE, [0, -0.25, 0]);
        const buoy = new Mesh(new TorusGeometry(0.1, 0.035, 8, 18), this.material(0xff4f6d));
        buoy.position.set(0, -0.58, 0);
        sling.add(rope, buoy);
        sling.position.set(0.02, 0.0, 0);
        group.add(sling);
        group.add(this.part(new BoxGeometry(0.28, 0.035, 0.07), 0xff4f6d, [0.02, 0.6, 0], 0xff4f6d));
        return sling;
      },
      reparto: () => {
        [-0.27, 0.27].forEach((z) => {
          const crate = VehicleCargo.crate(color === 0x7fd0ea ? 0xffe35c : 0x7fd0ea);
          crate.position.set(0, 0.04, z);
          crate.scale.setScalar(1.15);
          group.add(crate);
        });
        const laptop = VehicleCargo.laptop();
        laptop.position.set(-0.28, 0.5, 0.0);
        laptop.scale.setScalar(0.7);
        group.add(laptop);
        return null;
      },
    };
    return loads[kind]();
  }

  private static material(color: number, emissive?: number): MeshStandardMaterial {
    const key = `${color}-${emissive ?? 0}`;
    const cached = this.materials.get(key);
    if (cached) return cached;
    const created = new MeshStandardMaterial({
      color,
      roughness: 0.5,
      metalness: 0.05,
      map: SurfaceTextures.clay(),
      bumpMap: SurfaceTextures.clay(),
      bumpScale: 0.3,
      ...(emissive === undefined ? {} : { emissive, emissiveIntensity: 0.8 }),
    });
    this.materials.set(key, created);
    return created;
  }

  private static part(geometry: BufferGeometry, color: number, at: [number, number, number], emissive?: number): Mesh {
    const mesh = new Mesh(geometry, this.material(color, emissive));
    mesh.position.set(...at);
    return mesh;
  }
}
