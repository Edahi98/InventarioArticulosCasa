import { CatmullRomCurve3, CylinderGeometry, ExtrudeGeometry, Group, Mesh, MeshStandardMaterial, Shape, SphereGeometry, TubeGeometry, Vector3 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { TextureCanvas } from "../TextureCanvas.js";
import { CraftMaterials } from "./CraftMaterials.js";

const WATER_Y = -1.35;

export class TreasureIslet {
  /**
   * Islita del tesoro en medio de un circuito de barcos: duna de arena con una X roja pintada, palmera de tronco curvo
   * con hojas y cocos, cofre abierto lleno de monedas que brillan de noche, una pala clavada y una banderita pirata.
   *
   * @param x - Centro en x.
   * @param z - Centro en z.
   * @param radius - Radio de la islita.
   * @returns La islita y el brillo del tesoro (para encenderlo de noche).
   */
  static build(x: number, z: number, radius: number): { group: Group; glow: MeshStandardMaterial } {
    const group = new Group();
    const sand = TextureCanvas.build("arena-tesoro", 128, 128, false, (context, rng, width, height) => {
      context.fillStyle = "#ffe3a8";
      context.fillRect(0, 0, width, height);
      for (let index = 0; index < 500; index += 1) {
        context.fillStyle = rng.chance(0.5) ? "rgba(180,130,70,0.18)" : "rgba(255,255,255,0.5)";
        context.fillRect(rng.between(0, width), rng.between(0, height), 1.5, 1.5);
      }
      context.strokeStyle = "#e8402d";
      context.lineWidth = 9;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(width * 0.6, height * 0.35);
      context.lineTo(width * 0.8, height * 0.6);
      context.moveTo(width * 0.8, height * 0.35);
      context.lineTo(width * 0.6, height * 0.6);
      context.stroke();
    });
    const dune = new Mesh(new SphereGeometry(radius, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), new MeshStandardMaterial({ map: sand, roughness: 0.9 }));
    dune.scale.y = 0.32;
    const trunk = new Mesh(
      new TubeGeometry(new CatmullRomCurve3([new Vector3(-0.2, 0, 0), new Vector3(-0.1, 0.7, 0.1), new Vector3(0.15, 1.3, 0.05), new Vector3(0.35, 1.7, 0)]), 16, 0.07, 8),
      CraftMaterials.wood(0x9a6b52),
    );
    trunk.position.y = radius * 0.3;
    const leaf = new Shape();
    leaf.moveTo(0, 0);
    leaf.quadraticCurveTo(0.35, 0.18, 0.75, 0);
    leaf.quadraticCurveTo(0.35, 0.05, 0, 0);
    const leafGeometry = new ExtrudeGeometry(leaf, { depth: 0.02, bevelEnabled: false });
    const crown = new Group();
    for (let index = 0; index < 6; index += 1) {
      const frond = new Mesh(leafGeometry, CraftMaterials.paint(0x6fbf5a));
      frond.rotation.set(0, (index / 6) * Math.PI * 2, -0.45);
      crown.add(frond);
    }
    [0, 2, 4].forEach((index) => {
      const coconut = new Mesh(new SphereGeometry(0.06, 10, 8), CraftMaterials.wood(0x6b4a3a));
      coconut.position.set(Math.cos(index) * 0.08, -0.05, Math.sin(index) * 0.08);
      crown.add(coconut);
    });
    crown.position.set(0.35, radius * 0.3 + 1.7, 0);
    const glow = new MeshStandardMaterial({ color: 0xffc94d, emissive: 0xffb300, emissiveIntensity: 0.4, roughness: 0.3, metalness: 0.4 });
    const chest = new Mesh(new RoundedBoxGeometry(0.4, 0.22, 0.26, 2, 0.04), CraftMaterials.wood(0x8a4a2a));
    chest.position.set(-0.45, radius * 0.3 + 0.05, 0.25);
    const lid = new Mesh(new RoundedBoxGeometry(0.4, 0.05, 0.26, 2, 0.02), CraftMaterials.wood(0x8a4a2a));
    lid.position.set(-0.45, radius * 0.3 + 0.27, 0.1);
    lid.rotation.x = -1.1;
    const coins = new Mesh(new SphereGeometry(0.17, 14, 10), glow);
    coins.scale.set(1.1, 0.45, 0.7);
    coins.position.set(-0.45, radius * 0.3 + 0.17, 0.25);
    const shovel = new Mesh(new CylinderGeometry(0.015, 0.015, 0.6, 6), CraftMaterials.wood(0xc4805a));
    shovel.position.set(0.5, radius * 0.3 + 0.2, -0.4);
    shovel.rotation.z = 0.3;
    const pole = new Mesh(new CylinderGeometry(0.012, 0.012, 0.7, 5), CraftMaterials.paint(0x3a2a40));
    pole.position.set(-0.7, radius * 0.25 + 0.3, -0.3);
    const banner = new Mesh(new RoundedBoxGeometry(0.22, 0.14, 0.01, 1, 0.005), CraftMaterials.paint(0x1d1622));
    banner.position.set(-0.6, radius * 0.25 + 0.58, -0.3);
    group.add(dune, trunk, crown, chest, lid, coins, shovel, pole, banner);
    group.traverse((part) => {
      part.castShadow = true;
    });
    group.position.set(x, WATER_Y, z);
    return { group, glow };
  }
}
