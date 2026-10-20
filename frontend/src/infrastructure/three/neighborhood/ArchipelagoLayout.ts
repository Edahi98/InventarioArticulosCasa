import {
  CASTLE_RADIUS,
  CIVIC_PER_ISLAND,
  COMMERCE_LOTS,
  HOUSES_PER_ISLAND,
  ISLAND_CHANNEL,
  ISLAND_THEMES,
  ISLANDS_MAX,
  OUTPOST_ANGLE,
  SINGLE_ISLAND_MAX,
} from "../../../constantes/barrio_constantes.js";
import type { MapCategory } from "./NeighborhoodBuilder.js";
import { OUTPOST_RADIUS } from "./Outpost.js";
import { RingLayout, type LotSlot, type RingPlan } from "./RingLayout.js";
import type { SeededRandom } from "./SeededRandom.js";

export type IslandTheme = (typeof ISLAND_THEMES)[number];

export interface IslandJunction {
  angle: number;
  slot: LotSlot;
  partner: number;
}

export interface IslandPlan {
  index: number;
  categories: MapCategory[];
  houseSlots: LotSlot[];
  civicSlots: LotSlot[];
  commerceSlots: LotSlot[];
  receiverSlot: LotSlot | null;
  themes: IslandTheme[];
  junctions: IslandJunction[];
  gapAngles: number[];
  plan: RingPlan;
  x: number;
  z: number;
}

export interface CastlePlan {
  x: number;
  z: number;
  radius: number;
  anchor: number;
  angle: number;
}

export interface ArchipelagoPlan {
  islands: IslandPlan[];
  castle: CastlePlan;
  outposts: { x: number; z: number; angle: number }[];
  radius: number;
}

const OUTPOST_SPAN = 7.5;
const OUTPOSTS = 3;
export const CASTLE_PARTNER = -1;

