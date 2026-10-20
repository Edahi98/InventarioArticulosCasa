import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Group, NormalBlending, Points, ShaderMaterial, Vector3, type Blending } from "three";
import { FIREWORK_EVERY, PARTICLES_GLOW_MAX, PARTICLES_SOFT_MAX, WEATHER_CYCLE } from "../../../constantes/barrio_constantes.js";
import { SeededRandom } from "./SeededRandom.js";

export type ParticleKind =
  | "polvo"
  | "destello"
  | "confeti"
  | "estrella"
  | "chispa"
  | "humo"
  | "vapor"
  | "espuma"
  | "burbuja"
  | "petalo"
  | "nieve"
  | "lluvia"
  | "hada"
  | "fuego"
  | "dragon"
  | "estela"
  | "agua";

interface KindSpec {
  glow: boolean;
  gravity: number;
  drag: number;
  life: [number, number];
  size: [number, number];
  colors: readonly number[];
  speed: number;
  up: number;
  grow: number;
}

interface Layer {
  points: Points;
  capacity: number;
  cursor: number;
  position: Float32Array;
  velocity: Float32Array;
  color: Float32Array;
  size: Float32Array;
  alpha: Float32Array;
  life: Float32Array;
  maxLife: Float32Array;
  baseSize: Float32Array;
  grow: Float32Array;
  gravity: Float32Array;
  drag: Float32Array;
  material: ShaderMaterial;
}

export interface ParticleStream {
  kind: ParticleKind;
  rate: number;
  spread: number;
  at: () => Vector3 | null;
}

