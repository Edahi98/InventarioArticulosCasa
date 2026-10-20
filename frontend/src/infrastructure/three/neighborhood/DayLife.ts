import { BoxGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry } from "three";
import { CloudPuffs } from "./CloudPuffs.js";
import { SeededRandom } from "./SeededRandom.js";

interface Bird {
  group: Group;
  wings: [Group, Group];
  radius: number;
  height: number;
  speed: number;
  phase: number;
}

const BIRD = 0x5a3d57;

export class DayLife {
  readonly group = new Group();
  private readonly clouds: Group[] = [];
  private readonly birds: Bird[] = [];
  private readonly puffs = new CloudPuffs();
  private readonly birdMaterial = new MeshStandardMaterial({ color: BIRD, roughness: 0.8 });
  private readonly span: number;

  /**
   * @param width - Ancho del terreno, para repartir las nubes.
   * @param depth - Fondo del terreno.
   */
  constructor(width: number, depth: number) {
    const rng = new SeededRandom("dia");
    this.span = width + 40;
    for (let index = 0; index < 10; index += 1) {
      const cloud = new Group();
      cloud.add(this.puffs.build(rng, rng.between(0.9, 1.7)));
      cloud.position.set(-this.span / 2 + (index / 10) * this.span, rng.between(9, 16), (index % 2 === 0 ? -1 : 1) * (depth / 2 + rng.between(6, 22)));
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
    this.puffs.tint(night);
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
