import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry } from "three";

export interface BuiltCar {
  group: Group;
  headlights: MeshStandardMaterial;
}

const GLASS = 0xfff6dc;
const TIRE = 0x3a2a40;

export class ToyCar {
  /**
   * Coche de juguete: carrocería redondeada de un color, cabina clara, cuatro ruedas y dos faros que
   * se encienden de noche. Mira hacia +x.
   *
   * @param color - Color de la carrocería.
   * @returns El coche y el material de sus faros.
   */
  static build(color: number): BuiltCar {
    const body = new MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05 });
    const cabin = new MeshStandardMaterial({ color: GLASS, roughness: 0.4 });
    const tire = new MeshStandardMaterial({ color: TIRE, roughness: 0.9 });
    const headlights = new MeshStandardMaterial({ color: GLASS, emissive: 0xffe9a8, emissiveIntensity: 0.3 });

    const car = new Group();
    const chassis = new Mesh(new BoxGeometry(0.95, 0.26, 0.5), body);
    chassis.position.y = 0.26;
    const roof = new Mesh(new BoxGeometry(0.5, 0.24, 0.44), cabin);
    roof.position.set(-0.05, 0.5, 0);
    car.add(chassis, roof);
    [-0.3, 0.3].forEach((x) =>
      [-0.25, 0.25].forEach((z) => {
        const wheel = new Mesh(new CylinderGeometry(0.1, 0.1, 0.08, 14), tire);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(x, 0.1, z);
        car.add(wheel);
      }),
    );
    [-0.16, 0.16].forEach((z) => {
      const lamp = new Mesh(new SphereGeometry(0.05, 10, 8), headlights);
      lamp.position.set(0.49, 0.28, z);
      car.add(lamp);
    });
    car.traverse((part) => {
      part.castShadow = true;
    });
    return { group: car, headlights };
  }
}
