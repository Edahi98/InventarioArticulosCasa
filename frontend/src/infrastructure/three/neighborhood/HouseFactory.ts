import { Color, MeshStandardMaterial, SRGBColorSpace } from "three";
import { BungalowTemplate } from "./BungalowTemplate.js";
import { CabinTemplate } from "./CabinTemplate.js";
import { CottageTemplate } from "./CottageTemplate.js";
import { HouseDetails } from "./HouseDetails.js";
import { HouseParts } from "./HouseParts.js";
import type { BuiltHouse, HouseStyle, HouseTemplate } from "./HouseTemplate.js";
import { HueSequence } from "./HueSequence.js";
import { SeededRandom } from "./SeededRandom.js";
import { TowerTemplate } from "./TowerTemplate.js";
import { TownhouseTemplate } from "./TownhouseTemplate.js";

const TRIM = 0xfff6dc;
const DOOR_SHIFTS = [0.5, 0.42, 0.58] as const;

export class HouseFactory {
  /**
   * @param templates - Plantillas disponibles; cada casa usa una al azar.
   */
  constructor(
    private readonly templates: HouseTemplate[] = [
      new CottageTemplate(),
      new TownhouseTemplate(),
      new BungalowTemplate(),
      new CabinTemplate(),
      new TowerTemplate(),
    ],
  ) {}

  /**
   * Crea la casa de una categoría. La plantilla, los colores y los detalles salen del azar pero se
   * deciden con el id, así que la casa de una categoría se ve igual cada vez.
   *
   * @param categoryId - Identificador de la categoría.
   * @returns La casa lista para colocar en el barrio.
   */
  create(categoryId: number): BuiltHouse {
    const rng = new SeededRandom(categoryId * 7919 + 13);
    const style = HouseFactory.styleFor(categoryId, rng);
    const glass = new MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffd37a, emissiveIntensity: 0.55, roughness: 0.4 });
    const template = rng.pick(this.templates);
    const parts = new HouseParts(glass, style.trim);
    const built = template.build({ style, rng, parts });
    new HouseDetails(parts, style, glass).decorate(built.group, built.door, categoryId);
    return { ...built, glass, templateId: template.id };
  }

  /**
   * @param categoryId - Identificador de la categoría.
   * @returns El color claro con que se pinta el jardín de la casa.
   */
  static gardenColor(categoryId: number): number {
    return HouseFactory.hsl(HueSequence.hueOf(categoryId), 0.55, 0.84);
  }

  /**
   * @param categoryId - Identificador de la categoría.
   * @returns El color principal de la categoría, el mismo del techo.
   */
  static accentColor(categoryId: number): number {
    return HouseFactory.hsl(HueSequence.hueOf(categoryId), 0.58, 0.62);
  }

  private static styleFor(categoryId: number, rng: SeededRandom): HouseStyle {
    const hue = HueSequence.hueOf(categoryId);
    return {
      wall: HouseFactory.hsl(hue, 0.6, 0.9),
      roof: HouseFactory.hsl(hue, 0.58, 0.62),
      door: HouseFactory.hsl((hue + rng.pick(DOOR_SHIFTS)) % 1, 0.6, 0.45),
      trim: TRIM,
    };
  }

  private static hsl(hue: number, saturation: number, lightness: number): number {
    return new Color().setHSL(hue, saturation, lightness, SRGBColorSpace).getHex();
  }
}
