import { CircleGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry } from "three";
import { GrassField } from "../GrassField.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { SeededRandom } from "../neighborhood/SeededRandom.js";
import type { Toy } from "./Toy.js";

const HILLS = [0xa9ddc5, 0xcfc3e6, 0xffd9c7, 0xc7e3b2, 0xb7d2f0] as const;

export class Landscape {
  /**
   * @param toy - Fábrica de piezas.
   * @param color - Color de la pradera.
   * @returns Un suelo redondo enorme.
   */
  static meadow(toy: Toy, color = 0xbfe9d5): Mesh {
    const meadow = new Mesh(new CircleGeometry(170, 64), new MeshStandardMaterial({ color, map: SurfaceTextures.grass(), bumpMap: SurfaceTextures.grass(), bumpScale: 0.9, roughness: 1 }));
    meadow.rotation.x = -Math.PI / 2;
    return meadow;
  }

  /**
   * @param seed - Semilla del azar.
   * @param radius - Radio del disco que se cubre de pasto.
   * @param scale - Tamaño de las briznas, flores y rocas (el mundo de estas escenas es unas 2 veces más grande que el del mapa).
   * @returns Pasto en 3D con flores, arbustos, hongos y rocas sobre la pradera.
   */
  static vegetation(seed: string, radius = 42, scale = 2.2): Group {
    return new GrassField({ seed, radius, scale, y: 0.02, density: 6 }).group;
  }

  /**
   * @param toy - Fábrica de piezas.
   * @param seed - Semilla para repartir las colinas.
   * @param depth - Qué tan al fondo quedan.
   * @returns Una fila de colinas redondas de colores.
   */
  static hills(toy: Toy, seed: string, depth = 55): Group {
    const rng = new SeededRandom(seed);
    const hills = new Group();
    for (let index = 0; index < 11; index += 1) {
      const width = rng.between(12, 26);
      const dome = new Mesh(new SphereGeometry(1, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), toy.clay.get(HILLS[index % HILLS.length] as number));
      dome.scale.set(width, rng.between(4, 10), width * 0.8);
      dome.position.set(-65 + (index / 11) * 150 + rng.between(-6, 6), 0, -depth - rng.between(0, 30));
      hills.add(dome);
    }
    return hills;
  }
}
