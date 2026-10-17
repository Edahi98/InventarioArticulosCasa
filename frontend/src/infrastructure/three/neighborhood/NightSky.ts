import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  Points,
  PointsMaterial,
  SphereGeometry,
} from "three";
import { SeededRandom } from "./SeededRandom.js";
import type { SkyState } from "./SkyCycle.js";

const STARS = 280;
const FIREFLIES = 38;
const DOME = 78;
const BODY_DISTANCE = 62;
const SUN = new Color(0xffe9a8);
const MOON = new Color(0xe8eeff);

export class NightSky {
  readonly group = new Group();
  private readonly body: Mesh;
  private readonly bodyMaterial: MeshBasicMaterial;
  private readonly stars: Points;
  private readonly fireflies: Points;
  private readonly anchors: { x: number; y: number; z: number; phase: number }[];
  private readonly glow: CanvasTexture;

  /**
   * @param width - Ancho del terreno, para repartir las luciérnagas.
   * @param depth - Fondo del terreno.
   */
  constructor(width: number, depth: number) {
    const rng = new SeededRandom("cielo");
    this.glow = NightSky.glowTexture();
    this.bodyMaterial = new MeshBasicMaterial({ color: SUN, fog: false });
    this.body = new Mesh(new SphereGeometry(3, 24, 18), this.bodyMaterial);
    this.stars = this.buildStars(rng);
    this.anchors = Array.from({ length: FIREFLIES }, () => ({
      x: rng.between(-width / 2 - 1, width / 2 + 1),
      y: rng.between(0.35, 1.7),
      z: rng.between(-depth / 2 - 1, depth / 2 + 1),
      phase: rng.between(0, Math.PI * 2),
    }));
    this.fireflies = this.buildFireflies();
    this.group.add(this.body, this.stars, this.fireflies);
  }

  /**
   * Coloca el sol o la luna en su arco y enciende estrellas y luciérnagas según qué tan de noche es.
   *
   * @param state - Estado del cielo a esa hora.
   * @param elapsed - Segundos transcurridos, para el parpadeo y el vuelo de las luciérnagas.
   */
  update(state: SkyState, elapsed: number): void {
    const { arc, night } = state;
    this.body.position.set(-Math.cos(arc) * BODY_DISTANCE * 0.75, 3 + Math.max(Math.sin(arc), 0.05) * 20, -BODY_DISTANCE);
    this.bodyMaterial.color.copy(SUN).lerp(MOON, night);
    this.body.scale.setScalar(1.3 - night * 0.45);

    (this.stars.material as PointsMaterial).opacity = Math.max(night - 0.35, 0) * 1.5 * (0.88 + Math.sin(elapsed * 1.7) * 0.12);

    const glow = Math.min(Math.max((night - 0.3) * 1.4, 0), 1);
    (this.fireflies.material as PointsMaterial).opacity = glow;
    this.fireflies.visible = glow > 0.02;
    if (this.fireflies.visible) this.flutter(elapsed);
  }

  /**
   * Libera la textura de brillo compartida por estrellas y luciérnagas.
   */
  dispose(): void {
    this.glow.dispose();
  }

  private static glowTexture(): CanvasTexture {
    const surface = document.createElement("canvas");
    surface.width = 64;
    surface.height = 64;
    const context = surface.getContext("2d");
    if (context) {
      const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.35, "rgba(255,255,255,0.65)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 64, 64);
    }
    return new CanvasTexture(surface);
  }

  private buildStars(rng: SeededRandom): Points {
    const positions: number[] = [];
    for (let index = 0; index < STARS; index += 1) {
      const angle = rng.between(0, Math.PI * 2);
      const height = rng.between(0.12, 1);
      const ring = Math.sqrt(1 - height * height);
      positions.push(Math.cos(angle) * ring * DOME, height * DOME * 0.7 + 4, Math.sin(angle) * ring * DOME - 10);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    const material = new PointsMaterial({
      color: 0xffffff,
      size: 7,
      map: this.glow,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
    });
    return new Points(geometry, material);
  }

  private buildFireflies(): Points {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(new Array(FIREFLIES * 3).fill(0), 3));
    const material = new PointsMaterial({
      color: 0xfff3a0,
      size: 11,
      map: this.glow,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    return new Points(geometry, material);
  }

  private flutter(elapsed: number): void {
    const attribute = this.fireflies.geometry.getAttribute("position");
    this.anchors.forEach((anchor, index) => {
      attribute.setXYZ(
        index,
        anchor.x + Math.sin(elapsed * 0.45 + anchor.phase) * 0.9,
        anchor.y + Math.sin(elapsed * 0.9 + anchor.phase * 2) * 0.3,
        anchor.z + Math.cos(elapsed * 0.38 + anchor.phase) * 0.9,
      );
    });
    attribute.needsUpdate = true;
  }
}