const SPECS: Record<ParticleKind, KindSpec> = {
  polvo: { glow: false, gravity: -0.6, drag: 1.6, life: [0.6, 1.1], size: [0.18, 0.3], colors: [0xf3e3c8, 0xe9d6b8], speed: 1.4, up: 0.6, grow: 1.4 },
  destello: { glow: true, gravity: 0, drag: 1.2, life: [0.5, 1], size: [0.12, 0.22], colors: [0xfff6a8, 0xffffff, 0xffc8e6], speed: 1.6, up: 0.8, grow: -0.6 },
  confeti: { glow: false, gravity: -2.2, drag: 0.8, life: [1, 1.8], size: [0.1, 0.16], colors: [0xff6f91, 0x7fd0ea, 0xffd84d, 0x9be08a, 0xb98cf0], speed: 2.4, up: 2.6, grow: 0 },
  estrella: { glow: true, gravity: -0.4, drag: 0.6, life: [0.8, 1.4], size: [0.16, 0.26], colors: [0xffe35c, 0xfff6a8], speed: 1.8, up: 2, grow: -0.5 },
  chispa: { glow: true, gravity: -3, drag: 0.4, life: [0.3, 0.7], size: [0.06, 0.1], colors: [0xffb036, 0xffe35c, 0xff6f3d], speed: 2.2, up: 2.2, grow: -0.8 },
  humo: { glow: false, gravity: 0.35, drag: 0.6, life: [2, 3.2], size: [0.3, 0.45], colors: [0xf2eef4, 0xdcd6e2], speed: 0.25, up: 0.5, grow: 1.6 },
  vapor: { glow: false, gravity: 0.5, drag: 0.5, life: [1.4, 2.2], size: [0.35, 0.5], colors: [0xffffff, 0xf4f8fb], speed: 0.3, up: 0.8, grow: 1.8 },
  espuma: { glow: false, gravity: -4, drag: 0.3, life: [0.5, 0.9], size: [0.14, 0.22], colors: [0xffffff, 0xe8f6ff], speed: 1.6, up: 2.2, grow: 0.4 },
  burbuja: { glow: false, gravity: 0.6, drag: 0.2, life: [1.2, 2], size: [0.1, 0.16], colors: [0xe8f6ff, 0xffffff], speed: 0.2, up: 0.4, grow: 0.3 },
  petalo: { glow: false, gravity: -0.25, drag: 0.1, life: [5, 8], size: [0.1, 0.15], colors: [0xff9fc8, 0xffd84d, 0x9be08a, 0xfff1e0], speed: 0.8, up: 0.2, grow: 0 },
  nieve: { glow: false, gravity: -0.6, drag: 0.05, life: [8, 12], size: [0.1, 0.16], colors: [0xffffff, 0xf0f6ff], speed: 0.2, up: 0, grow: 0 },
  lluvia: { glow: false, gravity: -9, drag: 0, life: [1.6, 2.2], size: [0.06, 0.08], colors: [0xbfe6ff, 0xd8f0ff], speed: 0.1, up: 0, grow: 0 },
  hada: { glow: true, gravity: 0.15, drag: 0.9, life: [1.4, 2.4], size: [0.1, 0.18], colors: [0xfff6a8, 0xffc8e6, 0xbfe6ff, 0xd8c8ff], speed: 0.6, up: 0.3, grow: -0.3 },
  fuego: { glow: true, gravity: -1.6, drag: 0.5, life: [1, 1.6], size: [0.18, 0.28], colors: [0xff6f91, 0xffd84d, 0x7fd0ea, 0x9be08a, 0xb98cf0, 0xffffff], speed: 4.5, up: 0, grow: -0.4 },
  dragon: { glow: false, gravity: 0.4, drag: 0.7, life: [1.4, 2.2], size: [0.3, 0.45], colors: [0xff9fc8, 0xb98cf0, 0x7fe0f0, 0x9be08a], speed: 0.9, up: 0.3, grow: 1.4 },
  estela: { glow: true, gravity: 0, drag: 2, life: [0.5, 0.9], size: [0.12, 0.18], colors: [0xfff6a8, 0xffc8e6], speed: 0.1, up: 0, grow: -0.6 },
  agua: { glow: false, gravity: -5, drag: 0.2, life: [0.4, 0.7], size: [0.06, 0.09], colors: [0x9fd8f0, 0xd8f0ff], speed: 0.5, up: 0.8, grow: 0 },
};
const VERTEX = `attribute float size;
attribute float alpha;
attribute vec3 tint;
varying float vAlpha;
varying vec3 vTint;
uniform float scale;
void main() {
  vAlpha = alpha;
  vTint = tint;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * scale / max(-mv.z, 0.1);
  gl_Position = projectionMatrix * mv;
}`;
const FRAGMENT = `varying float vAlpha;
varying vec3 vTint;
uniform float glow;
void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;
  float soft = smoothstep(0.5, 0.15, d);
  gl_FragColor = vec4(vTint * glow, vAlpha * soft);
}`;

export class ParticleSystem {
  readonly group = new Group();
  private readonly glow: Layer;
  private readonly soft: Layer;
  private readonly streams: { stream: ParticleStream; debt: number }[] = [];
  private readonly rng = new SeededRandom("particulas");
  private readonly color = new Color();
  private readonly spot = new Vector3();
  private last = 0;
  private nextFirework = 0;

  /**
   * Sistema de partículas ligero y reutilizable: dos nubes de puntos (una que brilla en suma y otra suave) con un
   * sombreador sencillo y un banco fijo de partículas que se reciclan, sin crear objetos en cada cuadro. Hay ráfagas
   * (polvo, confeti, estrellas, espuma…) y chorros continuos atados a un punto (humo, vapor, chispas, polvo de hada,
   * estelas); además lleva su propio clima suave por ciclos (pétalos, nieve o lluvia ligera) y fuegos artificiales de
   * juguete en la noche. Con movimiento reducido no se emite nada.
   *
   * @param islands - Círculos donde caen pétalos, nieve o lluvia y estallan los fuegos artificiales.
   */
  constructor(private readonly islands: { x: number; z: number; radius: number }[]) {
    this.glow = ParticleSystem.layer(PARTICLES_GLOW_MAX, AdditiveBlending);
    this.soft = ParticleSystem.layer(PARTICLES_SOFT_MAX, NormalBlending);
    this.group.add(this.glow.points, this.soft.points);
  }

