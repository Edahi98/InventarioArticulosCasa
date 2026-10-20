import {
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
  type Vector3,
} from "three";
import { BUBBLES_MAX, BUOYS, FLOATING_FLOWERS, SEA_FLOOR_Y, SEA_WATER_Y, SEAGULLS, SHARK_FINS } from "../../../constantes/barrio_constantes.js";
import { SeaTextures } from "../scenes/SeaTextures.js";
import type { SeaSegment } from "./IslandLinks.js";
import { SeededRandom } from "./SeededRandom.js";
import type { IslandCircle } from "./Sparkles.js";
import type { ParticleSystem } from "./ParticleSystem.js";

interface Orbiter {
  group: Group;
  x: number;
  z: number;
  radius: number;
  height: number;
  speed: number;
  phase: number;
}

interface Bubble {
  x: number;
  z: number;
  speed: number;
  phase: number;
}

const FLOWER_COLORS = [0xff9fc8, 0xfffaf2, 0xffd84d, 0xb98cf0] as const;

export class SurfaceLife {
  readonly group = new Group();
  readonly lamps: MeshStandardMaterial[] = [];
  private readonly fins: Orbiter[] = [];
  private readonly gulls: (Orbiter & { wings: [Group, Group] })[] = [];
  private readonly buoys: { group: Group; phase: number }[] = [];
  private readonly leapers: { group: Group; x: number; z: number; heading: number; period: number; phase: number; length: number; height: number; flying: boolean }[] = [];
  private readonly whale = new Group();
  private readonly spout: Mesh;
  private readonly spoutMaterial = new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
  private readonly waves: { mesh: Mesh; material: MeshBasicMaterial; phase: number }[] = [];
  private readonly bubbles: InstancedMesh;
  private readonly bubbleSpots: Bubble[] = [];
  private readonly holder = new Object3D();
  private readonly materials = new Map<number, MeshStandardMaterial>();

  /**
   * Vida en la superficie del mar: olas de espuma que rompen en las orillas, burbujas que suben del fondo, flores y
   * nenúfares flotando cerca de la costa, boyas que se mecen con su luz, aletas de un tiburón amistoso que dan vueltas,
   * gaviotas que planean, delfines que saltan en arco y una ballena que asoma y suelta su chorro, lejos de puentes y
   * rutas de barcos.
   *
   * @param islands - Círculos de las islas.
   * @param segments - Puentes y conexiones, para no poner boyas encima.
   * @param routes - Puntos de las rutas de los barcos, para no estorbarles.
   * @param extent - Radio que abarca todo el archipiélago.
   */
  constructor(islands: IslandCircle[], segments: SeaSegment[], routes: Vector3[], extent: number, private readonly particles: ParticleSystem | null = null) {
    const rng = new SeededRandom("superficie");
    islands.forEach((island) => this.shore(island));
    this.group.add(this.flowers(islands, rng));
    this.bubbles = this.makeBubbles(islands, rng);
    this.group.add(this.bubbles);
    this.placeBuoys(islands, segments, routes, rng);
    for (let index = 0; index < SHARK_FINS; index += 1) {
      const island = islands[index % islands.length] as IslandCircle;
      const fin = new Group();
      const blade = new Mesh(new ConeGeometry(0.22, 0.55, 4), this.material(0x6a7a9a));
      blade.scale.set(1, 1, 0.25);
      blade.position.y = 0.2;
      fin.add(blade);
      this.group.add(fin);
      this.fins.push({ group: fin, x: island.x, z: island.z, radius: island.radius + 5, height: SEA_WATER_Y, speed: 0.06 * (index % 2 === 0 ? 1 : -1), phase: rng.between(0, 6) });
    }
    for (let index = 0; index < SEAGULLS; index += 1) {
      const island = islands[index % islands.length] as IslandCircle;
      const gull = this.gull();
      this.group.add(gull.group);
      this.gulls.push({ ...gull, x: island.x, z: island.z, radius: island.radius * rng.between(0.5, 0.9), height: rng.between(6, 9), speed: rng.between(0.15, 0.25) * (index % 2 === 0 ? 1 : -1), phase: rng.between(0, 6) });
    }
    [0, 1].forEach((index) => {
      const dolphin = this.dolphin();
      const angle = rng.between(0, Math.PI * 2);
      const distance = extent + 9 + index * 3;
      this.group.add(dolphin);
      this.leapers.push({ group: dolphin, x: Math.cos(angle) * distance, z: Math.sin(angle) * distance, heading: angle + Math.PI / 2, period: 6 + index * 2, phase: index * 2.5, length: 3, height: 1.4, flying: false });
    });
    this.whale.add(...this.whaleBody());
    this.spout = new Mesh(new ConeGeometry(0.5, 1.6, 10, 1, true), this.spoutMaterial);
    this.spout.rotation.x = Math.PI;
    this.spout.position.set(0.9, 1.4, 0);
    this.whale.add(this.spout);
    const angle = rng.between(0, Math.PI * 2);
    this.whale.position.set(Math.cos(angle) * (extent + 15), SEA_WATER_Y, Math.sin(angle) * (extent + 15));
    this.whale.rotation.y = -angle + Math.PI / 2;
    this.group.add(this.whale);
    this.update(0, 0, false);
  }

