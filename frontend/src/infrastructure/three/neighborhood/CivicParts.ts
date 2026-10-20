import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, PlaneGeometry, type CanvasTexture } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { TextureCanvas } from "../TextureCanvas.js";

export class CivicParts {
  /**
   * Letrero de madera pintada con el nombre del edificio, con su tabla de bordes redondos y las letras al frente.
   *
   * @param text - Lo que dice el letrero.
   * @param color - Color de la tabla, en hexadecimal.
   * @param width - Ancho del letrero.
   * @returns El letrero, de frente hacia +z.
   */
  static sign(text: string, color: number, width: number): Group {
    const sign = new Group();
    const board = new Mesh(new RoundedBoxGeometry(width, width * 0.28, 0.06, 2, 0.03), new MeshStandardMaterial({ color, roughness: 0.6 }));
    const face = new Mesh(new PlaneGeometry(width * 0.92, width * 0.24), new MeshStandardMaterial({ map: CivicParts.lettering(text), transparent: true, roughness: 0.6 }));
    face.position.z = 0.032;
    sign.add(board, face);
    return sign;
  }

  /**
   * @param stripes - Colores de las franjas, en CSS.
   * @returns Lona de franjas verticales con borde de festón, para toldos.
   */
  static awning(stripes: readonly string[]): CanvasTexture {
    return TextureCanvas.build(`toldo-${stripes.join("-")}`, 128, 64, false, (context, rng, width, height) => {
      const band = width / (stripes.length * 2);
      for (let index = 0; index < stripes.length * 2; index += 1) {
        context.fillStyle = stripes[index % stripes.length] as string;
        context.fillRect(index * band, 0, band + 1, height);
      }
      for (let index = 0; index < 300; index += 1) {
        context.fillStyle = `rgba(0,0,0,${rng.between(0.02, 0.06)})`;
        context.fillRect(rng.between(0, width), rng.between(0, height), 1.5, 1.5);
      }
    });
  }

  /**
   * Círculo con letra o carátula, pintado sobre un disco delgado: la H del helipuerto o un reloj.
   *
   * @param kind - `helipuerto` o `reloj`.
   * @param radius - Radio del disco.
   * @returns El disco, acostado si es helipuerto o de frente si es reloj.
   */
  static disc(kind: "helipuerto" | "reloj", radius: number): Mesh {
    const texture = TextureCanvas.build(`disco-${kind}`, 128, 128, false, (context) => {
      context.fillStyle = kind === "helipuerto" ? "#5a4a6a" : "#fffaf2";
      context.beginPath();
      context.arc(64, 64, 64, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = kind === "helipuerto" ? "#ffe35c" : "#2a2233";
      context.lineWidth = 8;
      context.beginPath();
      context.arc(64, 64, 52, 0, Math.PI * 2);
      context.stroke();
      if (kind === "helipuerto") {
        context.fillStyle = "#ffffff";
        context.font = "800 64px 'Bagel Fat One', sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("H", 64, 68);
        return;
      }
      context.lineCap = "round";
      context.lineWidth = 7;
      context.beginPath();
      context.moveTo(64, 64);
      context.lineTo(64, 30);
      context.moveTo(64, 64);
      context.lineTo(88, 72);
      context.stroke();
    });
    const disc = new Mesh(new CylinderGeometry(radius, radius, 0.03, 32), new MeshStandardMaterial({ map: texture, roughness: 0.5 }));
    if (kind === "reloj") disc.rotation.x = Math.PI / 2;
    return disc;
  }

  private static lettering(text: string): CanvasTexture {
    return TextureCanvas.build(`letrero-${text}`, 256, 64, false, (context, _rng, width, height) => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#fffaf2";
      context.strokeStyle = "#2a1730";
      context.lineWidth = 6;
      context.font = "800 40px 'Bagel Fat One', 'Nunito Variable', sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.strokeText(text, width / 2, height / 2 + 2);
      context.fillText(text, width / 2, height / 2 + 2);
    });
  }
}
