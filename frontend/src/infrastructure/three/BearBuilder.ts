import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type BufferGeometry,
} from "three";
import type { BearProp, BearTone, InventoryBear } from "../../core/domain/inventoryBear.js";
import { BearSymbolBuilder } from "./BearSymbolBuilder.js";

const FUR_COLORS: Record<BearTone, number> = {
  sky: 0x7fd0ea,
  rose: 0xff8fb7,
  lilac: 0xb89cf2,
  sun: 0xffe35c,
};

const MUZZLE_COLOR = 0xfffaf2;
const FEATURE_COLOR = 0x2a2233;
const BLUSH_COLOR = 0xff9db1;
const SPARKLE_COLOR = 0xffffff;
const PROP_COLOR = 0xfffaf2;
const PROP_ACCENT = 0x5a3d57;

export interface BearRig {
  root: Group;
  head: Group;
  arms: [Group, Group];
}

export class BearBuilder {
  private readonly symbols = new BearSymbolBuilder();

  /**
   * Arma un oso de peluche con el símbolo de su categoría en la panza y el objeto a sus pies.
   *
   * @param bear - Categoría que representa el oso.
   * @returns Grupo con el oso centrado en el origen y los pies en y = -0.8.
   */
  build(bear: InventoryBear): Group {
    const rig = this.rig(bear);
    rig.root.add(this.prop(bear.prop));
    return rig.root;
  }

  /**
   * Arma un oso con el objeto a sus pies y expone la cabeza y los brazos para animarlos.
   *
   * @param bear - Categoría que representa el oso.
   * @returns El oso con referencias a sus partes móviles.
   */
  rigWithProp(bear: InventoryBear): BearRig {
    const rig = this.rig(bear);
    rig.root.add(this.prop(bear.prop));
    return rig;
  }

  /**
   * Arma un oso sin objeto y expone la cabeza y los brazos para animarlos.
   *
   * @param bear - Categoría que representa el oso.
   * @returns El oso con referencias a sus partes móviles.
   */
  rig(bear: InventoryBear): BearRig {
    const root = new Group();
    const fur = this.material(FUR_COLORS[bear.tone]);
    const head = this.head(bear.tone);
    const [leftArm, rightArm] = this.arms(fur);

    root.add(this.body(fur), this.belly(bear), head, leftArm, rightArm, ...this.feet(fur));
    return { root, head, arms: [leftArm, rightArm] };
  }

  /**
   * Arma solo la cabeza del oso, centrada en el origen (para iconos).
   *
   * @param tone - Color del pelaje.
   * @returns Grupo con la cabeza lista para renderizar.
   */
  buildHead(tone: BearTone): Group {
    const head = this.head(tone);
    head.position.set(0, 0, 0);
    return head;
  }

