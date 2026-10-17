import type { Group, Vector3 } from "three";
import type { Interactive } from "../park/ParkInteraction.js";

export interface ScenicWorld {
  readonly group: Group;
  readonly interactives: Interactive[];
  readonly outdoor: boolean;
  pop(point: Vector3, amount?: number): void;
  update(elapsed: number, night: number, moving: boolean): void;
}
