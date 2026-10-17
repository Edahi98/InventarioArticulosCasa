import { type BufferGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, TorusGeometry } from "three";
import type { BearTone } from "../../../core/domain/inventoryBear.js";
import { BearBuilder } from "../BearBuilder.js";

export type DriverHat = "gorra" | "marinero" | "capitan" | "lentes" | "ninguno";

const HEAD_SCALE = 0.3;

export class VehicleDriver {
  private static readonly builder = new BearBuilder();
  private static readonly materials = new Map<number, MeshStandardMaterial>();

  /**
   * Osito conductor: la cabeza de los guardianes, a escala de juguete y mirando hacia +x, con su sombrero.
   *
   * @param tone - Color del pelaje.
   * @param hat - Qué lleva puesto.
   * @returns La cabeza lista para ponerla en la cabina; se le puede inclinar para que cabecee.
   */
  static head(tone: BearTone, hat: DriverHat = "ninguno"): Group {
    const holder = new Group();
    const head = this.builder.buildHead(tone);
    const accessories = this.hat(hat);
    if (accessories.length > 0) head.add(...accessories);
    head.rotation.y = Math.PI / 2;
    holder.add(head);
    holder.scale.setScalar(HEAD_SCALE);
    return holder;
  }

  /**
   * @returns Un volante pequeño, inclinado hacia el conductor.
   */
  static wheel(): Group {
    const wheel = new Group();
    const ring = new Mesh(new TorusGeometry(0.05, 0.012, 8, 18), this.material(0x2a2233));
    const hub = new Mesh(new CylinderGeometry(0.012, 0.012, 0.03, 8), this.material(0x2a2233));
    hub.rotation.x = Math.PI / 2;
    wheel.add(ring, hub);
    wheel.rotation.y = Math.PI / 2;
    return wheel;
  }

  private static hat(kind: DriverHat): Mesh[] {
    const dome = (color: number, radius: number, y: number): Mesh => this.mesh(new SphereGeometry(radius, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), color, [0, y, 0]);
    const brim = (color: number, y: number): Mesh => this.mesh(new CylinderGeometry(0.46, 0.5, 0.08, 20), color, [0, y, 0]);
    const builders: Record<DriverHat, () => Mesh[]> = {
      gorra: () => [dome(0xff6b6b, 0.56, 0.35), this.mesh(new CylinderGeometry(0.3, 0.3, 0.04, 14), 0xff6b6b, [0, 0.4, 0.5])],
      marinero: () => [this.mesh(new CylinderGeometry(0.4, 0.46, 0.22, 20), 0xffffff, [0, 0.68, 0]), brim(0x1d3a7a, 0.55)],
      capitan: () => [this.mesh(new CylinderGeometry(0.44, 0.5, 0.26, 20), 0xffffff, [0, 0.7, 0]), brim(0x2a2233, 0.55), this.mesh(new SphereGeometry(0.08, 10, 8), 0xffd43b, [0, 0.68, 0.45])],
      lentes: () => {
        const bridge = this.mesh(new CylinderGeometry(0.02, 0.02, 0.2, 6), 0x2a2233, [0, 0.1, 0.54]);
        bridge.rotation.z = Math.PI / 2;
        return [this.mesh(new SphereGeometry(0.17, 14, 10), 0x2a2233, [-0.22, 0.08, 0.52], [1.2, 0.8, 0.5]), this.mesh(new SphereGeometry(0.17, 14, 10), 0x2a2233, [0.22, 0.08, 0.52], [1.2, 0.8, 0.5]), bridge];
      },
      ninguno: () => [],
    };
    return builders[kind]();
  }

  private static mesh(geometry: BufferGeometry, color: number, at: [number, number, number], scale?: [number, number, number]): Mesh {
    const mesh = new Mesh(geometry, this.material(color));
    mesh.position.set(...at);
    if (scale) mesh.scale.set(...scale);
    return mesh;
  }

  private static material(color: number): MeshStandardMaterial {
    const cached = this.materials.get(color);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness: 0.6 });
    this.materials.set(color, created);
    return created;
  }
}