  /**
   * Suelta una ráfaga de partículas en un punto.
   *
   * @param kind - Tipo de partícula.
   * @param at - Dónde nace.
   * @param count - Cuántas.
   * @param spread - Radio de dispersión inicial.
   */
  burst(kind: ParticleKind, at: Vector3, count: number, spread = 0.2): void {
    for (let index = 0; index < count; index += 1) this.spawn(kind, at.x + this.rng.between(-spread, spread), at.y + this.rng.between(-spread, spread) * 0.5, at.z + this.rng.between(-spread, spread));
  }

  /**
   * Registra un chorro continuo atado a un punto que puede moverse (una chimenea, un barco, un dragón).
   *
   * @param stream - Tipo, partículas por segundo, dispersión y de dónde salen (o `null` para pausar).
   */
  addStream(stream: ParticleStream): void {
    this.streams.push({ stream, debt: 0 });
  }

  /**
   * Avanza todas las partículas, alimenta los chorros, el clima y los fuegos artificiales, y ajusta su brillo a la
   * noche.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` no hay partículas (movimiento reducido).
   */
  update(elapsed: number, night: number, moving: boolean): void {
    const dt = Math.min(Math.max(elapsed - this.last, 0), 0.05);
    this.last = elapsed;
    this.group.visible = moving;
    if (!moving) return;
    this.streams.forEach((entry) => {
      entry.debt += entry.stream.rate * dt;
      const where = entry.debt >= 1 ? entry.stream.at() : null;
      while (entry.debt >= 1) {
        entry.debt -= 1;
        if (where) this.burst(entry.stream.kind, where, 1, entry.stream.spread);
      }
    });
    this.weather(elapsed, dt);
    if (night > 0.55 && elapsed > this.nextFirework) {
      this.nextFirework = elapsed + FIREWORK_EVERY + this.rng.between(0, 2);
      const island = this.rng.pick(this.islands);
      this.burst("fuego", this.spot.set(island.x + this.rng.between(-4, 4), this.rng.between(10, 13), island.z + this.rng.between(-4, 4)), 46, 0.1);
    }
    this.glow.material.uniforms.glow.value = 1 + night * 1.2;
    this.soft.material.uniforms.glow.value = 1 - night * 0.45;
    [this.glow, this.soft].forEach((layer) => ParticleSystem.step(layer, dt));
  }

  private weather(elapsed: number, dt: number): void {
    const phase = (elapsed % WEATHER_CYCLE) / WEATHER_CYCLE;
    const round = Math.floor(elapsed / WEATHER_CYCLE) % 3;
    const strength = Math.max(0, Math.sin(phase * Math.PI * 2) - 0.4) / 0.6;
    const kind: ParticleKind = round === 0 ? "petalo" : round === 1 ? "nieve" : "lluvia";
    const rate = (kind === "lluvia" ? 60 : 24) * strength;
    const petals = 3;
    const count = Math.floor((rate + petals) * dt + this.rng.next());
    for (let index = 0; index < count; index += 1) {
      const island = this.rng.pick(this.islands);
      const angle = this.rng.between(0, Math.PI * 2);
      const distance = Math.sqrt(this.rng.next()) * island.radius * 1.3;
      const falling = index < rate * dt ? kind : "petalo";
      this.spawn(falling, island.x + Math.cos(angle) * distance, falling === "petalo" ? this.rng.between(0.5, 3) : this.rng.between(9, 12), island.z + Math.sin(angle) * distance);
    }
  }

