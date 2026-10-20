import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { CivicParts } from "./CivicParts.js";
import { CraftMaterials } from "./CraftMaterials.js";
import { HouseParts } from "./HouseParts.js";
import type { BuiltShop } from "./ShopFront.js";

const FRAME = 0xfffaf2;
const BODY = 0xb8e4f5;

export class MiniMall {
  /**
   * Centro comercial pequeño de cuento, de frente hacia +z: dos pisos con fachada de vidrio en cuadrícula de marcos
   * blancos (los vidrios brillan de noche), escalinata redonda a la entrada, marquesina con foquitos, letrero
   * luminoso, cúpula rosa con banderitas y macetas grandes a los lados.
   *
   * @returns El centro comercial, su vidrio luminoso y sus medidas.
   */
  static build(): BuiltShop {
    const glass = new MeshStandardMaterial({ color: 0xd8f3ff, emissive: 0xffe6a8, emissiveIntensity: 0.5, roughness: 0.1, metalness: 0.2 });
    const parts = new HouseParts(glass, FRAME);
    const group = new Group();
    const width = 2.6;
    const depth = 1.6;
    const height = 1.9;
    const front = depth / 2 + 0.02;
    group.add(parts.box([width, height + 0.24, depth], BODY, [0, (height + 0.24) / 2, 0]));
    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 5; column += 1) {
        const pane = new Mesh(new RoundedBoxGeometry(0.42, 0.62, 0.04, 2, 0.04), glass);
        pane.position.set(-1.0 + column * 0.5, 0.62 + row * 0.82, front);
        const frame = new Mesh(new RoundedBoxGeometry(0.48, 0.68, 0.03, 2, 0.04), parts.material(FRAME));
        frame.position.set(-1.0 + column * 0.5, 0.62 + row * 0.82, front - 0.012);
        group.add(frame, pane);
      }
    }
    for (let step = 0; step < 3; step += 1) {
      const stair = new Mesh(new CylinderGeometry(0.9 - step * 0.15, 0.92 - step * 0.15, 0.08, 28, 1, false, 0, Math.PI), parts.material(0xf3e3d0));
      stair.rotation.y = -Math.PI / 2;
      stair.position.set(0, 0.04 + step * 0.08, front);
      group.add(stair);
    }
    const canopy = new Mesh(new RoundedBoxGeometry(1.4, 0.07, 0.5, 2, 0.03), parts.material(0xff8fb7));
    canopy.position.set(0, 1.18, front + 0.25);
    group.add(canopy);
    for (let bulb = 0; bulb < 9; bulb += 1) {
      const light = new Mesh(new SphereGeometry(0.03, 8, 6), glass);
      light.position.set(-0.64 + bulb * 0.16, 1.13, front + 0.5);
      group.add(light);
    }
    const sign = CivicParts.sign("Centro comercial", 0xff6f91, 1.7);
    sign.position.set(0, height + 0.42, front + 0.02);
    const glowBand = new Mesh(new RoundedBoxGeometry(1.8, 0.06, 0.04, 2, 0.02), glass);
    glowBand.position.set(0, height + 0.18, front + 0.02);
    const dome = new Mesh(new SphereGeometry(0.6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), parts.roof(0xff9fc8, true));
    dome.position.y = height + 0.24;
    group.add(sign, glowBand, dome);
    [-1, 1].forEach((side) => {
      const pole = new Mesh(new CylinderGeometry(0.015, 0.015, 0.6, 6), CraftMaterials.paint(0x3a2a40));
      pole.position.set(side * 1.1, height + 0.54, 0);
      const flag = new Mesh(new RoundedBoxGeometry(0.22, 0.14, 0.01, 1, 0.004), CraftMaterials.paint(side > 0 ? 0x7fd0ea : 0xffd84d));
      flag.position.set(side * 1.1 + 0.11, height + 0.76, 0);
      const pot = parts.box([0.26, 0.22, 0.26], 0xc4805a, [side * (width / 2 + 0.05), 0.11, front + 0.2], 0.06);
      const tree = new Mesh(new SphereGeometry(0.2, 12, 10), parts.material(0x6fbf5a));
      tree.position.set(side * (width / 2 + 0.05), 0.42, front + 0.2);
      group.add(pole, flag, pot, tree);
    });
    group.traverse((part) => {
      part.castShadow = true;
      part.receiveShadow = true;
    });
    return { group, glass, width: width + 0.3, depth: depth + 0.4, height: height + 0.9 };
  }
}
