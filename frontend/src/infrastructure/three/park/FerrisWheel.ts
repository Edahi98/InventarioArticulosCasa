import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, TorusGeometry, Vector3 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { BearBuilder } from "../BearBuilder.js";
import { GuardianBear } from "../neighborhood/GuardianBear.js";
import type { ClayMaterials } from "./ClayMaterials.js";
import type { Interactive } from "./ParkInteraction.js";

const CABINS = [0xff8fb7, 0x7fd0ea, 0xffe35c, 0xb89cf2, 0x86d6a8, 0xffb066] as const;
const UP = new Vector3(0, 1, 0);

export class FerrisWheel {
  readonly group = new Group();
  readonly interactives: Interactive[] = [];
  private readonly wheel = new Group();
  private readonly pivots: Group[] = [];
  private readonly riders: { bear: GuardianBear; phase: number }[] = [];
  private readonly bulbsA = new MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffd37a, emissiveIntensity: 0.3 });
  private readonly bulbsB = new MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xff8fb7, emissiveIntensity: 0.3 });
  private angle = 0;
  private boost = 0;
  private last = 0;
  private now = 0;
  private hovered = false;

  /**
   * Rueda de la fortuna: aro rosa con focos que parpadean, rayos y una góndola de colores por asiento, con
   * ositos guardianes asomados que de vez en cuando saludan. Las góndolas se mantienen derechas al girar. Al
   * tocarla gira rápido un momento y al tocar a un osito, saluda.
   *
   * @param bears - Constructor de ositos compartido.
   * @param clay - Materiales compartidos.
   * @param radius - Radio de la rueda.
   * @param cabins - Cuántas góndolas lleva.
   */
  constructor(
    private readonly bears: BearBuilder,
    private readonly clay: ClayMaterials,
    private readonly radius = 5.8,
    private readonly cabins = 8,
  ) {
    const hub = radius + 1.5;
    this.wheel.position.y = hub;
    this.wheel.add(this.rim(), ...this.spokes(), ...this.lights(), this.hubCap());
    for (let index = 0; index < cabins; index += 1) this.wheel.add(this.cabin(index));
    this.wheel.userData.interactiveId = "wheel";
    this.group.add(this.wheel, ...this.legs(hub), this.platform());
    this.interactives.push({
      id: "wheel",
      object: this.wheel,
      hit: () => {
        this.boost = 0.9;
      },
      hover: (on) => {
        this.hovered = on;
      },
    });
  }

  /**
   * Gira la rueda con calma, mantiene las góndolas derechas, hace parpadear los focos y mueve a los ositos.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const dt = Math.min(Math.max(elapsed - this.last, 0), 0.1);
    this.last = elapsed;
    this.now = elapsed;
    this.boost *= Math.exp(-dt * 0.8);
    if (moving) this.angle -= (0.11 + this.boost) * dt;
    this.wheel.rotation.z = this.angle;
    this.pivots.forEach((pivot) => {
      pivot.rotation.z = -this.wheel.rotation.z;
    });
    const t = moving ? elapsed : 0;
    const glow = 0.3 + night * 1.9 + (this.hovered ? 0.7 : 0) + this.boost * 1.4;
    this.bulbsA.emissiveIntensity = glow * (0.55 + 0.45 * Math.sin(t * 3));
    this.bulbsB.emissiveIntensity = glow * (0.55 + 0.45 * Math.sin(t * 3 + Math.PI));
    this.riders.forEach(({ bear, phase }) => bear.update(elapsed, Math.sin(t * 0.32 + phase) > 0.9 ? 1 : 0, moving));
  }

  private rim(): Group {
    const rim = new Group();
    const outer = new Mesh(new TorusGeometry(this.radius, 0.15, 14, 80), this.clay.get(0xff8fb7));
    const inner = new Mesh(new TorusGeometry(this.radius * 0.52, 0.09, 12, 60), this.clay.get(0xb89cf2));
    outer.castShadow = true;
    rim.add(outer, inner);
    return rim;
  }

  private spokes(): Mesh[] {
    return Array.from({ length: this.cabins * 2 }, (_, index) => {
      const spoke = new Mesh(new RoundedBoxGeometry(0.1, this.radius, 0.1, 2, 0.04), this.clay.get(0xfff0d6));
      const angle = (index / (this.cabins * 2)) * Math.PI * 2;
      spoke.position.set(-Math.sin(angle) * this.radius * 0.5, Math.cos(angle) * this.radius * 0.5, 0);
      spoke.rotation.z = angle;
      return spoke;
    });
  }

  private lights(): Mesh[] {
    const geometry = new SphereGeometry(0.1, 10, 8);
    return Array.from({ length: this.cabins * 3 }, (_, index) => {
      const angle = (index / (this.cabins * 3)) * Math.PI * 2;
      const bulb = new Mesh(geometry, index % 2 === 0 ? this.bulbsA : this.bulbsB);
      bulb.position.set(Math.cos(angle) * this.radius, Math.sin(angle) * this.radius, 0.18);
      return bulb;
    });
  }

  private hubCap(): Mesh {
    const cap = new Mesh(new SphereGeometry(0.55, 20, 16), this.clay.get(0xffd37a));
    cap.scale.z = 1.4;
    return cap;
  }

  private cabin(index: number): Group {
    const angle = (index / this.cabins) * Math.PI * 2;
    const pivot = new Group();
    pivot.position.set(Math.cos(angle) * this.radius, Math.sin(angle) * this.radius, 0);
    const pod = new Group();
    pod.position.y = -0.78;
    const color = CABINS[index % CABINS.length] as number;
    const bucket = new Mesh(new RoundedBoxGeometry(1.05, 0.62, 0.9, 3, 0.18), this.clay.get(color));
    const hanger = new Mesh(new CylinderGeometry(0.03, 0.03, 0.78, 6), this.clay.get(0xfff0d6));
    hanger.position.y = 0.62;
    const roof = new Mesh(new SphereGeometry(0.58, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), this.clay.get(color));
    roof.scale.y = 0.55;
    roof.position.y = 0.78;
    [-1, 1].forEach((x) => [-1, 1].forEach((z) => {
      const post = new Mesh(new CylinderGeometry(0.025, 0.025, 0.5, 6), this.clay.get(0xfff0d6));
      post.position.set(x * 0.42, 0.54, z * 0.34);
      pod.add(post);
    }));
    pod.add(bucket, roof);
    pod.traverse((part) => {
      part.castShadow = true;
    });
    if (index % 2 === 0) {
      const bear = new GuardianBear(this.bears, index / 2, 0.27, false);
      bear.group.position.set(0, -0.06, 0.02);
      bear.group.userData.interactiveId = `rueda-${index}`;
      pod.add(bear.group);
      this.riders.push({ bear, phase: index * 1.9 });
      this.interactives.push({ id: `rueda-${index}`, object: bear.group, hit: () => bear.poke(this.now) });
    }
    pivot.add(hanger, pod);
    this.pivots.push(pivot);
    return pivot;
  }

  private beam(from: Vector3, to: Vector3, thickness: number): Mesh {
    const direction = to.clone().sub(from);
    const beam = new Mesh(new RoundedBoxGeometry(thickness, direction.length(), thickness, 2, thickness * 0.4), this.clay.get(0xfff0d6));
    beam.position.copy(from).addScaledVector(direction, 0.5);
    beam.quaternion.setFromUnitVectors(UP, direction.normalize());
    beam.castShadow = true;
    return beam;
  }

  private legs(hub: number): Mesh[] {
    const spread = this.radius * 0.78;
    return [-1, 1].flatMap((side) => [-1, 1].map((depth) => this.beam(new Vector3(0, hub, depth * 0.85), new Vector3(side * spread, 0.3, depth * 1.7), 0.32)));
  }

  private platform(): Mesh {
    const platform = new Mesh(new RoundedBoxGeometry(this.radius * 1.9, 0.36, 4.6, 3, 0.16), this.clay.get(0xf3dfe9));
    platform.position.y = 0.18;
    platform.receiveShadow = true;
    return platform;
  }
}
