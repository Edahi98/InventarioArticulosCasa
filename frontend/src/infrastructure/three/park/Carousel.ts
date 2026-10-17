import { CanvasTexture, ConeGeometry, CylinderGeometry, DoubleSide, Group, Mesh, MeshStandardMaterial, SphereGeometry, SRGBColorSpace, TorusGeometry } from "three";
import type { BearBuilder } from "../BearBuilder.js";
import { GuardianBear } from "../neighborhood/GuardianBear.js";
import type { ClayMaterials } from "./ClayMaterials.js";
import type { Interactive } from "./ParkInteraction.js";

interface Seat {
  group: Group;
  bear: GuardianBear;
  phase: number;
}

const RING = 2.15;
const SEATS = 6;

export class Carousel {
  readonly group = new Group();
  readonly interactives: Interactive[] = [];
  private readonly spinner = new Group();
  private readonly seats: Seat[] = [];
  private readonly bulbs = new MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffd37a, emissiveIntensity: 0.3 });
  private angle = 0;
  private boost = 0;
  private last = 0;
  private now = 0;
  private hovered = false;

  /**
   * Carrusel: plataforma redonda con techo de rayas, focos que se encienden de noche y seis ositos que giran,
   * suben y bajan en sus asientos y de vez en cuando saludan. Al tocarlo se acelera un rato y al tocar a un
   * osito, saluda.
   *
   * @param bears - Constructor de ositos compartido.
   * @param clay - Materiales compartidos.
   */
  constructor(
    private readonly bears: BearBuilder,
    private readonly clay: ClayMaterials,
  ) {
    const base = new Mesh(new CylinderGeometry(3.15, 3.35, 0.42, 48), this.clay.get(0xe4d9ff));
    base.position.y = 0.21;
    base.receiveShadow = true;
    this.spinner.position.y = 0.42;
    this.spinner.add(this.floor(), this.column(), this.canopy(), this.rimRing(), ...this.lights());
    for (let index = 0; index < SEATS; index += 1) this.spinner.add(this.seat(index));
    this.spinner.userData.interactiveId = "carrusel";
    this.group.add(base, this.spinner);
    this.interactives.push({
      id: "carrusel",
      object: this.spinner,
      hit: () => {
        this.boost = 2.2;
      },
      hover: (on) => {
        this.hovered = on;
      },
    });
  }

  /**
   * Hace girar el carrusel, sube y baja a los ositos en sus asientos y enciende los focos de noche.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` todo queda quieto (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const dt = Math.min(Math.max(elapsed - this.last, 0), 0.1);
    this.last = elapsed;
    this.now = elapsed;
    this.boost *= Math.exp(-dt * 0.7);
    if (moving) this.angle += (0.55 + this.boost) * dt;
    this.spinner.rotation.y = this.angle;
    const t = moving ? elapsed : 0;
    this.seats.forEach((seat) => {
      seat.group.position.y = 0.5 + (Math.sin(t * 1.8 + seat.phase) + 1) * (0.22 + this.boost * 0.05);
      seat.bear.update(elapsed, Math.sin(t * 0.3 + seat.phase) > 0.92 ? 1 : 0, moving);
    });
    this.bulbs.emissiveIntensity = 0.3 + (night * 1.9 + (this.hovered ? 0.7 : 0)) * (0.75 + 0.25 * Math.sin(t * 4));
  }

  private floor(): Mesh {
    const floor = new Mesh(new CylinderGeometry(2.95, 2.95, 0.12, 48), this.clay.get(0xfff6dc));
    floor.position.y = 0.06;
    floor.receiveShadow = true;
    return floor;
  }

  private column(): Mesh {
    const column = new Mesh(new CylinderGeometry(0.3, 0.38, 3.3, 20), this.clay.get(0xff8fb7));
    column.position.y = 1.7;
    column.castShadow = true;
    return column;
  }

  private stripes(): CanvasTexture {
    const surface = document.createElement("canvas");
    surface.width = 256;
    surface.height = 8;
    const context = surface.getContext("2d");
    if (context) {
      for (let band = 0; band < 12; band += 1) {
        context.fillStyle = band % 2 === 0 ? "#ff8fb7" : "#fff6dc";
        context.fillRect((band / 12) * 256, 0, 256 / 12 + 1, 8);
      }
    }
    const texture = new CanvasTexture(surface);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }

  private canopy(): Group {
    const canopy = new Group();
    const cone = new Mesh(new ConeGeometry(3.5, 1.6, 36, 1, true), new MeshStandardMaterial({ map: this.stripes(), roughness: 0.6, side: DoubleSide }));
    cone.position.y = 4.1;
    cone.castShadow = true;
    const finial = new Mesh(new SphereGeometry(0.24, 14, 12), this.clay.get(0xffd37a));
    finial.position.y = 5.0;
    canopy.add(cone, finial);
    return canopy;
  }

  private rimRing(): Mesh {
    const ring = new Mesh(new TorusGeometry(3.45, 0.09, 8, 60), this.clay.get(0xffd37a));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 3.3;
    return ring;
  }

  private lights(): Mesh[] {
    const geometry = new SphereGeometry(0.1, 10, 8);
    return Array.from({ length: 20 }, (_, index) => {
      const angle = (index / 20) * Math.PI * 2;
      const bulb = new Mesh(geometry, this.bulbs);
      bulb.position.set(Math.sin(angle) * 3.45, 3.3, Math.cos(angle) * 3.45);
      return bulb;
    });
  }

  private seat(index: number): Group {
    const angle = (index / SEATS) * Math.PI * 2;
    const seat = new Group();
    seat.position.set(Math.sin(angle) * RING, 0.5, Math.cos(angle) * RING);
    const pole = new Mesh(new CylinderGeometry(0.055, 0.055, 3, 8), this.clay.get(0xffd37a));
    pole.position.y = 1.4;
    const pad = new Mesh(new CylinderGeometry(0.58, 0.58, 0.14, 24), this.clay.get(0xb89cf2));
    const bear = new GuardianBear(this.bears, index + 1, 0.32, false);
    bear.group.position.y = 0.07;
    bear.group.rotation.y = angle;
    bear.group.userData.interactiveId = `carrusel-${index}`;
    seat.add(pole, pad, bear.group);
    this.interactives.push({ id: `carrusel-${index}`, object: bear.group, hit: () => bear.poke(this.now) });
    seat.traverse((part) => {
      part.castShadow = true;
    });
    this.seats.push({ group: seat, bear, phase: index * 1.05 });
    return seat;
  }
}
