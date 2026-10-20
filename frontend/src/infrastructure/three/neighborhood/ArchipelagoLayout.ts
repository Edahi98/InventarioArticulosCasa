import {
  CASTLE_RADIUS,
  CASTLES_MAX,
  CASTLES_PER_ISLAND,
  CIVIC_PER_ISLAND,
  COMMERCE_LOTS,
  GOLDEN_ANGLE,
  HOUSES_PER_ISLAND,
  ISLAND_CHANNEL,
  ISLAND_THEMES,
  ISLANDS_MAX,
  OUTPOST_ANGLE,
  OUTPOSTS_MAX,
  SINGLE_ISLAND_MAX,
} from "../../../constantes/barrio_constantes.js";
import type { MapCategory } from "./NeighborhoodBuilder.js";
import { OUTPOST_RADIUS, type OutpostKind } from "./Outpost.js";
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
  id: number;
  x: number;
  z: number;
  radius: number;
  anchor: number;
  angle: number;
}

export interface OutpostPlan {
  x: number;
  z: number;
  angle: number;
  kind: OutpostKind;
}

export interface ArchipelagoPlan {
  islands: IslandPlan[];
  castles: CastlePlan[];
  outposts: OutpostPlan[];
  radius: number;
}

const OUTPOST_SPAN = 7.5;
const OUTPOST_KINDS: OutpostKind[] = ["faro", "picnic", "fuente"];
const SPIRAL_PACKING = 1.45;
const RELAX_STEPS = 24;
const OUTPOST_CANDIDATES = 24;

interface Body {
  x: number;
  z: number;
  r: number;
  island: number;
  castle: number;
}

