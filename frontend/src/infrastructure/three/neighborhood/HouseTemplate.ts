import type { Group, MeshStandardMaterial } from "three";
import type { HouseParts } from "./HouseParts.js";
import type { SeededRandom } from "./SeededRandom.js";

export interface HouseStyle {
  wall: number;
  roof: number;
  door: number;
  trim: number;
}

export interface HouseContext {
  style: HouseStyle;
  rng: SeededRandom;
  parts: HouseParts;
}

export interface BuiltHouse {
  group: Group;
  glass: MeshStandardMaterial;
  door: Group;
  chimney: [number, number, number];
  width: number;
  depth: number;
  height: number;
  templateId: string;
}

export interface HouseTemplate {
  readonly id: string;
  build(context: HouseContext): Omit<BuiltHouse, "glass" | "templateId">;
}
