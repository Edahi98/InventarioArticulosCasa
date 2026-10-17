import type { Object3D, Vector3 } from "three";

export interface Interactive {
  id: string;
  object: Object3D;
  hit(now: number, point: Vector3): void;
  hover?(on: boolean): void;
}
