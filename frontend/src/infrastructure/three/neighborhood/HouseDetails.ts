import { CanvasTexture, Group, Mesh, MeshStandardMaterial, SRGBColorSpace, SphereGeometry, Vector3 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { HouseParts } from "./HouseParts.js";
import type { HouseStyle } from "./HouseTemplate.js";

const BRASS = 0xffd37a;

export class HouseDetails {
  /**
   * @param parts - Piezas de la casa, para reutilizar sus materiales.
   * @param style - Colores de la casa.
   * @param glass - Material luminoso de las ventanas; el farol del pórtico se enciende con él.
   */
  constructor(
    private readonly parts: HouseParts,
    private readonly style: HouseStyle,
    private readonly glass: MeshStandardMaterial,
  ) {}

  /**
   * Los detalles de la fachada: número de la casa, tapete, perilla que gira con la puerta y un farol
   * de pórtico que brilla igual que las ventanas.
   *
   * @param house - Grupo de la casa.
   * @param door - Hoja de la puerta (su primer hijo es la hoja con la medida real).
   * @param number - Número que se pinta en la placa.
   */
  decorate(house: Group, door: Group, number: number): void {
    const leaf = door.children[0] as Mesh | undefined;
    if (!leaf) return;
    leaf.geometry.computeBoundingBox();
    const size = leaf.geometry.boundingBox?.getSize(new Vector3());
    if (!size) return;
    const centerX = door.position.x + size.x / 2;
    const frontZ = door.position.z;

    const plate = new Mesh(new RoundedBoxGeometry(0.22, 0.13, 0.03, 2, 0.04), new MeshStandardMaterial({ map: HouseDetails.plateTexture(number), roughness: 0.6 }));
    plate.position.set(centerX, door.position.y + size.y / 2 + 0.16, frontZ + 0.02);

    const mat = this.parts.box([size.x * 1.15, 0.02, 0.2], this.style.door, [centerX, 0.012, frontZ + 0.17], 0.009);
    mat.castShadow = false;

    const knob = new Mesh(new SphereGeometry(0.024, 10, 8), new MeshStandardMaterial({ color: BRASS, metalness: 0.5, roughness: 0.35 }));
    knob.position.set(size.x * 0.82, 0, 0.05);
    door.add(knob);

    const bracket = this.parts.box([0.03, 0.03, 0.07], this.style.trim, [centerX + size.x / 2 + 0.2, door.position.y + 0.26, frontZ + 0.03], 0.012);
    const lamp = new Mesh(new SphereGeometry(0.055, 12, 10), this.glass);
    lamp.position.set(centerX + size.x / 2 + 0.2, door.position.y + 0.21, frontZ + 0.08);

    house.add(plate, mat, bracket, lamp);
  }

  private static plateTexture(number: number): CanvasTexture {
    const surface = document.createElement("canvas");
    surface.width = 128;
    surface.height = 80;
    const context = surface.getContext("2d");
    if (context) {
      context.fillStyle = "#fff6dc";
      context.fillRect(0, 0, 128, 80);
      context.strokeStyle = "#c4235f";
      context.lineWidth = 8;
      context.strokeRect(4, 4, 120, 72);
      context.fillStyle = "#2a1730";
      context.font = "800 46px 'Bagel Fat One', 'Nunito Variable', sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(String(number), 64, 44);
    }
    const texture = new CanvasTexture(surface);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }
}
