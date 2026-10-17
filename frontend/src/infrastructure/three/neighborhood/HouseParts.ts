import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
} from "three";

type Vec3 = [number, number, number];

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
    const created = new MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.02 });
    this.materials.set(color, created);
    return created;
  }

  /**
   * @param size - Ancho, alto y fondo.
   * @param color - Color hexadecimal.
   * @param position - Posición del centro.
   * @returns Un bloque que proyecta y recibe sombra.
   */
  box(size: Vec3, color: number, position: Vec3): Mesh {
    const mesh = new Mesh(new BoxGeometry(...size), this.material(color));
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Techo de dos aguas: un prisma triangular cuya cumbrera corre a lo largo del fondo.
   *
   * @param width - Ancho de la base del techo.
   * @param depth - Largo de la cumbrera.
   * @param height - Altura del techo.
   * @param baseY - Altura donde empieza.
   * @param color - Color hexadecimal.
   * @returns El techo.
   */
  gableRoof(width: number, depth: number, height: number, baseY: number, color: number): Mesh {
    const geometry = new CylinderGeometry(1, 1, 1, 3);
    geometry.rotateX(-Math.PI / 2);
    const roof = new Mesh(geometry, this.material(color));
    const scaleY = height / 1.5;
    roof.scale.set(width / 1.7320508, scaleY, depth);
    roof.position.y = baseY + 0.5 * scaleY;
    roof.castShadow = true;
    return roof;
  }

  /**
   * Techo de cuatro aguas.
   *
   * @param width - Ancho de la base.
   * @param depth - Fondo de la base.
   * @param height - Altura.
   * @param baseY - Altura donde empieza.
   * @param color - Color hexadecimal.
   * @returns El techo.
   */
  hipRoof(width: number, depth: number, height: number, baseY: number, color: number): Mesh {
    const longest = Math.max(width, depth);
    const geometry = new ConeGeometry(longest / Math.SQRT2, height, 4);
    geometry.rotateY(Math.PI / 4);
    const roof = new Mesh(geometry, this.material(color));
    roof.scale.set(width / longest, 1, depth / longest);
    roof.position.y = baseY + height / 2;
    roof.castShadow = true;
    return roof;
  }

  /**
   * @param radius - Radio de la base.
   * @param height - Altura.
   * @param segments - Caras laterales.
   * @param baseY - Altura donde empieza.
   * @param color - Color hexadecimal.
   * @returns Un techo cónico.
   */
  cone(radius: number, height: number, segments: number, baseY: number, color: number): Mesh {
    const roof = new Mesh(new ConeGeometry(radius, height, segments), this.material(color));
    roof.position.y = baseY + height / 2;
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
    const mesh = new Mesh(new CylinderGeometry(radius, radius, height, 8), this.material(color));
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
    const interior = new Mesh(new BoxGeometry(width, height, 0.04), this.warm());
    interior.position.set(x, y, z - 0.02);
    const leaf = new Mesh(new BoxGeometry(width, height, 0.06), this.material(color));
    leaf.position.x = width / 2;
    leaf.castShadow = true;
    const swing = new Group();
    swing.position.set(x - width / 2, y, z);
    swing.add(leaf);
    const group = new Group();
    group.add(interior, swing);
    return { group, swing };
  }

  private warm(): MeshStandardMaterial {
    return new MeshStandardMaterial({ color: 0x3a2a40, emissive: 0xffc46b, emissiveIntensity: 1.1, roughness: 0.6 });
  }

  /**
   * @param width - Ancho del vidrio.
   * @param height - Alto del vidrio.
   * @param position - Posición del centro, ya sobre la pared.
   * @returns Una ventana con marco y vidrio luminoso.
   */
  window(width: number, height: number, position: Vec3): Group {
    const frame = new Mesh(new BoxGeometry(width + 0.1, height + 0.1, 0.05), this.material(this.trim));
    const pane = new Mesh(new BoxGeometry(width, height, 0.06), this.glass);
    pane.position.z = 0.01;
    const window = new Group();
    window.add(frame, pane);
    window.position.set(...position);
    return window;
  }
}
