import { Group, Mesh, MeshBasicMaterial, TorusGeometry } from "three";

const BANDS = [0xff6b8f, 0xffa24d, 0xffe35c, 0x86d6a8, 0x7fd0ea, 0xb89cf2] as const;

export class Rainbow {
  readonly group = new Group();
  private readonly materials: MeshBasicMaterial[] = [];

  /**
   * Arcoíris de tubos gorditos, uno por color, que se apaga un poco de noche.
   *
   * @param radius - Radio del arco exterior.
   * @param thickness - Grosor de cada franja.
   */
  constructor(radius = 21, thickness = 0.95) {
    BANDS.forEach((color, index) => {
      const material = new MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
      const band = new Mesh(new TorusGeometry(radius - index * thickness, thickness * 0.52, 10, 80, Math.PI), material);
      this.materials.push(material);
      this.group.add(band);
    });
  }

  /**
   * @param night - Qué tan de noche es, entre 0 y 1.
   */
  update(night: number): void {
    const opacity = 0.9 - night * 0.55;
    this.materials.forEach((material) => {
      material.opacity = opacity;
    });
  }
}
