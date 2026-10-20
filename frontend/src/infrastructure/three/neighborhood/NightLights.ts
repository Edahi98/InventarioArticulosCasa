import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  PointLight,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  type CanvasTexture,
  type Vector3,
} from "three";
import { GARLAND_COLORS, GOD_RAYS, PLAZA_LIGHT } from "../../../constantes/barrio_constantes.js";
import { TextureCanvas } from "../TextureCanvas.js";

export class NightLights {
  readonly group = new Group();
  private readonly haloMaterial = new SpriteMaterial({ map: NightLights.haloTexture(), color: 0xffd9a0, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, fog: false });
  private readonly bulbMaterial = new MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  private readonly bulbGeometry = new SphereGeometry(0.045, 8, 6);
  private readonly rayMaterial = new MeshBasicMaterial({ map: NightLights.rayTexture(), color: 0xffd6a0, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, side: DoubleSide, fog: false });
  private readonly blinkers: MeshStandardMaterial[] = [];
  private readonly plazas: PointLight[] = [];
  private readonly rays = new Group();

  /**
   * Luces de la noche del archipiélago, casi todas sin luces reales: halos aditivos alrededor de faroles y farolitos,
   * guirnaldas de foquitos de colores, balizas que parpadean (helipuerto), haces de luz cálida al amanecer y al
   * atardecer y una luz puntual cálida sobre cada isla, para que el barrio entero se encienda por igual.
   *
   * @param spots - Cada isla con su centro y su radio; la primera es la principal, donde nacen los haces de luz.
   */
  constructor(spots: { x: number; z: number; radius: number }[]) {
    const main = spots[0] ?? { x: 0, z: 0, radius: 1 };
    spots.forEach((spot) => {
      const light = new PointLight(PLAZA_LIGHT, 0, spot.radius * 1.4, 1.6);
      light.position.set(spot.x, 3.2, spot.z);
      this.plazas.push(light);
      this.group.add(light);
    });
    for (let index = 0; index < GOD_RAYS; index += 1) {
      const ray = new Mesh(new PlaneGeometry(1.6 + index * 0.4, main.radius * 1.3), this.rayMaterial);
      const angle = (index / GOD_RAYS) * Math.PI * 0.8 - 0.4;
      ray.position.set(main.x + Math.cos(angle) * main.radius * 0.45, main.radius * 0.45, main.z + Math.sin(angle) * main.radius * 0.45 - main.radius * 0.3);
      ray.rotation.set(0, angle, 0.45);
      this.rays.add(ray);
    }
    this.group.add(this.rays);
    this.update(0, 0, false);
  }

  /**
   * @param size - Tamaño del halo.
   * @returns Un halo aditivo que brilla de noche alrededor de una luz; comparte material con todos.
   */
  halo(size: number): Sprite {
    const sprite = new Sprite(this.haloMaterial);
    sprite.scale.setScalar(size);
    return sprite;
  }

  /**
   * Guirnalda de foquitos de colores en una sola malla instanciada; se encienden de noche.
   *
   * @param points - Dónde va cada foquito.
   * @returns La guirnalda.
   */
  garland(points: Vector3[]): InstancedMesh {
    const mesh = new InstancedMesh(this.bulbGeometry, this.bulbMaterial, Math.max(points.length, 1));
    mesh.count = points.length;
    const holder = new Object3D();
    points.forEach((point, index) => {
      holder.position.copy(point);
      holder.updateMatrix();
      mesh.setMatrixAt(index, holder.matrix);
      mesh.setColorAt(index, new Color(GARLAND_COLORS[index % GARLAND_COLORS.length] as number));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return mesh;
  }

  /**
   * @param material - Material emisivo que debe parpadear de noche (balizas).
   */
  blink(material: MeshStandardMaterial): void {
    this.blinkers.push(material);
  }

  /**
   * Ajusta todas las luces a la hora: halos y guirnaldas según la noche, balizas que parpadean, haces de luz que solo
   * aparecen al amanecer y al atardecer, y la luz cálida de la plaza.
   *
   * @param elapsed - Segundos transcurridos.
   * @param night - Qué tan de noche es, entre 0 y 1.
   * @param moving - Si es `false` nada parpadea (movimiento reducido) y queda el estado fijo de la hora.
   */
  update(elapsed: number, night: number, moving: boolean): void {
    this.haloMaterial.opacity = Math.min(night * 1.1, 0.9);
    this.bulbMaterial.color.setScalar(0.35 + night * 0.9);
    const dusk = Math.max(0, 1 - Math.abs(night - 0.38) / 0.28);
    this.rayMaterial.opacity = dusk * 0.22;
    this.rays.visible = dusk > 0.01;
    this.plazas.forEach((plaza) => {
      plaza.intensity = night * 6;
    });
    const on = !moving || Math.sin(elapsed * 4) > 0;
    this.blinkers.forEach((material, index) => {
      material.emissiveIntensity = night > 0.1 && (on || index % 2 === 1) ? 0.6 + night * 2 : 0.2;
    });
  }

  private static haloTexture(): CanvasTexture {
    return TextureCanvas.build("halo", 64, 64, false, (context, _rng, width, height) => {
      const glow = context.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
      glow.addColorStop(0, "rgba(255,255,255,1)");
      glow.addColorStop(0.25, "rgba(255,240,200,0.55)");
      glow.addColorStop(1, "rgba(255,220,160,0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
    });
  }

  private static rayTexture(): CanvasTexture {
    return TextureCanvas.build("haz", 32, 128, false, (context, _rng, width, height) => {
      const across = context.createLinearGradient(0, 0, width, 0);
      across.addColorStop(0, "rgba(255,255,255,0)");
      across.addColorStop(0.5, "rgba(255,255,255,1)");
      across.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = across;
      context.fillRect(0, 0, width, height);
      const fade = context.createLinearGradient(0, 0, 0, height);
      fade.addColorStop(0, "rgba(0,0,0,0)");
      fade.addColorStop(1, "rgba(0,0,0,1)");
      context.globalCompositeOperation = "destination-out";
      context.fillStyle = fade;
      context.fillRect(0, 0, width, height);
    });
  }
}
