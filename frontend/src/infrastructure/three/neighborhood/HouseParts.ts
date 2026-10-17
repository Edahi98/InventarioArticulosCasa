import {
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  Shape,
  SphereGeometry,
  Vector2,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type Vec3 = [number, number, number];

const BEVEL = 0.06;

export class HouseParts {
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
    const created = new MeshStandardMaterial({ color, roughness: 0.62, metalness: 0 });
    this.materials.set(color, created);
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
    const roof = new Mesh(geometry, this.material(color));
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
    const roof = new Mesh(new SphereGeometry(1, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), this.material(color));
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
    const roof = new Mesh(new LatheGeometry(profile, 28), this.material(color));
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
   * @returns Una ventana redondeada con marco y vidrio luminoso.
   */
  window(width: number, height: number, position: Vec3): Group {
    const frame = new Mesh(new RoundedBoxGeometry(width + 0.12, height + 0.12, 0.06, 2, 0.07), this.material(this.trim));
    const pane = new Mesh(new RoundedBoxGeometry(width, height, 0.07, 2, 0.06), this.glass);
    pane.position.z = 0.012;
    const window = new Group();
    window.add(frame, pane);
    window.position.set(...position);
    return window;
  }

  private warm(): MeshStandardMaterial {
    return new MeshStandardMaterial({ color: 0x3a2a40, emissive: 0xffc46b, emissiveIntensity: 1.1, roughness: 0.6 });
  }
}
