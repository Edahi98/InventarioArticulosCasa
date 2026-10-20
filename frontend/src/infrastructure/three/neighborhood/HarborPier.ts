import { CylinderGeometry, Group, InstancedMesh, Mesh, MeshStandardMaterial, Object3D, SphereGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { BearTone } from "../../../core/domain/inventoryBear.js";
import { MeshMerger } from "../MeshMerger.js";
import { CraftMaterials } from "./CraftMaterials.js";
import { HarborBoats } from "./HarborBoats.js";
import type { NightLights } from "./NightLights.js";
import { VehicleDriver } from "./VehicleDriver.js";

const LENGTH = 3.4;
const WATER = -1.35;

export class HarborPier {
  readonly group = new Group();
  readonly lamps: MeshStandardMaterial[] = [];
  private readonly boat: Group;
  private readonly rod = new Group();
  private readonly bobber: Mesh;

  /**
   * Muelle de pesca que sale de la orilla de la isla puerto hacia el mar (de frente hacia +x): tablones sobre pilotes,
   * bolardos con cuerda, cajas y redes, farol con halo, un bote de remos amarrado que se mece y un osito pescador
   * sentado en la punta con su caña, cuyo corcho sube y baja en el agua.
   *
   * @param seed - Número para variar al pescador.
   * @param lights - Luces de la noche, para el halo del farol.
   */
  constructor(seed: number, lights: NightLights) {
    const deck = new Group();
    const planks = new InstancedMesh(new RoundedBoxGeometry(0.16, 0.05, 1.0, 1, 0.015), CraftMaterials.wood(0xd29a6a), Math.floor(LENGTH / 0.18));
    const holder = new Object3D();
    for (let index = 0; index < planks.count; index += 1) {
      holder.position.set(index * 0.18 + 0.09, 0.04, 0);
      holder.updateMatrix();
      planks.setMatrixAt(index, holder.matrix);
    }
    planks.instanceMatrix.needsUpdate = true;
    deck.add(planks);
    [0.8, 1.8, 2.9].forEach((x) =>
      [-0.42, 0.42].forEach((z) => {
        const pile = new Mesh(new CylinderGeometry(0.07, 0.08, 1.6, 8), CraftMaterials.wood(0x8a5a42));
        pile.position.set(x, -0.75, z);
        deck.add(pile);
      }),
    );
    const crate = new Mesh(new RoundedBoxGeometry(0.3, 0.26, 0.3, 2, 0.03), CraftMaterials.wood(0xb98060));
    crate.position.set(0.6, 0.2, 0.28);
    const net = new Mesh(new SphereGeometry(0.2, 10, 6), CraftMaterials.rope());
    net.scale.set(1.2, 0.35, 1);
    net.position.set(1.1, 0.1, -0.3);
    const bollard = new Mesh(new CylinderGeometry(0.06, 0.07, 0.2, 10), CraftMaterials.paint(0x3a2a40));
    bollard.position.set(2.2, 0.15, 0.4);
    deck.add(crate, net, bollard);
    const glow = CraftMaterials.lantern();
    this.lamps.push(glow);
    const post = new Mesh(new CylinderGeometry(0.03, 0.03, 1.1, 6), CraftMaterials.paint(0x3a2a40));
    post.position.set(LENGTH - 0.2, 0.6, -0.42);
    const bulb = new Mesh(new SphereGeometry(0.08, 10, 8), glow);
    bulb.position.set(LENGTH - 0.2, 1.2, -0.42);
    const halo = lights.halo(1);
    halo.position.copy(bulb.position);
    this.group.add(MeshMerger.merge(deck), post, bulb, halo);
    this.boat = HarborBoats.build("remos", seed).group;
    this.boat.scale.setScalar(1.2);
    this.boat.position.set(2.3, WATER, 0.95);
    const fisher = VehicleDriver.bear(["sky", "sun", "rose", "lilac"][seed % 4] as BearTone, "marinero", 0.13);
    fisher.group.position.set(LENGTH - 0.25, 0.2, 0.15);
    const pole = new Mesh(new CylinderGeometry(0.008, 0.012, 1.2, 5), CraftMaterials.wood(0x6b4a3a));
    pole.position.y = 0.6;
    this.rod.add(pole);
    this.rod.position.set(LENGTH - 0.1, 0.25, 0.15);
    this.rod.rotation.z = -0.8;
    this.bobber = new Mesh(new SphereGeometry(0.05, 10, 8), CraftMaterials.paint(0xff4f5b));
    this.bobber.position.set(LENGTH + 0.9, WATER + 0.03, 0.15);
    this.group.add(this.boat, fisher.group, this.rod, this.bobber);
  }

  /**
   * Mece el bote, mueve la caña y hace bailar el corcho.
   *
   * @param elapsed - Segundos transcurridos.
   * @param _night - Qué tan de noche es (no cambia nada).
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, _night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.boat.position.y = WATER + Math.sin(t * 1.3) * 0.04;
    this.boat.rotation.z = Math.sin(t * 1.1) * 0.05;
    this.rod.rotation.z = -0.8 + Math.sin(t * 0.7) * 0.06;
    this.bobber.position.y = WATER + 0.03 + Math.max(0, Math.sin(t * 2.3)) * 0.04 - (Math.sin(t * 0.37) > 0.9 ? 0.06 : 0);
  }
}
