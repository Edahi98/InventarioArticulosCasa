import {
  BoxGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  Shape,
  SphereGeometry,
  Vector2,
  type BufferGeometry,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type Vec3 = [number, number, number];

const BEVEL = 0.06;
const PLANTER = 0xc4805a;
const BLOOMS = [0xff8fb7, 0xffe35c, 0xb89cf2, 0xff6b6b, 0xfffaf2] as const;

export class HouseParts {
  private static readonly mullions = new Map<string, BufferGeometry>();
  private static readonly bloomShapes = new Map<string, BufferGeometry>();
  private readonly materials = new Map<number, MeshStandardMaterial>();

  /**
   * @param glass - Material compartido por todas las ventanas de la casa (se enciende al señalarla).
   * @param trim - Color de marcos y detalles claros.
   */
  constructor(
    private readonly glass: MeshStandardMaterial,
    private readonly trim: number,
  ) {}

  /**
   * @param color - Color hexadecimal.
   * @returns El material de ese color, reutilizado dentro de la casa.
   */
  material(color: number): MeshStandardMaterial {
    const cached = this.materials.get(color);
    if (cached) return cached;
    const created = new MeshStandardMaterial({ color, roughness: 0.62, metalness: 0, map: SurfaceTextures.clay(), bumpMap: SurfaceTextures.clay(), bumpScale: 0.35 });
    this.materials.set(color, created);
    return created;
  }

  /**
   * @param color - Color hexadecimal.
   * @param round - Si el techo es redondo (cúpula o cono), con coordenadas de textura de 0 a 1.
   * @returns Material de tejas de escama de ese color, reutilizado dentro de la casa.
   */
  roof(color: number, round: boolean): MeshStandardMaterial {
    const key = -(color + (round ? 1 : 2) * 0x1000000);
    const cached = this.materials.get(key);
    if (cached) return cached;
    const tiles = round ? SurfaceTextures.roundShingles() : SurfaceTextures.shingles();
    const created = new MeshStandardMaterial({ color, roughness: 0.7, map: tiles, bumpMap: tiles, bumpScale: 1.1 });
    this.materials.set(key, created);
    return created;
  }

  /**
   * Bloque de aristas redondeadas, como de plastilina.
   *
   * @param size - Ancho, alto y fondo.
   * @param color - Color hexadecimal.
   * @param position - Posición del centro.
   * @param radius - Redondeo de las aristas; se limita para que quepa en la pieza más delgada.
   * @returns Un bloque que proyecta y recibe sombra.
   */
  box(size: Vec3, color: number, position: Vec3, radius = 0.08): Mesh {
    const limit = Math.min(...size) / 2 - 0.002;
    const mesh = new Mesh(new RoundedBoxGeometry(size[0], size[1], size[2], 3, Math.max(Math.min(radius, limit), 0.001)), this.material(color));
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Techo de dos aguas con cumbrera y bordes abultados: un prisma triangular biselado.
   *
   * @param width - Ancho de la base del techo.
   * @param depth - Largo de la cumbrera.
   * @param height - Altura del techo.
   * @param baseY - Altura donde empieza.
   * @param color - Color hexadecimal.
   * @returns El techo.
   */
  gableRoof(width: number, depth: number, height: number, baseY: number, color: number): Mesh {
    const half = Math.max(width / 2 - BEVEL, 0.1);
    const peak = Math.max(height - BEVEL, 0.1);
    const outline = new Shape();
    outline.moveTo(-half, 0);
    outline.lineTo(half, 0);
    outline.lineTo(half * 0.08, peak * 0.96);
    outline.quadraticCurveTo(0, peak * 1.02, -half * 0.08, peak * 0.96);
    outline.closePath();
    const length = Math.max(depth - BEVEL * 2, 0.1);
    const geometry = new ExtrudeGeometry(outline, {
      depth: length,
      bevelEnabled: true,
      bevelSize: BEVEL,
      bevelThickness: BEVEL,
      bevelSegments: 3,
      steps: 1,
    });
    geometry.translate(0, 0, -length / 2);
    const roof = new Mesh(geometry, this.roof(color, false));
    roof.position.y = baseY + BEVEL * 0.6;
    roof.castShadow = true;
    return roof;
  }

  /**
   * Techo de cúpula chata, como la gorra de un hongo.
   *
   * @param width - Ancho de la base.
   * @param depth - Fondo de la base.
   * @param height - Altura.
   * @param baseY - Altura donde empieza.
   * @param color - Color hexadecimal.
   * @returns El techo.
   */
  hipRoof(width: number, depth: number, height: number, baseY: number, color: number): Mesh {
    const roof = new Mesh(new SphereGeometry(1, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), this.roof(color, true));
    roof.scale.set(width / 2 + 0.06, height, depth / 2 + 0.06);
    roof.position.y = baseY;
    roof.castShadow = true;
    return roof;
  }

  /**
   * Techo de cebolla: cónico, con la punta redondeada.
   *
   * @param radius - Radio de la base.
   * @param height - Altura.
   * @param baseY - Altura donde empieza.
   * @param color - Color hexadecimal.
   * @returns El techo.
   */
  cone(radius: number, height: number, baseY: number, color: number): Mesh {
    const profile = [
      new Vector2(radius * 1.04, 0),
      new Vector2(radius * 0.96, height * 0.28),
      new Vector2(radius * 0.62, height * 0.62),
      new Vector2(radius * 0.22, height * 0.9),
      new Vector2(radius * 0.05, height * 0.99),
      new Vector2(0, height),
    ];
    const roof = new Mesh(new LatheGeometry(profile, 28), this.roof(color, true));
    roof.position.y = baseY;
    roof.castShadow = true;
    return roof;
  }

  /**
   * @param radius - Radio.
   * @param height - Altura.
   * @param color - Color hexadecimal.
   * @param position - Posición del centro.
   * @returns Un cilindro, para postes y mástiles.
   */
  pole(radius: number, height: number, color: number, position: Vec3): Mesh {
    const mesh = new Mesh(new CylinderGeometry(radius, radius, height, 10), this.material(color));
    mesh.position.set(...position);
    mesh.castShadow = true;
    return mesh;
  }

  /**
   * Puerta con bisagra en el borde izquierdo y un interior cálido detrás, que se ve al abrirla.
   *
   * @param width - Ancho.
   * @param height - Alto.
   * @param color - Color de la hoja.
   * @param position - Centro de la puerta, ya sobre la pared.
   * @returns El conjunto a agregar a la casa y la hoja que gira (se abre con `rotation.y` negativa).
   */
  door(width: number, height: number, color: number, position: Vec3): { group: Group; swing: Group } {
    const [x, y, z] = position;
    const interior = new Mesh(new RoundedBoxGeometry(width, height, 0.05, 2, 0.05), this.warm());
    interior.position.set(x, y, z - 0.02);
    const leaf = new Mesh(new RoundedBoxGeometry(width, height, 0.07, 3, 0.07), this.material(color));
    leaf.position.x = width / 2;
    leaf.castShadow = true;
    const swing = new Group();
    swing.position.set(x - width / 2, y, z);
    swing.add(leaf);
    const group = new Group();
    group.add(interior, swing);
    return { group, swing };
  }

  /**
   * @param width - Ancho del vidrio.
   * @param height - Alto del vidrio.
   * @param position - Posición del centro, ya sobre la pared.
   * @returns Una ventana redondeada con marco, vidrio luminoso, cruceta y, si es ancha, jardinera con flores.
   */
  window(width: number, height: number, position: Vec3): Group {
    const frame = new Mesh(new RoundedBoxGeometry(width + 0.12, height + 0.12, 0.06, 2, 0.07), this.material(this.trim));
    const pane = new Mesh(new RoundedBoxGeometry(width, height, 0.07, 2, 0.06), this.glass);
    pane.position.z = 0.012;
    const cross = new Mesh(HouseParts.mullion(width, height), this.material(this.trim));
    cross.position.z = 0.05;
    const window = new Group();
    window.add(frame, pane, cross);
    if (width >= 0.24) {
      const planter = new Mesh(new RoundedBoxGeometry(width + 0.16, 0.08, 0.12, 2, 0.03), this.material(PLANTER));
      planter.position.set(0, -height / 2 - 0.1, 0.07);
      const blooms = new Mesh(HouseParts.blooms(width), this.material(BLOOMS[Math.round(width * 100) % BLOOMS.length] as number));
      blooms.position.set(0, -height / 2 - 0.04, 0.07);
      window.add(planter, blooms);
    }
    window.position.set(...position);
    return window;
  }

  private static mullion(width: number, height: number): BufferGeometry {
    const key = `${width.toFixed(2)}x${height.toFixed(2)}`;
    const cached = HouseParts.mullions.get(key);
    if (cached) return cached;
    const created = mergeGeometries([new BoxGeometry(width, 0.025, 0.02), new BoxGeometry(0.025, height, 0.02)]) ?? new BoxGeometry(width, 0.025, 0.02);
    HouseParts.mullions.set(key, created);
    return created;
  }

  private static blooms(width: number): BufferGeometry {
    const key = width.toFixed(2);
    const cached = HouseParts.bloomShapes.get(key);
    if (cached) return cached;
    const count = Math.max(Math.round(width / 0.09), 3);
    const parts = Array.from({ length: count }, (_, index) => new SphereGeometry(0.045, 8, 6).translate(-width / 2 + (index + 0.5) * (width / count), (index % 2) * 0.02, 0));
    const created = mergeGeometries(parts) ?? new SphereGeometry(0.045, 8, 6);
    HouseParts.bloomShapes.set(key, created);
    return created;
  }

  private warm(): MeshStandardMaterial {
    return new MeshStandardMaterial({ color: 0x3a2a40, emissive: 0xffc46b, emissiveIntensity: 1.1, roughness: 0.6 });
  }
}