  private spawn(kind: ParticleKind, x: number, y: number, z: number): void {
    const spec = SPECS[kind];
    const layer = spec.glow ? this.glow : this.soft;
    const index = layer.cursor;
    layer.cursor = (layer.cursor + 1) % layer.capacity;
    const angle = this.rng.between(0, Math.PI * 2);
    const speed = spec.speed * this.rng.between(0.4, 1);
    const base = index * 3;
    layer.position[base] = x;
    layer.position[base + 1] = y;
    layer.position[base + 2] = z;
    layer.velocity[base] = Math.cos(angle) * speed;
    layer.velocity[base + 1] = spec.up * this.rng.between(0.5, 1) + (kind === "fuego" ? this.rng.between(-1, 1) * spec.speed : 0);
    layer.velocity[base + 2] = Math.sin(angle) * speed;
    this.color.setHex(this.rng.pick(spec.colors));
    layer.color[base] = this.color.r;
    layer.color[base + 1] = this.color.g;
    layer.color[base + 2] = this.color.b;
    layer.maxLife[index] = this.rng.between(spec.life[0], spec.life[1]);
    layer.life[index] = layer.maxLife[index] as number;
    layer.baseSize[index] = this.rng.between(spec.size[0], spec.size[1]);
    layer.grow[index] = spec.grow;
    layer.gravity[index] = spec.gravity;
    layer.drag[index] = spec.drag;
  }

  private static step(layer: Layer, dt: number): void {
    for (let index = 0; index < layer.capacity; index += 1) {
      const life = layer.life[index] as number;
      if (life <= 0) {
        layer.alpha[index] = 0;
        continue;
      }
      const next = life - dt;
      layer.life[index] = next;
      const base = index * 3;
      const damping = Math.max(1 - (layer.drag[index] as number) * dt, 0);
      layer.velocity[base] = (layer.velocity[base] as number) * damping;
      layer.velocity[base + 1] = (layer.velocity[base + 1] as number) * damping + (layer.gravity[index] as number) * dt;
      layer.velocity[base + 2] = (layer.velocity[base + 2] as number) * damping;
      layer.position[base] = (layer.position[base] as number) + (layer.velocity[base] as number) * dt;
      layer.position[base + 1] = (layer.position[base + 1] as number) + (layer.velocity[base + 1] as number) * dt;
      layer.position[base + 2] = (layer.position[base + 2] as number) + (layer.velocity[base + 2] as number) * dt;
      const age = 1 - Math.max(next, 0) / (layer.maxLife[index] as number);
      layer.alpha[index] = Math.min(age * 6, 1) * (1 - age);
      layer.size[index] = (layer.baseSize[index] as number) * Math.max(1 + (layer.grow[index] as number) * age, 0.05);
    }
    const geometry = layer.points.geometry;
    ["position", "alpha", "size", "tint"].forEach((name) => {
      (geometry.getAttribute(name) as BufferAttribute).needsUpdate = true;
    });
  }

  private static layer(capacity: number, blending: Blending): Layer {
    const position = new Float32Array(capacity * 3);
    const color = new Float32Array(capacity * 3);
    const size = new Float32Array(capacity);
    const alpha = new Float32Array(capacity);
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(position, 3));
    geometry.setAttribute("tint", new BufferAttribute(color, 3));
    geometry.setAttribute("size", new BufferAttribute(size, 1));
    geometry.setAttribute("alpha", new BufferAttribute(alpha, 1));
    const material = new ShaderMaterial({
      uniforms: { scale: { value: 520 }, glow: { value: 1 } },
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending,
    });
    const points = new Points(geometry, material);
    points.frustumCulled = false;
    return {
      points,
      capacity,
      cursor: 0,
      position,
      velocity: new Float32Array(capacity * 3),
      color,
      size,
      alpha,
      life: new Float32Array(capacity),
      maxLife: new Float32Array(capacity).fill(1),
      baseSize: new Float32Array(capacity),
      grow: new Float32Array(capacity),
      gravity: new Float32Array(capacity),
      drag: new Float32Array(capacity),
      material,
    };
  }
}