  private material(color: number): MeshStandardMaterial {
    return new MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.02 });
  }

  private mesh(
    geometry: BufferGeometry,
    material: MeshStandardMaterial,
    position: [number, number, number],
    scale: [number, number, number] = [1, 1, 1],
  ): Mesh {
    const mesh = new Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    return mesh;
  }

  private body(fur: MeshStandardMaterial): Mesh {
    return this.mesh(new SphereGeometry(0.8, 32, 24), fur, [0, 0, 0], [1, 1.05, 0.92]);
  }

  private belly(bear: InventoryBear): Group {
    const group = new Group();
    const lighter = new Color(FUR_COLORS[bear.tone]).lerp(new Color(0xffffff), 0.45);
    const patch = this.mesh(
      new SphereGeometry(0.46, 28, 20),
      this.material(lighter.getHex()),
      [0, 0.1, 0.62],
      [1, 1.05, 0.32],
    );
    const symbol = this.symbols.build(bear.symbol);
    symbol.position.set(0, 0.12, 0.78);
    group.add(patch, symbol);
    return group;
  }

  private head(tone: BearTone): Group {
    const head = new Group();
    head.position.set(0, 1.05, 0.05);
    const fur = this.material(FUR_COLORS[tone]);
    const muzzle = this.material(MUZZLE_COLOR);
    const feature = this.material(FEATURE_COLOR);
    const blush = this.material(BLUSH_COLOR);
    const white = this.material(SPARKLE_COLOR);
    const ear = new SphereGeometry(0.22, 20, 16);
    const innerEar = new SphereGeometry(0.13, 16, 12);
    const cheek = new SphereGeometry(0.1, 16, 12);
    const eye = new SphereGeometry(0.075, 16, 12);
    const sparkle = new SphereGeometry(0.024, 10, 8);
    const tuft = new SphereGeometry(0.1, 14, 12);

    head.add(
      this.mesh(new SphereGeometry(0.58, 32, 24), fur, [0, 0, 0]),
      this.mesh(ear, fur, [-0.4, 0.46, -0.02]),
      this.mesh(ear, fur, [0.4, 0.46, -0.02]),
      this.mesh(innerEar, blush, [-0.4, 0.46, 0.15], [1, 1, 0.6]),
      this.mesh(innerEar, blush, [0.4, 0.46, 0.15], [1, 1, 0.6]),
      this.mesh(tuft, fur, [0.02, 0.6, 0.16], [0.9, 1.2, 0.9]),
      this.mesh(tuft, fur, [0.1, 0.66, 0.14], [0.7, 0.9, 0.7]),
      this.mesh(new SphereGeometry(0.24, 24, 18), muzzle, [0, -0.12, 0.46], [1.1, 0.85, 0.8]),
      this.mesh(new SphereGeometry(0.075, 16, 12), feature, [0, -0.03, 0.66]),
      this.mesh(cheek, blush, [-0.36, -0.1, 0.43], [1.15, 0.7, 0.5]),
      this.mesh(cheek, blush, [0.36, -0.1, 0.43], [1.15, 0.7, 0.5]),
      this.mesh(eye, feature, [-0.22, 0.04, 0.5]),
      this.mesh(eye, feature, [0.22, 0.04, 0.5]),
      this.mesh(sparkle, white, [-0.19, 0.08, 0.555]),
      this.mesh(sparkle, white, [0.25, 0.08, 0.555]),
    );
    return head;
  }

  private arms(fur: MeshStandardMaterial): [Group, Group] {
    const geometry = new SphereGeometry(0.22, 20, 16);
    const hanging = (side: number): Vector3 => new Vector3(side * 0.25, -0.9, 0.3).normalize();
    const arm = (side: number): Group => {
      const shoulder = new Group();
      shoulder.position.set(side * 0.62, 0.5, 0.3);
      shoulder.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), hanging(side));
      shoulder.add(this.mesh(geometry, fur, [0, 0.43, 0], [1, 1.95, 1]));
      return shoulder;
    };
    return [arm(-1), arm(1)];
  }

  private feet(fur: MeshStandardMaterial): Mesh[] {
    const foot = new SphereGeometry(0.28, 20, 16);
    return [
      this.mesh(foot, fur, [-0.4, -0.78, 0.3], [1, 0.8, 1.2]),
      this.mesh(foot, fur, [0.4, -0.78, 0.3], [1, 0.8, 1.2]),
    ];
  }

  private prop(kind: BearProp): Group {
    const group = new Group();
    group.position.set(0, -0.5, 0.82);
    group.scale.setScalar(0.75);
    const accent = this.material(PROP_ACCENT);
    const light = this.material(PROP_COLOR);
    const builders: Record<BearProp, () => Mesh[]> = {
      pot: () => this.pot(accent, light),
      box: () => this.box(accent, light),
      books: () => this.books(accent, light),
      wrench: () => this.wrench(accent),
    };
    group.add(...builders[kind]());
    return group;
  }

  private pot(accent: MeshStandardMaterial, light: MeshStandardMaterial): Mesh[] {
    const dark = this.material(FEATURE_COLOR);
    const lid = this.mesh(new CylinderGeometry(0.34, 0.34, 0.06, 24), light, [0, 0.2, 0]);
    const knob = this.mesh(new SphereGeometry(0.06, 12, 10), dark, [0, 0.27, 0]);
    const handle = this.mesh(new TorusGeometry(0.34, 0.035, 8, 20), dark, [0, 0, 0]);
    handle.rotation.x = Math.PI / 2;
    return [this.mesh(new CylinderGeometry(0.32, 0.28, 0.4, 24), accent, [0, 0, 0]), lid, knob, handle];
  }

  private box(accent: MeshStandardMaterial, light: MeshStandardMaterial): Mesh[] {
    const tape = this.mesh(new BoxGeometry(0.1, 0.46, 0.5), light, [0, 0.01, 0]);
    return [this.mesh(new BoxGeometry(0.62, 0.44, 0.46), accent, [0, 0, 0]), tape];
  }

  private books(accent: MeshStandardMaterial, light: MeshStandardMaterial): Mesh[] {
    return [
      this.mesh(new BoxGeometry(0.6, 0.12, 0.42), accent, [0, -0.14, 0]),
      this.mesh(new BoxGeometry(0.54, 0.12, 0.4), light, [0.02, -0.02, 0]),
      this.mesh(new BoxGeometry(0.58, 0.12, 0.42), accent, [-0.02, 0.1, 0]),
    ];
  }

  private wrench(accent: MeshStandardMaterial): Mesh[] {
    const handle = this.mesh(new BoxGeometry(0.1, 0.62, 0.08), accent, [-0.04, -0.02, 0]);
    const head = this.mesh(new TorusGeometry(0.13, 0.05, 10, 18), accent, [0.1, 0.34, 0]);
    handle.rotation.z = 0.5;
    return [handle, head];
  }
}
