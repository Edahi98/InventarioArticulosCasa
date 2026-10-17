import { BoxGeometry, Color, Group, Mesh, MeshStandardMaterial, SphereGeometry } from "three";
import { SeededRandom } from "./SeededRandom.js";

interface Bird {
  group: Group;
  wings: [Group, Group];
  radius: number;
  height: number;
  speed: number;
  phase: number;
}

const DAY_CLOUD = new Color(0xffffff);
const NIGHT_CLOUD = new Color(0x6a70c8);
const BIRD = 0x5a3d57;

export class DayLife {
  readonly group = new Group();
  private readonly clouds: Group[] = [];
  private readonly birds: Bird[] = [];
  private readonly cloudMaterial = new MeshStandardMaterial({ color: 0xffffff, roughness: 1, emissive: 0xffe3ee, emissiveIntensity: 0.3 });
  private readonly birdMaterial = new MeshStandardMaterial({ color: BIRD, roughness: 0.8 });
  private readonly span: number;

  /**
   * @param width - Ancho del terreno, para repartir las nubes.
   * @param depth - Fondo del terreno.
   */
  constructor(width: number, depth: number) {
    const rng = new SeededRandom("dia");
    this.span = width + 40;
    for (let index = 0; index < 8; index += 1) {
      const cloud = this.cloud(rng);
      cloud.position.set(-this.span / 2 + (index / 8) * this.span, rng.between(9, 15), -depth / 2 - rng.between(8, 24));
      cloud.userData.home = cloud.position.x;
      this.clouds.push(cloud);
      this.group.add(cloud);
    }
    for (let index = 0; index < 5; index += 1) {
      const bird = this.bird(rng);
      this.birds.push(bird);
      this.group.add(bird.group);
    }
  }

  /**
   * Mueve las nubes y vuela a los pájaros; de noche las nubes se apagan y los pájaros duermen.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const t = moving ? elapsed : 0;
    this.cloudMaterial.color.copy(DAY_CLOUD).lerp(NIGHT_CLOUD, night);
    this.cloudMaterial.emissiveIntensity = 0.3 * (1 - night);
    this.clouds.forEach((cloud, index) => {
      const drift = (cloud.userData.home as number) + t * (0.25 + (index % 3) * 0.1);
      cloud.position.x = ((drift + this.span / 2) % this.span) - this.span / 2;
    });
    const awake = night < 0.55;
    this.birds.forEach((bird) => {
      bird.group.visible = awake;
      if (!awake) return;
      const angle = bird.phase + t * bird.speed;
      bird.group.position.set(Math.cos(angle) * bird.radius, bird.height + Math.sin(t * 1.7 + bird.phase) * 0.3, Math.sin(angle) * bird.radius * 0.6 - 4);
      bird.group.rotation.y = -angle + (bird.speed > 0 ? 0 : Math.PI);
      const flap = Math.sin(t * 9 + bird.phase * 3) * 0.7;
      bird.wings[0].rotation.z = flap;
      bird.wings[1].rotation.z = -flap;
    });
  }

  private cloud(rng: SeededRandom): Group {
    const cloud = new Group();
    [-0.8, 0, 0.8].forEach((offset, part) => {
      const puff = new Mesh(new SphereGeometry(part === 1 ? 0.95 : 0.65, 12, 10), this.cloudMaterial);
      puff.position.set(offset, part === 1 ? 0.18 : 0, 0);
      cloud.add(puff);
    });
    cloud.scale.setScalar(rng.between(1.1, 2));
    return cloud;
  }

  private bird(rng: SeededRandom): Bird {
    const group = new Group();
    const body = new Mesh(new SphereGeometry(0.07, 10, 8), this.birdMaterial);
    body.scale.set(1, 0.8, 1.7);
    const beak = new Mesh(new BoxGeometry(0.03, 0.03, 0.06), new MeshStandardMaterial({ color: 0xffb066 }));
    beak.position.z = 0.15;
    const left = new Mesh(new BoxGeometry(0.3, 0.015, 0.15), this.birdMaterial);
    const right = new Mesh(new BoxGeometry(0.3, 0.015, 0.15), this.birdMaterial);
    left.position.x = -0.15;
    right.position.x = 0.15;
    const leftPivot = new Group();
    const rightPivot = new Group();
    leftPivot.add(left);
    rightPivot.add(right);
    group.add(body, beak, leftPivot, rightPivot);
    group.scale.setScalar(2.4);
    return {
      group,
      wings: [leftPivot, rightPivot],
      radius: rng.between(10, 20),
      height: rng.between(7, 11),
      speed: rng.between(0.12, 0.22) * (rng.chance(0.5) ? 1 : -1),
      phase: rng.between(0, Math.PI * 2),
    };
  }
}