export class ArchipelagoLayout {
  /**
   * Reparte las categorías (ordenadas por id) entre varias islas parecidas: pocas caben en una isla, muchas se
   * dividen en un archipiélago con la isla principal al centro y sus hermanas alrededor, entre las islitas de los
   * puentes de arco. Cada isla tiene su propia calle en anillo, sus casas, dos edificios del pueblo y un lote libre por
   * cada puente de carros: el plan se gira para que ese lote mire hacia la isla vecina y de ahí salga la calle de
   * enlace. Al final todo se recorre para que el archipiélago quede centrado en el origen.
   *
   * @param categories - Categorías del inventario.
   * @param rng - Azar con semilla, para que el archipiélago siempre salga igual.
   * @returns Las islas con su plan ya colocado, las islitas de los puentes y el radio que abarca todo.
   */
  static plan(categories: MapCategory[], rng: SeededRandom): ArchipelagoPlan {
    const sorted = [...categories].sort((a, b) => a.id - b.id);
    const chunks = ArchipelagoLayout.chunks(sorted);
    const anchor = chunks.length - 1;
    const links = chunks.map((_, index) => (index === 0 ? chunks.length - 1 : 1) + (index === anchor ? 1 : 0));
    const themes = chunks.map((_, index) => ArchipelagoLayout.themes(index, chunks.length));
    const local = chunks.map((chunk, index) => {
      const own = themes[index] as IslandTheme[];
      const extra = (own.includes("comercio") ? COMMERCE_LOTS : 0) + (own.includes("puerto") ? 1 : 0);
      return RingLayout.plan(Math.max(chunk.length, 1) + CIVIC_PER_ISLAND + extra + (links[index] as number), rng);
    });
    const mainRadius = (local[0] as RingPlan).islandRadius;
    const biggest = Math.max(...local.map((plan) => plan.islandRadius));
    const centers = local.map((_, index) => {
      if (index === 0) return { x: 0, z: 0 };
      const angle = OUTPOST_ANGLE + Math.PI / OUTPOSTS + ((index - 1) * Math.PI * 2) / OUTPOSTS;
      const distance = mainRadius + biggest + ISLAND_CHANNEL;
      return { x: Math.cos(angle) * distance, z: Math.sin(angle) * distance };
    });
    const outpostDistance = mainRadius + OUTPOST_SPAN + OUTPOST_RADIUS - 1;
    const outposts = Array.from({ length: OUTPOSTS }, (_, index) => {
      const angle = OUTPOST_ANGLE + (index / OUTPOSTS) * Math.PI * 2;
      return { x: Math.cos(angle) * outpostDistance, z: Math.sin(angle) * outpostDistance, angle };
    });
    const anchorCenter = centers[anchor] as { x: number; z: number };
    const castleAngle = anchor === 0 ? OUTPOST_ANGLE + Math.PI / OUTPOSTS : Math.atan2(anchorCenter.z, anchorCenter.x);
    const castleDistance = (local[anchor] as RingPlan).islandRadius + CASTLE_RADIUS + ISLAND_CHANNEL;
    const castleCenter = { x: anchorCenter.x + Math.cos(castleAngle) * castleDistance, z: anchorCenter.z + Math.sin(castleAngle) * castleDistance };
    const circles = [
      ...centers.map((center, index) => ({ ...center, r: (local[index] as RingPlan).islandRadius })),
      { ...castleCenter, r: CASTLE_RADIUS },
      ...outposts.map((spot) => ({ x: spot.x, z: spot.z, r: OUTPOST_RADIUS })),
    ];
    const shiftX = -(Math.min(...circles.map((c) => c.x - c.r)) + Math.max(...circles.map((c) => c.x + c.r))) / 2;
    const shiftZ = -(Math.min(...circles.map((c) => c.z - c.r)) + Math.max(...circles.map((c) => c.z + c.r))) / 2;
    const islands = local.map((raw, index) => {
      const center = centers[index] as { x: number; z: number };
      const partners = [...(index === 0 ? centers.slice(1).map((_, other) => other + 1) : [0]), ...(index === anchor ? [CASTLE_PARTNER] : [])];
      const wanted = partners.map((partner) => {
        const target = partner === CASTLE_PARTNER ? castleCenter : (centers[partner] as { x: number; z: number });
        return { partner, angle: Math.atan2(target.z - center.z, target.x - center.x) };
      });
      return ArchipelagoLayout.arrange(index, chunks[index] as MapCategory[], raw, wanted, center.x + shiftX, center.z + shiftZ, themes[index] as IslandTheme[]);
    });
    return {
      islands,
      castle: { x: castleCenter.x + shiftX, z: castleCenter.z + shiftZ, radius: CASTLE_RADIUS, anchor, angle: castleAngle + Math.PI },
      outposts: outposts.map((spot) => ({ x: spot.x + shiftX, z: spot.z + shiftZ, angle: spot.angle })),
      radius: Math.max(...circles.map((c) => Math.hypot(c.x + shiftX, c.z + shiftZ) + c.r)),
    };
  }

  private static chunks(sorted: MapCategory[]): MapCategory[][] {
    const count = Math.max(sorted.length, 1);
    const islands = count <= SINGLE_ISLAND_MAX ? 1 : Math.min(Math.ceil(count / HOUSES_PER_ISLAND), ISLANDS_MAX);
    const size = Math.ceil(sorted.length / islands);
    return Array.from({ length: islands }, (_, index) => sorted.slice(index * size, (index + 1) * size));
  }

  /**
   * Reparte los temas entre las islas de forma fija: con pocas islas cada una junta varios temas y con muchas cada una
   * destaca uno.
   *
   * @param index - Posición de la isla.
   * @param count - Cuántas islas hay.
   * @returns Los temas de esa isla.
   */
  static themes(index: number, count: number): IslandTheme[] {
    return ISLAND_THEMES.filter((_, theme) => theme % count === index);
  }

  private static angleGap(a: number, b: number): number {
    return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  }

