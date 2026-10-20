import { CylinderGeometry, DoubleSide, Group, LatheGeometry, Mesh, MeshStandardMaterial, Vector2, type BufferGeometry } from "three";
import { MUSHROOM_CAPS, MUSHROOM_GLOW, MUSHROOM_STEM } from "../../../constantes/barrio_constantes.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { Solid } from "../walk/Solid.js";
import { MeshMerger } from "../MeshMerger.js";
import type { SeededRandom } from "./SeededRandom.js";

export class MushroomBuilder {
  readonly glows: MeshStandardMaterial[] = [];
  private readonly caps = new Map<number, MeshStandardMaterial>();
  private readonly stemGeometry: BufferGeometry;
  private readonly capGeometry: BufferGeometry;
  private readonly gillGeometry: BufferGeometry;
  private readonly stem: MeshStandardMaterial;
  private readonly gills: MeshStandardMaterial;

  /**
   * @param rng - Azar con semilla.
   */
  constructor(private readonly rng: SeededRandom) {
    this.stemGeometry = MushroomBuilder.stemShape();
    this.capGeometry = MushroomBuilder.capShape();
    this.gillGeometry = new CylinderGeometry(0.92, 0.18, 0.12, 28, 1, true).translate(0, -0.04, 0);
    this.stem = new MeshStandardMaterial({ color: MUSHROOM_STEM, roughness: 0.7, map: SurfaceTextures.clay(), bumpMap: SurfaceTextures.clay(), bumpScale: 0.4 });
    this.gills = new MeshStandardMaterial({ color: 0xffe3d0, roughness: 0.8, side: DoubleSide, map: SurfaceTextures.bark(), bumpMap: SurfaceTextures.bark(), bumpScale: 0.5 });
  }

  /**
   * Grupito de hongos de cuento: uno grande con tallo panzón y un poco torcido, sombrero redondo de lunares que
   * brillan de noche y laminillas debajo, rodeado de dos o tres hongos chicos de otros colores.
   *
   * @param x - Posición en x.
   * @param z - Posición en z.
   * @param scale - Tamaño del hongo grande (1 mide unos 1.6 de alto).
   * @returns El grupito, con el hongo grande sólido para el paseo.
   */
  cluster(x: number, z: number, scale: number): Group {
    const cluster = new Group();
    const big = this.mushroom(this.rng.pick(MUSHROOM_CAPS), 1);
    Solid.mark(big, { shape: "cylinder", radius: 0.22, height: 1.4, offset: [0, 0.7, 0] });
    cluster.add(big);
    const small = 2 + Math.floor(this.rng.between(0, 2));
    for (let index = 0; index < small; index += 1) {
      const angle = this.rng.between(0, Math.PI * 2);
      const child = this.mushroom(this.rng.pick(MUSHROOM_CAPS), this.rng.between(0.3, 0.5));
      child.position.set(Math.cos(angle) * this.rng.between(0.55, 0.85), 0, Math.sin(angle) * this.rng.between(0.55, 0.85));
      cluster.add(child);
    }
    cluster.traverse((part) => {
      part.castShadow = true;
    });
    cluster.position.set(x, 0.04, z);
    cluster.scale.setScalar(scale);
    cluster.rotation.y = this.rng.between(0, Math.PI * 2);
    return MeshMerger.merge(cluster);
  }

  private mushroom(color: number, size: number): Group {
    const mushroom = new Group();
    const stem = new Mesh(this.stemGeometry, this.stem);
    const tilt = this.rng.between(-0.12, 0.12);
    stem.rotation.z = tilt;
    const cap = new Mesh(this.capGeometry, this.cap(color));
    const gills = new Mesh(this.gillGeometry, this.gills);
    const top = 1.05;
    cap.position.set(-Math.sin(tilt) * top, top * Math.cos(tilt), 0);
    cap.rotation.z = tilt * 1.6;
    cap.rotation.y = this.rng.between(0, Math.PI * 2);
    gills.position.copy(cap.position);
    gills.rotation.copy(cap.rotation);
    mushroom.add(stem, cap, gills);
    mushroom.scale.setScalar(size);
    return mushroom;
  }

  private cap(color: number): MeshStandardMaterial {
    const cached = this.caps.get(color);
    if (cached) return cached;
    const created = new MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.45,
      map: SurfaceTextures.spotted(color),
      emissive: MUSHROOM_GLOW,
      emissiveMap: SurfaceTextures.spotGlow(),
      emissiveIntensity: 0.3,
    });
    this.caps.set(color, created);
    this.glows.push(created);
    return created;
  }

  private static stemShape(): BufferGeometry {
    const profile = [
      new Vector2(0, 0),
      new Vector2(0.24, 0),
      new Vector2(0.27, 0.12),
      new Vector2(0.22, 0.4),
      new Vector2(0.17, 0.75),
      new Vector2(0.19, 1.0),
      new Vector2(0.0, 1.08),
    ];
    return new LatheGeometry(profile, 20);
  }

  private static capShape(): BufferGeometry {
    const profile: Vector2[] = [new Vector2(0.18, -0.08), new Vector2(0.9, -0.1), new Vector2(1.0, -0.02)];
    for (let step = 1; step <= 8; step += 1) {
      const angle = (step / 8) * (Math.PI / 2);
      profile.push(new Vector2(Math.cos(angle) * 1.0, Math.sin(angle) * 0.72));
    }
    return new LatheGeometry(profile, 32);
  }
}