  /**
   * Anima olas, burbujas, boyas, aletas, gaviotas, delfines y ballena; las luces de las boyas se encienden de noche.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.waves.forEach((wave) => {
      const cycle = moving ? ((t * 0.25 + wave.phase) % 1) : 0.4;
      wave.mesh.scale.setScalar(1 + cycle * 0.05);
      wave.material.opacity = Math.sin(cycle * Math.PI) * 0.6;
    });
    this.bubbleSpots.forEach((bubble, index) => {
      const rise = moving ? (t * bubble.speed + bubble.phase) % 1 : bubble.phase;
      this.holder.position.set(bubble.x + Math.sin(t * 2 + index) * 0.1, SEA_FLOOR_Y + rise * (SEA_WATER_Y - SEA_FLOOR_Y), bubble.z);
      this.holder.scale.setScalar(0.06 + rise * 0.08);
      this.holder.rotation.set(0, 0, 0);
      this.holder.updateMatrix();
      this.bubbles.setMatrixAt(index, this.holder.matrix);
    });
    this.bubbles.instanceMatrix.needsUpdate = true;
    this.buoys.forEach((buoy) => {
      buoy.group.position.y = SEA_WATER_Y + Math.sin(t * 1.3 + buoy.phase) * 0.06;
      buoy.group.rotation.z = Math.sin(t * 1.1 + buoy.phase) * 0.1;
    });
    const blink = !moving || Math.sin(t * 3) > 0.3;
    this.lamps.forEach((lamp) => {
      lamp.emissiveIntensity = blink ? 0.4 + night * 2 : 0.15;
    });
    this.fins.forEach((fin) => {
      const angle = fin.phase + t * fin.speed;
      fin.group.position.set(fin.x + Math.cos(angle) * fin.radius, fin.height, fin.z + Math.sin(angle) * fin.radius);
      fin.group.rotation.y = -angle;
    });
    this.gulls.forEach((gull) => {
      const angle = gull.phase + t * gull.speed;
      gull.group.position.set(gull.x + Math.cos(angle) * gull.radius, gull.height + Math.sin(t + gull.phase) * 0.4, gull.z + Math.sin(angle) * gull.radius);
      gull.group.rotation.y = -angle + (gull.speed > 0 ? 0 : Math.PI);
      const flap = Math.sin(t * 5 + gull.phase) * 0.4;
      gull.wings[0].rotation.x = flap;
      gull.wings[1].rotation.x = -flap;
    });
    this.leapers.forEach((leaper) => {
      const cycle = moving ? ((t + leaper.phase) % leaper.period) / leaper.period : 0.9;
      const jump = cycle / 0.3;
      const flying = jump < 1;
      if (moving && leaper.flying !== flying) this.particles?.burst("espuma", leaper.group.position, 14, 0.3);
      leaper.flying = flying;
      leaper.group.visible = flying;
      const travel = (jump - 0.5) * leaper.length;
      leaper.group.position.set(leaper.x + Math.cos(leaper.heading) * travel, SEA_WATER_Y - 0.2 + Math.sin(Math.min(jump, 1) * Math.PI) * leaper.height, leaper.z + Math.sin(leaper.heading) * travel);
      leaper.group.rotation.set(0, -leaper.heading, -(jump - 0.5) * 2);
    });
    const breath = moving ? (t * 0.08) % 1 : 0.5;
    this.whale.position.y = SEA_WATER_Y - 0.55 + Math.sin(breath * Math.PI * 2) * 0.35;
    const puff = Math.max(0, Math.sin(breath * Math.PI * 2));
    this.spoutMaterial.opacity = moving ? puff * 0.55 : 0;
    this.spout.scale.set(1, 0.4 + puff, 1);
  }

  private material(color: number): MeshStandardMaterial {
    const cached = this.materials.get(color);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness: 0.5, map: SeaTextures.speckle() });
    this.materials.set(color, created);
    return created;
  }

  private shore(island: IslandCircle): void {
    [0, 0.5].forEach((phase) => {
      const material = new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
      const mesh = new Mesh(new TorusGeometry(island.radius * 0.99, 0.12, 6, 72), material);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.set(island.x, SEA_WATER_Y + 0.04, island.z);
      this.group.add(mesh);
      this.waves.push({ mesh, material, phase });
    });
  }

  private flowers(islands: IslandCircle[], rng: SeededRandom): InstancedMesh {
    const mesh = new InstancedMesh(new SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new MeshStandardMaterial({ roughness: 0.5, map: SeaTextures.speckle() }), FLOATING_FLOWERS);
    for (let index = 0; index < FLOATING_FLOWERS; index += 1) {
      const island = islands[index % islands.length] as IslandCircle;
      const angle = rng.between(0, Math.PI * 2);
      const distance = island.radius + rng.between(0.4, 1.3);
      const pad = index % 3 !== 0;
      this.holder.position.set(island.x + Math.cos(angle) * distance, SEA_WATER_Y + 0.01, island.z + Math.sin(angle) * distance);
      this.holder.rotation.set(0, rng.between(0, Math.PI * 2), 0);
      this.holder.scale.set(pad ? 0.3 : 0.12, pad ? 0.02 : 0.08, pad ? 0.3 : 0.12);
      this.holder.updateMatrix();
      mesh.setMatrixAt(index, this.holder.matrix);
      mesh.setColorAt(index, new Color(pad ? 0x7fc96a : (FLOWER_COLORS[index % FLOWER_COLORS.length] as number)));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return mesh;
  }

  private makeBubbles(islands: IslandCircle[], rng: SeededRandom): InstancedMesh {
    const mesh = new InstancedMesh(new SphereGeometry(1, 8, 6), new MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, roughness: 0.1 }), BUBBLES_MAX);
    for (let index = 0; index < BUBBLES_MAX; index += 1) {
      const island = islands[index % islands.length] as IslandCircle;
      const angle = rng.between(0, Math.PI * 2);
      const distance = island.radius * rng.between(1.5, 1.8);
      this.bubbleSpots.push({ x: island.x + Math.cos(angle) * distance, z: island.z + Math.sin(angle) * distance, speed: rng.between(0.08, 0.16), phase: rng.between(0, 1) });
    }
    mesh.frustumCulled = false;
    return mesh;
  }

  private placeBuoys(islands: IslandCircle[], segments: SeaSegment[], routes: Vector3[], rng: SeededRandom): void {
    const far = (x: number, z: number): boolean =>
      segments.every((segment) => {
        const dx = segment.to.x - segment.from.x;
        const dz = segment.to.z - segment.from.z;
        const length = dx * dx + dz * dz;
        const t = length === 0 ? 0 : Math.min(Math.max(((x - segment.from.x) * dx + (z - segment.from.z) * dz) / length, 0), 1);
        return Math.hypot(x - (segment.from.x + dx * t), z - (segment.from.z + dz * t)) > 2.5;
      }) && routes.every((point) => Math.hypot(point.x - x, point.z - z) > 2);
    for (let attempt = 0; attempt < BUOYS * 12 && this.buoys.length < BUOYS; attempt += 1) {
      const island = islands[attempt % islands.length] as IslandCircle;
      const angle = rng.between(0, Math.PI * 2);
      const x = island.x + Math.cos(angle) * (island.radius + 3);
      const z = island.z + Math.sin(angle) * (island.radius + 3);
      if (!far(x, z)) continue;
      const buoy = new Group();
      const body = new Mesh(new CylinderGeometry(0.16, 0.24, 0.5, 12), this.material(this.buoys.length % 2 === 0 ? 0xff4f5b : 0x4fe08a));
      body.position.y = 0.15;
      const band = new Mesh(new TorusGeometry(0.2, 0.04, 6, 14), this.material(0xfffaf2));
      band.rotation.x = Math.PI / 2;
      band.position.y = 0.2;
      const light = new MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffd84d, emissiveIntensity: 0.4 });
      this.lamps.push(light);
      const bulb = new Mesh(new SphereGeometry(0.08, 10, 8), light);
      bulb.position.y = 0.5;
      buoy.add(body, band, bulb);
      buoy.position.set(x, SEA_WATER_Y, z);
      this.group.add(buoy);
      this.buoys.push({ group: buoy, phase: rng.between(0, 6) });
    }
  }

  private gull(): { group: Group; wings: [Group, Group] } {
    const group = new Group();
    const body = new Mesh(new SphereGeometry(0.12, 10, 8), this.material(0xffffff));
    body.scale.set(1, 0.8, 1.8);
    const beak = new Mesh(new ConeGeometry(0.03, 0.1, 6), this.material(0xffb066));
    beak.rotation.x = Math.PI / 2;
    beak.position.z = 0.25;
    group.add(body, beak);
    const wings = [-1, 1].map((side) => {
      const pivot = new Group();
      const wing = new Mesh(new SphereGeometry(0.2, 8, 6), this.material(0xe6ebf2));
      wing.scale.set(1.6, 0.12, 0.6);
      wing.position.x = side * 0.3;
      pivot.add(wing);
      group.add(pivot);
      return pivot;
    }) as [Group, Group];
    group.scale.setScalar(1.6);
    return { group, wings };
  }

  private dolphin(): Group {
    const group = new Group();
    const skin = this.material(0x7fa8d8);
    const body = new Mesh(new SphereGeometry(0.5, 16, 10), skin);
    body.scale.set(1.6, 0.55, 0.5);
    const snout = new Mesh(new ConeGeometry(0.12, 0.35, 10), skin);
    snout.rotation.z = -Math.PI / 2;
    snout.position.x = 0.9;
    const fin = new Mesh(new ConeGeometry(0.15, 0.3, 4), skin);
    fin.scale.z = 0.3;
    fin.position.y = 0.3;
    const tail = new Mesh(new ConeGeometry(0.25, 0.3, 4), skin);
    tail.rotation.z = Math.PI / 2;
    tail.scale.z = 0.25;
    tail.position.x = -0.85;
    const belly = new Mesh(new SphereGeometry(0.4, 12, 8), this.material(0xf0f4fa));
    belly.scale.set(1.5, 0.35, 0.42);
    belly.position.y = -0.08;
    group.add(body, snout, fin, tail, belly);
    group.scale.setScalar(1.3);
    return group;
  }

  private whaleBody(): Mesh[] {
    const skin = this.material(0x5a7ab8);
    const body = new Mesh(new SphereGeometry(1.6, 20, 14), skin);
    body.scale.set(1.8, 0.7, 0.9);
    const belly = new Mesh(new SphereGeometry(1.4, 16, 10), this.material(0xdfe8f5));
    belly.scale.set(1.7, 0.45, 0.8);
    belly.position.y = -0.35;
    const tail = new Mesh(new ConeGeometry(0.9, 0.9, 4), skin);
    tail.rotation.z = Math.PI / 2;
    tail.scale.set(1, 1, 0.25);
    tail.position.set(-3, 0.3, 0);
    const eyes = [-1, 1].map((side) => {
      const eye = new Mesh(new SphereGeometry(0.1, 8, 6), this.material(0x2a2233));
      eye.position.set(2.1, 0.2, side * 0.95);
      return eye;
    });
    return [body, belly, tail, ...eyes];
  }
}
