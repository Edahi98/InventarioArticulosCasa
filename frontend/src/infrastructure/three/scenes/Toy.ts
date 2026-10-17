import { CylinderGeometry, Mesh, SphereGeometry, type Object3D } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { ClayMaterials } from "../park/ClayMaterials.js";
import type { Interactive } from "../park/ParkInteraction.js";
import type { Vector3 } from "three";

export class Toy {
  /**
   * Fábrica de piezas redondeadas de plastilina para armar las figuras de los escenarios.
   *
   * @param clay - Materiales compartidos.
   */
  constructor(readonly clay: ClayMaterials) {}

  /**
   * @param size - Ancho, alto y fondo.
   * @param color - Color hexadecimal.
   * @param at - Posición.
   * @param radius - Redondeo de las esquinas; por defecto un cuarto de lo más delgado.
   * @returns Una caja de esquinas suaves.
   */
  box(size: [number, number, number], color: number, at: [number, number, number] = [0, 0, 0], radius?: number): Mesh {
    const [w, h, d] = size;
    const mesh = new Mesh(new RoundedBoxGeometry(w, h, d, 3, radius ?? Math.min(w, h, d) * 0.25), this.clay.get(color));
    mesh.position.set(...at);
    return mesh;
  }

  /**
   * @param radius - Radio.
   * @param color - Color hexadecimal.
   * @param at - Posición.
   * @returns Una bola lisa.
   */
  ball(radius: number, color: number, at: [number, number, number] = [0, 0, 0]): Mesh {
    const mesh = new Mesh(new SphereGeometry(radius, 16, 12), this.clay.get(color));
    mesh.position.set(...at);
    return mesh;
  }

  /**
   * @param top - Radio de arriba.
   * @param bottom - Radio de abajo.
   * @param height - Alto.
   * @param color - Color hexadecimal.
   * @param at - Posición.
   * @returns Un cilindro.
   */
  cylinder(top: number, bottom: number, height: number, color: number, at: [number, number, number] = [0, 0, 0]): Mesh {
    const mesh = new Mesh(new CylinderGeometry(top, bottom, height, 20), this.clay.get(color));
    mesh.position.set(...at);
    return mesh;
  }

  /**
   * Marca una figura como tocable y la añade a la lista de interactivos.
   *
   * @param list - Lista donde se registra.
   * @param id - Identificador único.
   * @param object - Figura que se toca.
   * @param hit - Qué pasa al tocarla.
   */
  static register(list: Interactive[], id: string, object: Object3D, hit: (now: number, point: Vector3) => void): void {
    object.userData.interactiveId = id;
    list.push({ id, object, hit });
  }
}
