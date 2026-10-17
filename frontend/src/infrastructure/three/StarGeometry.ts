import { ExtrudeGeometry, Shape } from "three";

export class StarGeometry {
  /**
   * Estrella de cinco puntas con bordes biselados, centrada en el origen y de radio 1.
   *
   * @returns La geometría; quien la use debe liberarla con `dispose()`.
   */
  static build(): ExtrudeGeometry {
    const outline = new Shape();
    for (let point = 0; point < 10; point += 1) {
      const radius = point % 2 === 0 ? 1 : 0.46;
      const angle = (point / 10) * Math.PI * 2 + Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (point === 0) outline.moveTo(x, y);
      else outline.lineTo(x, y);
    }
    outline.closePath();
    const geometry = new ExtrudeGeometry(outline, { depth: 0.35, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 3 });
    geometry.center();
    return geometry;
  }
}