export class ArchipelagoLayout {
  /**
   * Reparte las categorías (ordenadas por id) entre varias islas parecidas: pocas caben en una isla, muchas se
   * dividen en un archipiélago con la isla principal al centro y sus hermanas alrededor, repartidas en espiral para
   * que las casas llenen todo el mapa y no se amontonen. Cada isla tiene su propia calle en anillo, sus casas, dos
   * edificios del pueblo y un lote libre por cada puente de carros: el plan se gira para que ese lote mire hacia la
   * isla vecina y de ahí salga la calle de enlace. Por el mismo motivo hay varios castillos, cada uno con su isla al
   * borde del archipiélago y un puente de piedra hasta la isla que lo ancla. Al final todo se recorre para que
   * el archipiélago quede centrado en el origen.
   *
   * @param categories - Categorías del inventario.
   * @param rng - Azar con semilla, para que el archipiélago siempre salga igual.
   * @returns Las islas con su plan ya colocado, los castillos, las islitas de los puentes y el radio que abarca todo.
   */
  static plan(categories: MapCategory[], rng: SeededRandom): ArchipelagoPlan {
    const sorted = [...categories].sort((a, b) => a.id - b.id);
    const chunks = ArchipelagoLayout.chunks(sorted);
    const islandCount = chunks.length;
    const themes = chunks.map((_, index) => ArchipelagoLayout.themes(index, islandCount));
    const castleCount = ArchipelagoLayout.castleCount(islandCount);
    const anchors = ArchipelagoLayout.anchors(islandCount, castleCount);
    const junctions = new Array<number>(islandCount).fill(1);
    junctions[0] = islandCount - 1;
    anchors.forEach((anchor) => {
      junctions[anchor] = (junctions[anchor] as number) + 1;
    });

    const local = chunks.map((chunk, index) => {
      const own = themes[index] as IslandTheme[];
      const commerce = own.includes("comercio") ? COMMERCE_LOTS : 0;
      const port = own.includes("puerto") ? 1 : 0;
      const links = junctions[index] as number;
      return RingLayout.plan(Math.max(chunk.length, 1) + CIVIC_PER_ISLAND + commerce + port + links, rng, links + commerce + port);
    });

    const radii = local.map((plan) => plan.islandRadius);
    const biggest = Math.max(...radii);
    const separation = (2 * biggest + ISLAND_CHANNEL) / SPIRAL_PACKING;
    const centers = local.map((_, index) => {
      if (index === 0) return { x: 0, z: 0 };
      const radius = separation * Math.sqrt(index);
      const angle = ArchipelagoLayout.spiralAngle(index);
      return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
    });

    const castles: CastlePlan[] = anchors.map((anchor, id) => {
      const center = centers[anchor] as { x: number; z: number };
      const outward = Math.hypot(center.x, center.z) > 0.5 ? Math.atan2(center.z, center.x) : OUTPOST_ANGLE;
      const distance = (radii[anchor] as number) + CASTLE_RADIUS + ISLAND_CHANNEL;
      return {
        id,
        x: center.x + Math.cos(outward) * distance,
        z: center.z + Math.sin(outward) * distance,
        radius: CASTLE_RADIUS,
        anchor,
        angle: outward + Math.PI,
      };
    });

    const bodies: Body[] = [
      ...local.map((plan, index) => ({
        x: (centers[index] as { x: number; z: number }).x,
        z: (centers[index] as { x: number; z: number }).z,
        r: plan.islandRadius,
        island: index,
        castle: -1,
      })),
      ...castles.map((castle) => ({ x: castle.x, z: castle.z, r: castle.radius, island: -1, castle: castle.id })),
    ];
    ArchipelagoLayout.relax(bodies);
    bodies.forEach((body) => {
      if (body.island >= 0) {
        const center = centers[body.island] as { x: number; z: number };
        center.x = body.x;
        center.z = body.z;
        return;
      }
      const castle = castles[body.castle] as CastlePlan;
      castle.x = body.x;
      castle.z = body.z;
    });
    castles.forEach((castle) => {
      const anchor = centers[castle.anchor] as { x: number; z: number };
      castle.angle = Math.atan2(anchor.z - castle.z, anchor.x - castle.x);
    });

    const outposts = ArchipelagoLayout.outposts(islandCount, radii[0] as number, centers, local, castles);
    const circles = [
      ...local.map((plan, index) => ({ x: (centers[index] as { x: number; z: number }).x, z: (centers[index] as { x: number; z: number }).z, r: plan.islandRadius })),
      ...castles.map((castle) => ({ x: castle.x, z: castle.z, r: castle.radius })),
      ...outposts.map((spot) => ({ x: spot.x, z: spot.z, r: OUTPOST_RADIUS })),
    ];
    const shiftX = -(Math.min(...circles.map((c) => c.x - c.r)) + Math.max(...circles.map((c) => c.x + c.r))) / 2;
    const shiftZ = -(Math.min(...circles.map((c) => c.z - c.r)) + Math.max(...circles.map((c) => c.z + c.r))) / 2;
    centers.forEach((center) => {
      center.x += shiftX;
      center.z += shiftZ;
    });
    castles.forEach((castle) => {
      castle.x += shiftX;
      castle.z += shiftZ;
    });
    outposts.forEach((spot) => {
      spot.x += shiftX;
      spot.z += shiftZ;
    });

    const targets = [
      ...centers.map((center) => ({ x: center.x, z: center.z })),
      ...castles.map((castle) => ({ x: castle.x, z: castle.z })),
    ];
    const islands = local.map((raw, index) => {
      const center = targets[index] as { x: number; z: number };
      const partners: number[] = index === 0 ? centers.slice(1).map((_, other) => other + 1) : [0];
      castles.forEach((castle) => {
        if (castle.anchor === index) partners.push(islandCount + castle.id);
      });
      const wanted = partners.map((partner) => {
        const target = targets[partner] as { x: number; z: number };
        return { partner, angle: Math.atan2(target.z - center.z, target.x - center.x) };
      });
      return ArchipelagoLayout.arrange(index, chunks[index] as MapCategory[], raw, wanted, center.x, center.z, themes[index] as IslandTheme[]);
    });

    return {
      islands,
      castles,
      outposts,
      radius: Math.max(...circles.map((c) => Math.hypot(c.x + shiftX, c.z + shiftZ) + c.r)),
    };
  }

  private static spiralAngle(index: number): number {
    return (OUTPOST_ANGLE + index * GOLDEN_ANGLE) % (Math.PI * 2);
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
    if (count <= ISLAND_THEMES.length) return ISLAND_THEMES.filter((_, theme) => theme % count === index);
    return [ISLAND_THEMES[index % ISLAND_THEMES.length] as IslandTheme];
  }

  private static castleCount(islandCount: number): number {
    return Math.min(CASTLES_MAX, Math.max(1, Math.floor(islandCount / CASTLES_PER_ISLAND)));
  }

