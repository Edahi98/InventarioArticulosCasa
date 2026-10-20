import { Color, Float32BufferAttribute, Mesh, MeshStandardMaterial, SphereGeometry, type BufferGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CLOUD_BELLY, CLOUD_TOP } from "../../../constantes/barrio_constantes.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import type { SeededRandom } from "./SeededRandom.js";

export class CloudPuffs {
  readonly material = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 1,
    emissive: 0xffe3ee,
    emissiveIntensity: 0.3,
    map: SurfaceTextures.clay(),
    bumpMap: SurfaceTextures.clay(),
    bumpScale: 0.2,
  });

  /**
   * Nube esponjosa de caricatura en una sola malla: una base ancha y aplastada de bolitas con la panza lila, una capa
   * media de bolas grandes y dos o tres copetes arriba, todo blanco que se va tiñendo hacia abajo.
   *
   * @param rng - Azar con semilla.
   * @param size - Tamaño de la nube (1 mide unos 4 de ancho).
   * @returns La nube; comparte el material de esta fábrica.
   */
  build(rng: SeededRandom, size: number): Mesh {
    const parts: BufferGeometry[] = [];
    const base = 5 + Math.floor(rng.between(0, 3));
    for (let index = 0; index < base; index += 1) {
      const x = -1.6 + (index / (base - 1)) * 3.2 + rng.between(-0.15, 0.15);
      parts.push(CloudPuffs.puff(rng.between(0.55, 0.75), x, rng.between(-0.05, 0.05), rng.between(-0.35, 0.35), 0.6));
    }
    for (let index = 0; index < 3; index += 1) parts.push(CloudPuffs.puff(rng.between(0.8, 1.05), -0.9 + index * 0.9 + rng.between(-0.2, 0.2), 0.45, rng.between(-0.2, 0.2), 0.95));
    const tufts = 2 + Math.floor(rng.between(0, 2));
    for (let index = 0; index < tufts; index += 1) parts.push(CloudPuffs.puff(rng.between(0.5, 0.7), rng.between(-0.7, 0.7), 1.05, rng.between(-0.2, 0.2), 1));
    const geometry = mergeGeometries(parts) ?? new SphereGeometry(1, 12, 8);
    parts.forEach((part) => part.dispose());
    CloudPuffs.shade(geometry);
    const cloud = new Mesh(geometry, this.material);
    cloud.scale.setScalar(size);
    return cloud;
  }

  /**
   * Ajusta el color de las nubes según la hora: blancas y con brillo rosado de día, azul lavanda de noche.
   *
   * @param night - Qué tan de noche es, entre 0 y 1.
   */
  tint(night: number): void {
    this.material.color.setHex(0xffffff).lerp(new Color(0x6a70c8), night);
    this.material.emissiveIntensity = 0.3 * (1 - night);
  }

  private static puff(radius: number, x: number, y: number, z: number, squash: number): BufferGeometry {
    const geometry = new SphereGeometry(radius, 16, 12);
    geometry.scale(1, squash, 1);
    geometry.translate(x, y, z);
    return geometry;
  }

  private static shade(geometry: BufferGeometry): void {
    const position = geometry.getAttribute("position");
    const top = new Color(CLOUD_TOP);
    const belly = new Color(CLOUD_BELLY);
    const colors: number[] = [];
    const mixed = new Color();
    for (let index = 0; index < position.count; index += 1) {
      const lift = Math.min(Math.max((position.getY(index) + 0.4) / 1.4, 0), 1);
      mixed.copy(belly).lerp(top, lift);
      colors.push(mixed.r, mixed.g, mixed.b);
    }
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  }
}