  private static arrange(
    index: number,
    categories: MapCategory[],
    raw: RingPlan,
    wanted: { partner: number; angle: number }[],
    x: number,
    z: number,
    themes: IslandTheme[],
  ): IslandPlan {
    const outerOf = (plan: RingPlan): number[] => plan.slots.map((slot, slotIndex) => ({ slot, slotIndex })).filter(({ slot }) => Math.hypot(slot.x, slot.z) > plan.roadRadius).map(({ slotIndex }) => slotIndex);
    const angleOf = (slot: LotSlot): number => Math.atan2(slot.z, slot.x);
    const first = wanted[0];
    const rawOuter = outerOf(raw);
    const nearest = first ? rawOuter.reduce((best, slotIndex) => (ArchipelagoLayout.angleGap(angleOf(raw.slots[slotIndex] as LotSlot), first.angle) < ArchipelagoLayout.angleGap(angleOf(raw.slots[best] as LotSlot), first.angle) ? slotIndex : best), rawOuter[0] as number) : -1;
    const turned = first ? RingLayout.rotate(raw, first.angle - angleOf(raw.slots[nearest] as LotSlot)) : raw;
    const outer = outerOf(turned);
    const used = new Set<number>();
    const junctions = wanted.map((want) => {
      const free = outer.filter((slotIndex) => !used.has(slotIndex));
      const pick = free.reduce((best, slotIndex) => (ArchipelagoLayout.angleGap(angleOf(turned.slots[slotIndex] as LotSlot), want.angle) < ArchipelagoLayout.angleGap(angleOf(turned.slots[best] as LotSlot), want.angle) ? slotIndex : best), free[0] as number);
      used.add(pick);
      return { slotIndex: pick, partner: want.partner };
    });
    const ordered = [...outer].sort((a, b) => angleOf(turned.slots[a] as LotSlot) - angleOf(turned.slots[b] as LotSlot));
    const runs = ordered
      .map((_, start) => Array.from({ length: COMMERCE_LOTS }, (__, step) => ordered[(start + step) % ordered.length] as number))
      .filter((run) => ordered.length >= COMMERCE_LOTS && run.every((slotIndex) => !used.has(slotIndex)));
    const clearance = (run: number[]): number =>
      Math.min(
        Math.PI,
        ...junctions.map((junction) => ArchipelagoLayout.angleGap(angleOf(turned.slots[run[1] as number] as LotSlot), angleOf(turned.slots[junction.slotIndex] as LotSlot))),
      );
    const commerce = themes.includes("comercio") ? runs.reduce<number[]>((best, run) => (best.length === 0 || clearance(run) > clearance(best) ? run : best), []) : [];
    commerce.forEach((slotIndex) => used.add(slotIndex));
    const receiver = themes.includes("puerto") ? (ordered.filter((slotIndex) => !used.has(slotIndex)).reverse()[0] ?? null) : null;
    if (receiver !== null) used.add(receiver);
    const remaining = turned.slots.map((_, slotIndex) => slotIndex).filter((slotIndex) => !used.has(slotIndex));
    const civic = new Set(Array.from({ length: CIVIC_PER_ISLAND }, (_, item) => remaining[Math.min(Math.round(((item + 0.5) * remaining.length) / CIVIC_PER_ISLAND), remaining.length - 1)] as number));
    const outerAngles = outer.map((slotIndex) => angleOf(turned.slots[slotIndex] as LotSlot)).sort((a, b) => a - b);
    const gapAngles = outerAngles.map((angle, item) => {
      const next = item + 1 < outerAngles.length ? (outerAngles[item + 1] as number) : (outerAngles[0] as number) + Math.PI * 2;
      return (angle + next) / 2;
    });
    const plan = RingLayout.shift(turned, x, z);
    return {
      index,
      categories,
      houseSlots: remaining.filter((slotIndex) => !civic.has(slotIndex)).map((slotIndex) => plan.slots[slotIndex] as LotSlot),
      civicSlots: remaining.filter((slotIndex) => civic.has(slotIndex)).map((slotIndex) => plan.slots[slotIndex] as LotSlot),
      commerceSlots: commerce.map((slotIndex) => plan.slots[slotIndex] as LotSlot),
      receiverSlot: receiver === null ? null : (plan.slots[receiver] as LotSlot),
      themes,
      junctions: junctions.map((junction) => {
        const slot = plan.slots[junction.slotIndex] as LotSlot;
        return { angle: Math.atan2(slot.z - z, slot.x - x), slot, partner: junction.partner };
      }),
      gapAngles,
      plan,
      x,
      z,
    };
  }
}