  /**
   * Elige las islas que anclan a los castillos, repartidas por el archipiélago: se ordenan las hermanas por su
   * ángulo en la espiral y se toma una de cada tanto, para que los castillos caigan en puntos opuestos y no todos en
   * el mismo rincón.
   *
   * @param islandCount - Cuántas islas hay.
   * @param castleCount - Cuántos castillos hacen falta.
   * @returns Los índices de las islas ancla.
   */
  private static anchors(islandCount: number, castleCount: number): number[] {
    if (islandCount <= 1) return [0];
    const order = Array.from({ length: islandCount - 1 }, (_, index) => index + 1).sort(
      (a, b) => ArchipelagoLayout.spiralAngle(a) - ArchipelagoLayout.spiralAngle(b),
    );
    return Array.from({ length: castleCount }, (_, index) => order[Math.floor((index * order.length) / castleCount)] as number);
  }

  /**
   * Separa las islas y los castillos que se pisen, empujándolos en la línea que los une. La isla principal se queda
   * quieta: es el centro del mapa.
   *
   * @param bodies - Los círculos de islas y castillos, que se corrigen en el sitio.
   */
  private static relax(bodies: Body[]): void {
    for (let step = 0; step < RELAX_STEPS; step += 1) {
      for (let a = 0; a < bodies.length; a += 1) {
        for (let b = a + 1; b < bodies.length; b += 1) {
          const one = bodies[a] as Body;
          const two = bodies[b] as Body;
          const dx = two.x - one.x;
          const dz = two.z - one.z;
          const distance = Math.hypot(dx, dz);
          const wanted = one.r + two.r + ISLAND_CHANNEL;
          if (distance >= wanted) continue;
          const overlap = wanted - distance;
          const ux = distance > 0.001 ? dx / distance : 1;
          const uz = distance > 0.001 ? dz / distance : 0;
          if (one.island === 0) {
            two.x += ux * overlap;
            two.z += uz * overlap;
          } else if (two.island === 0) {
            one.x -= ux * overlap;
            one.z -= uz * overlap;
          } else {
            one.x -= (ux * overlap) / 2;
            one.z -= (uz * overlap) / 2;
            two.x += (ux * overlap) / 2;
            two.z += (uz * overlap) / 2;
          }
        }
      }
    }
  }

  /**
   * Coloca las islitas de los puentes de arco alrededor de la isla principal, cada una en el ángulo que más se aleje de
   * las islas y los castillos ya puestos, para que el puente de cada una no atraviese ninguna casa.
   *
   * @param islandCount - Cuántas islas hay.
   * @param mainRadius - Radio de la isla principal.
   * @param centers - Centros de las islas.
   * @param local - Plan de cada isla.
   * @param castles - Los castillos.
   * @returns Las islitas con su sitio, su ángulo y su atracción.
   */
  private static outposts(
    islandCount: number,
    mainRadius: number,
    centers: { x: number; z: number }[],
    local: RingPlan[],
    castles: CastlePlan[],
  ): OutpostPlan[] {
    const count = Math.min(OUTPOSTS_MAX, Math.max(3, Math.ceil(islandCount / 2)));
    const distance = mainRadius + OUTPOST_SPAN + OUTPOST_RADIUS - 1;
    const occupied = [
      ...local.map((plan, index) => ({ x: (centers[index] as { x: number; z: number }).x, z: (centers[index] as { x: number; z: number }).z, r: plan.islandRadius })),
      ...castles.map((castle) => ({ x: castle.x, z: castle.z, r: castle.radius })),
    ];
    const outposts: OutpostPlan[] = [];
    for (let index = 0; index < count; index += 1) {
      let angle = OUTPOST_ANGLE + (index / count) * Math.PI * 2;
      let clearance = -Infinity;
      for (let step = 0; step < OUTPOST_CANDIDATES; step += 1) {
        const candidate = OUTPOST_ANGLE + (step / OUTPOST_CANDIDATES) * Math.PI * 2;
        const x = Math.cos(candidate) * distance;
        const z = Math.sin(candidate) * distance;
        const room = Math.min(...occupied.map((spot) => Math.hypot(x - spot.x, z - spot.z) - spot.r - OUTPOST_RADIUS));
        if (room <= clearance) continue;
        clearance = room;
        angle = candidate;
      }
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      outposts.push({ x, z, angle, kind: OUTPOST_KINDS[index % OUTPOST_KINDS.length] as OutpostKind });
      occupied.push({ x, z, r: OUTPOST_RADIUS });
    }
    return outposts;
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
