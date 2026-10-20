import { ConeGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, Vector3, type CanvasTexture } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { HORSES, VILLAGE_HOUSES } from "../../../constantes/barrio_constantes.js";
import { MeshMerger } from "../MeshMerger.js";
import { TextureCanvas } from "../TextureCanvas.js";
import { Solid } from "../walk/Solid.js";
import { CraftMaterials } from "./CraftMaterials.js";
import { HouseParts } from "./HouseParts.js";
import type { ParticleSystem } from "./ParticleSystem.js";

interface Spot {
  angle: number;
  distance: number;
}

const ROOFS = [0xc4805a, 0xe8502d, 0x8a5a42, 0xb98060] as const;

export class MedievalVillage {
  readonly group = new Group();
  readonly lamps: MeshStandardMaterial[] = [];
  private readonly blades = new Group();
  private readonly horses: { head: Group; tail: Group; phase: number }[] = [];
  private readonly glass = new MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffc46b, emissiveIntensity: 0.4, roughness: 0.4 });
  private readonly forge = new MeshStandardMaterial({ color: 0xff6f3d, emissive: 0xff4f1f, emissiveIntensity: 1.2 });

  /**
   * Pueblito medieval al pie del castillo, repartido en anillo fuera del foso y lejos del camino de entrada: casas de
   * entramado de madera con techos de tejas, un molino con aspas que giran, una herrería con fragua encendida, yunque y
   * chispas, y un establo con caballos que cabecean y menean la cola. Todo lo que estorba es sólido.
   *
   * @param spots - Lugares libres (ángulo y distancia al centro de la isla del castillo).
   * @param particles - Partículas, para las chispas de la herrería y el humo de las chimeneas.
   * @param origin - Centro de la isla en el mundo y su giro, para colocar los chorros de partículas.
   */
  constructor(spots: Spot[], particles: ParticleSystem, origin: { x: number; z: number; turn: number }) {
    this.lamps.push(this.glass, this.forge);
    const world = (spot: Spot, lift: number): Vector3 => {
      const angle = spot.angle - origin.turn;
      return new Vector3(origin.x + Math.cos(angle) * spot.distance, lift, origin.z + Math.sin(angle) * spot.distance);
    };
    spots.forEach((spot, index) => {
      const makers = [() => this.mill(), () => this.smithy(), () => this.stable(), ...Array.from({ length: VILLAGE_HOUSES }, (_, house) => () => this.house(house))];
      const maker = makers[index];
      if (!maker) return;
      const piece = maker();
      piece.position.set(Math.cos(spot.angle) * spot.distance, 0.06, Math.sin(spot.angle) * spot.distance);
      piece.rotation.y = -spot.angle - Math.PI / 2;
      this.group.add(piece);
      if (index === 1) particles.addStream({ kind: "chispa", rate: 8, spread: 0.1, at: () => world(spot, 0.6) });
      if (index >= 3) particles.addStream({ kind: "humo", rate: 1.2, spread: 0.05, at: () => world(spot, 1.9) });
    });
  }

  /**
   * Gira las aspas del molino, hace brillar la fragua y mueve a los caballos.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.blades.rotation.z = t * 0.8;
    this.forge.emissiveIntensity = 1 + (moving ? Math.sin(t * 9) * 0.3 : 0) + night;
    this.horses.forEach((horse) => {
      horse.head.rotation.z = -0.3 + Math.sin(t * 1.2 + horse.phase) * 0.25;
      horse.tail.rotation.x = Math.sin(t * 3 + horse.phase) * 0.4;
    });
  }

  private static timber(): CanvasTexture {
    return TextureCanvas.build("entramado", 128, 128, false, (context, rng, width, height) => {
      context.fillStyle = "#fbf1dc";
      context.fillRect(0, 0, width, height);
      for (let index = 0; index < 200; index += 1) {
        context.fillStyle = `rgba(120,90,60,${rng.between(0.04, 0.1)})`;
        context.fillRect(rng.between(0, width), rng.between(0, height), 2, 2);
      }
      context.fillStyle = "#6b4a3a";
      [0, height / 2 - 4, height - 8].forEach((y) => context.fillRect(0, y, width, 8));
      [0, width / 2 - 4, width - 8].forEach((x) => context.fillRect(x, 0, 8, height));
      context.lineWidth = 6;
      context.strokeStyle = "#6b4a3a";
      context.beginPath();
      context.moveTo(8, 8);
      context.lineTo(width / 2 - 4, height / 2 - 4);
      context.moveTo(width - 8, 8);
      context.lineTo(width / 2 + 4, height / 2 - 4);
      context.stroke();
    });
  }

  private house(index: number): Group {
    const house = new Group();
    const parts = new HouseParts(this.glass, 0xfff6dc);
    const walls = new Mesh(new RoundedBoxGeometry(1.1, 0.9, 0.9, 2, 0.04), new MeshStandardMaterial({ map: MedievalVillage.timber(), roughness: 0.85 }));
    walls.position.y = 0.45;
    const upper = new Mesh(new RoundedBoxGeometry(1.2, 0.5, 1.0, 2, 0.04), new MeshStandardMaterial({ map: MedievalVillage.timber(), roughness: 0.85 }));
    upper.position.y = 1.15;
    house.add(walls, upper, parts.gableRoof(1.35, 1.15, 0.65, 1.4, ROOFS[index % ROOFS.length] as number), parts.window(0.2, 0.2, [-0.25, 0.55, 0.46]), parts.window(0.2, 0.2, [0.25, 1.15, 0.51]));
    const door = new Mesh(new RoundedBoxGeometry(0.24, 0.42, 0.05, 2, 0.08), CraftMaterials.wood(0x6b4a3a));
    door.position.set(0.25, 0.21, 0.46);
    const chimney = parts.box([0.18, 0.5, 0.18], 0xb0a090, [0.32, 1.85, -0.2], 0.03);
    house.add(door, chimney);
    Solid.mark(house, { shape: "box", size: [1.15, 1.6, 0.95], offset: [0, 0.8, 0] });
    house.traverse((part) => {
      part.castShadow = true;
    });
    return MeshMerger.merge(house);
  }

  private mill(): Group {
    const mill = new Group();
    const tower = new Mesh(new CylinderGeometry(0.45, 0.65, 2.2, 14), new MeshStandardMaterial({ map: MedievalVillage.timber(), roughness: 0.85 }));
    tower.position.y = 1.1;
    const cap = new Mesh(new ConeGeometry(0.6, 0.7, 14), CraftMaterials.paint(0xe8502d));
    cap.position.y = 2.55;
    this.blades.position.set(0, 2.1, 0.55);
    for (let arm = 0; arm < 4; arm += 1) {
      const holder = new Group();
      const sail = new Mesh(new RoundedBoxGeometry(0.28, 1.2, 0.04, 1, 0.02), CraftMaterials.wood(0xfff1e0));
      sail.position.y = 0.7;
      holder.add(sail);
      holder.rotation.z = (arm * Math.PI) / 2;
      this.blades.add(holder);
    }
    mill.add(tower, cap, this.blades);
    Solid.mark(mill, { shape: "cylinder", radius: 0.65, height: 2.2, offset: [0, 1.1, 0] });
    return MeshMerger.merge(mill, [this.blades]);
  }

  private smithy(): Group {
    const smithy = new Group();
    const roof = new Mesh(new RoundedBoxGeometry(1.4, 0.08, 1.1, 2, 0.03), CraftMaterials.wood(0x8a5a42));
    roof.position.y = 1.2;
    roof.rotation.x = 0.12;
    smithy.add(roof);
    [-1, 1].forEach((sx) =>
      [-1, 1].forEach((sz) => {
        const post = new Mesh(new CylinderGeometry(0.05, 0.05, 1.2, 6), CraftMaterials.wood(0x6b4a3a));
        post.position.set(sx * 0.6, 0.6, sz * 0.45);
        smithy.add(post);
      }),
    );
    const hearth = new Mesh(new RoundedBoxGeometry(0.5, 0.45, 0.4, 2, 0.06), CraftMaterials.paint(0x8a8a9a));
    hearth.position.set(-0.3, 0.22, -0.2);
    const coals = new Mesh(new SphereGeometry(0.16, 10, 8), this.forge);
    coals.scale.y = 0.4;
    coals.position.set(-0.3, 0.46, -0.2);
    const anvil = new Mesh(new RoundedBoxGeometry(0.3, 0.14, 0.14, 1, 0.03), CraftMaterials.paint(0x3a2a40));
    anvil.position.set(0.3, 0.35, 0.1);
    const stand = new Mesh(new CylinderGeometry(0.08, 0.1, 0.28, 8), CraftMaterials.wood(0x6b4a3a));
    stand.position.set(0.3, 0.14, 0.1);
    smithy.add(hearth, coals, anvil, stand);
    Solid.mark(smithy, { shape: "box", size: [1.3, 1.2, 1.0], offset: [0, 0.6, 0] });
    return MeshMerger.merge(smithy);
  }

  private stable(): Group {
    const stable = new Group();
    const back = new Mesh(new RoundedBoxGeometry(1.6, 0.9, 0.12, 2, 0.04), CraftMaterials.wood(0xb98060));
    back.position.set(0, 0.45, -0.45);
    const roof = new Mesh(new RoundedBoxGeometry(1.7, 0.08, 1.1, 2, 0.03), CraftMaterials.wood(0xe8502d));
    roof.position.y = 1.0;
    roof.rotation.x = -0.15;
    stable.add(back, roof);
    [-0.78, 0, 0.78].forEach((x) => {
      const post = new Mesh(new CylinderGeometry(0.04, 0.04, 1.0, 6), CraftMaterials.wood(0x6b4a3a));
      post.position.set(x, 0.5, 0.45);
      stable.add(post);
    });
    const hay = new Mesh(new SphereGeometry(0.22, 10, 8), CraftMaterials.paint(0xffe58a));
    hay.scale.set(1.2, 0.6, 1);
    hay.position.set(-0.55, 0.13, -0.2);
    stable.add(hay);
    MeshMerger.merge(stable);
    for (let index = 0; index < HORSES; index += 1) stable.add(this.horse(index));
    Solid.mark(stable, { shape: "box", size: [1.6, 1.0, 1.0], offset: [0, 0.5, 0] });
    return stable;
  }

  private horse(index: number): Group {
    const horse = new Group();
    const coat = CraftMaterials.paint(index % 2 === 0 ? 0xc4905a : 0xfffaf2);
    const mane = CraftMaterials.paint(0x6b4a3a);
    const body = new Mesh(new SphereGeometry(0.2, 14, 10), coat);
    body.scale.set(1.6, 0.9, 0.85);
    body.position.y = 0.45;
    horse.add(body);
    [-0.2, 0.2].forEach((x) => [-0.09, 0.09].forEach((z) => {
      const leg = new Mesh(new CylinderGeometry(0.04, 0.035, 0.36, 6), coat);
      leg.position.set(x, 0.18, z);
      horse.add(leg);
    }));
    const head = new Group();
    head.position.set(0.3, 0.58, 0);
    const neck = new Mesh(new CylinderGeometry(0.07, 0.09, 0.3, 8), coat);
    neck.rotation.z = -0.6;
    neck.position.set(0.06, 0.08, 0);
    const skull = new Mesh(new SphereGeometry(0.09, 12, 10), coat);
    skull.scale.set(1.6, 0.9, 0.9);
    skull.position.set(0.2, 0.2, 0);
    const hair = new Mesh(new RoundedBoxGeometry(0.2, 0.06, 0.03, 1, 0.01), mane);
    hair.rotation.z = -0.6;
    hair.position.set(0.04, 0.16, 0);
    head.add(neck, skull, hair);
    const tail = new Group();
    tail.position.set(-0.32, 0.5, 0);
    const strands = new Mesh(new ConeGeometry(0.05, 0.3, 6), mane);
    strands.position.y = -0.15;
    strands.rotation.z = 0.2;
    tail.add(strands);
    horse.add(head, tail);
    horse.position.set(-0.35 + index * 0.7, 0, 0.1);
    horse.rotation.y = Math.PI / 2;
    this.horses.push({ head, tail, phase: index * 1.7 });
    return horse;
  }
}
