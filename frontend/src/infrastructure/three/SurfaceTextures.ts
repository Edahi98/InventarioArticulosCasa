import type { CanvasTexture } from "three";
import { TextureCanvas } from "./TextureCanvas.js";
import { SeededRandom } from "./neighborhood/SeededRandom.js";

export class SurfaceTextures {
  /**
   * @returns Textura de roca clara con manchas, vetas y grietas; sirve también como relieve.
   */
  static rock(): CanvasTexture {
    return TextureCanvas.build("rock", 256, 256, false, (context, rng, width, height) => {
      const base = context.createLinearGradient(0, 0, 0, height);
      base.addColorStop(0, "#eef0f4");
      base.addColorStop(1, "#b5bcc8");
      context.fillStyle = base;
      context.fillRect(0, 0, width, height);
      for (let index = 0; index < 240; index += 1) {
        context.fillStyle = rng.chance(0.6) ? `rgba(60,72,96,${rng.between(0.06, 0.22)})` : `rgba(255,255,255,${rng.between(0.1, 0.25)})`;
        context.beginPath();
        context.ellipse(rng.between(0, width), rng.between(0, height), rng.between(4, 28), rng.between(3, 16), rng.between(0, 3), 0, Math.PI * 2);
        context.fill();
      }
      context.strokeStyle = "rgba(36,44,70,0.4)";
      context.lineWidth = 2;
      for (let index = 0; index < 18; index += 1) {
        let x = rng.between(0, width);
        let y = rng.between(0, height);
        context.beginPath();
        context.moveTo(x, y);
        for (let step = 0; step < 4; step += 1) {
          x += rng.between(-18, 18);
          y += rng.between(6, 22);
          context.lineTo(x, y);
        }
        context.stroke();
      }
    });
  }

  /**
   * @returns Grano fino casi blanco, para que la plastilina no se vea lisa; sirve también como relieve.
   */
  static clay(): CanvasTexture {
    return TextureCanvas.build("clay", 128, 128, false, (context, rng, width, height) => {
      context.fillStyle = "#f6f6f6";
      context.fillRect(0, 0, width, height);
      for (let index = 0; index < 340; index += 1) {
        context.fillStyle = rng.chance(0.6) ? `rgba(0,0,0,${rng.between(0.05, 0.12)})` : `rgba(255,255,255,${rng.between(0.5, 0.9)})`;
        context.beginPath();
        context.arc(rng.between(0, width), rng.between(0, height), rng.between(0.8, 2.6), 0, Math.PI * 2);
        context.fill();
      }
    });
  }

  /**
   * @returns Pelusa de trazos cortos en todas direcciones, para el pelaje de los ositos; sirve también como relieve.
   */
  static fur(): CanvasTexture {
    return TextureCanvas.build("fur", 128, 128, false, (context, rng, width, height) => {
      context.fillStyle = "#f8f8f8";
      context.fillRect(0, 0, width, height);
      context.lineWidth = 1;
      for (let index = 0; index < 900; index += 1) {
        const x = rng.between(0, width);
        const y = rng.between(0, height);
        const angle = rng.between(0, Math.PI * 2);
        const length = rng.between(3, 8);
        context.strokeStyle = rng.chance(0.5) ? `rgba(90,60,70,${rng.between(0.07, 0.16)})` : `rgba(255,255,255,${rng.between(0.5, 0.9)})`;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
        context.stroke();
      }
    });
  }

  /**
   * @returns Manchas de hojas más claras y más oscuras, para follaje y corteza de los árboles.
   */
  static foliage(): CanvasTexture {
    return TextureCanvas.build("foliage", 128, 128, false, (context, rng, width, height) => {
      context.fillStyle = "#f4f4f4";
      context.fillRect(0, 0, width, height);
      for (let index = 0; index < 150; index += 1) {
        context.fillStyle = rng.chance(0.55) ? `rgba(20,60,30,${rng.between(0.08, 0.2)})` : `rgba(255,255,255,${rng.between(0.3, 0.6)})`;
        context.beginPath();
        context.ellipse(rng.between(0, width), rng.between(0, height), rng.between(3, 14), rng.between(2, 9), rng.between(0, 3), 0, Math.PI * 2);
        context.fill();
      }
    });
  }

  /**
   * @returns Pasto de briznas cortas y manchones suaves, en mosaico, para praderas; sirve también como relieve.
   */
  static grass(): CanvasTexture {
    const texture = TextureCanvas.build("grass", 256, 256, true, (context, rng, width, height) => {
      context.fillStyle = "#f2f2f2";
      context.fillRect(0, 0, width, height);
      for (let index = 0; index < 50; index += 1) {
        context.fillStyle = `rgba(0,60,20,${rng.between(0.04, 0.09)})`;
        context.beginPath();
        context.ellipse(rng.between(0, width), rng.between(0, height), rng.between(14, 40), rng.between(10, 26), rng.between(0, 3), 0, Math.PI * 2);
        context.fill();
      }
      context.lineWidth = 1.5;
      for (let index = 0; index < 1400; index += 1) {
        const x = rng.between(0, width);
        const y = rng.between(0, height);
        context.strokeStyle = rng.chance(0.55) ? `rgba(0,70,20,${rng.between(0.12, 0.26)})` : `rgba(255,255,255,${rng.between(0.4, 0.8)})`;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + rng.between(-2, 2), y - rng.between(4, 9));
        context.stroke();
      }
    });
    texture.repeat.set(28, 28);
    return texture;
  }

  /**
   * @returns Asfalto con gravilla, en mosaico, para las calles.
   */
  static asphalt(): CanvasTexture {
    return TextureCanvas.build("asphalt", 128, 128, true, (context, rng, width, height) => {
      context.fillStyle = "#e4e4e4";
      context.fillRect(0, 0, width, height);
      for (let index = 0; index < 700; index += 1) {
        context.fillStyle = rng.chance(0.55) ? `rgba(0,0,0,${rng.between(0.1, 0.28)})` : `rgba(255,255,255,${rng.between(0.4, 0.8)})`;
        context.beginPath();
        context.arc(rng.between(0, width), rng.between(0, height), rng.between(0.6, 2.2), 0, Math.PI * 2);
        context.fill();
      }
    });
  }

  /**
   * @returns Losa gastada: granito fino, vetas suaves y el borde un poco más oscuro, casi blanca para teñirla.
   */
  static flagstone(): CanvasTexture {
    return TextureCanvas.build("flagstone", 128, 128, false, (context, rng, width, height) => {
      const base = context.createRadialGradient(width / 2, height / 2, 8, width / 2, height / 2, width * 0.7);
      base.addColorStop(0, "#ffffff");
      base.addColorStop(1, "#d9d2d6");
      context.fillStyle = base;
      context.fillRect(0, 0, width, height);
      for (let index = 0; index < 420; index += 1) {
        context.fillStyle = rng.chance(0.55) ? `rgba(70,40,60,${rng.between(0.05, 0.16)})` : `rgba(255,255,255,${rng.between(0.4, 0.85)})`;
        context.beginPath();
        context.arc(rng.between(0, width), rng.between(0, height), rng.between(0.6, 2.4), 0, Math.PI * 2);
        context.fill();
      }
      context.strokeStyle = "rgba(90,50,70,0.18)";
      context.lineWidth = 1.5;
      for (let index = 0; index < 5; index += 1) {
        context.beginPath();
        context.moveTo(rng.between(0, width), rng.between(0, height));
        context.quadraticCurveTo(rng.between(0, width), rng.between(0, height), rng.between(0, width), rng.between(0, height));
        context.stroke();
      }
    });
  }

  /**
   * @returns Mosaico de piedritas redondas con junta, en mosaico, para el borde del camino; sirve también como relieve.
   */
  static cobble(): CanvasTexture {
    return TextureCanvas.build("cobble", 128, 128, true, (context, rng, width, height) => {
      context.fillStyle = "#a99aa6";
      context.fillRect(0, 0, width, height);
      const step = 16;
      for (let row = 0; row < height / step; row += 1) {
        for (let column = 0; column < width / step; column += 1) {
          const x = column * step + (row % 2) * (step / 2) + rng.between(-2, 2);
          const y = row * step + step / 2 + rng.between(-2, 2);
          const light = Math.round(rng.between(225, 255));
          context.fillStyle = `rgb(${light},${light - 6},${light - 2})`;
          context.beginPath();
          context.ellipse(x, y, rng.between(5.5, 7.5), rng.between(5, 7), rng.between(0, 3), 0, Math.PI * 2);
          context.fill();
          if (x < step) {
            context.beginPath();
            context.ellipse(x + width, y, 6.5, 6, 0, 0, Math.PI * 2);
            context.fill();
          }
        }
      }
    });
  }

  /**
   * @returns Corteza de vetas largas y onduladas, en mosaico, para troncos retorcidos; sirve también como relieve.
   */
  static bark(): CanvasTexture {
    return TextureCanvas.build("bark", 256, 128, true, (context, rng, width, height) => {
      context.fillStyle = "#f1ebe8";
      context.fillRect(0, 0, width, height);
      context.lineCap = "round";
      for (let index = 0; index < 46; index += 1) {
        const y = rng.between(0, height);
        context.strokeStyle = rng.chance(0.6) ? `rgba(70,35,30,${rng.between(0.12, 0.3)})` : `rgba(255,255,255,${rng.between(0.5, 0.9)})`;
        context.lineWidth = rng.between(1.5, 4.5);
        context.beginPath();
        context.moveTo(0, y);
        for (let x = 0; x <= width; x += 32) context.lineTo(x, y + Math.sin(x * 0.05 + index) * rng.between(2, 7));
        context.stroke();
      }
      for (let index = 0; index < 8; index += 1) {
        context.fillStyle = "rgba(70,35,30,0.22)";
        context.beginPath();
        context.ellipse(rng.between(0, width), rng.between(0, height), rng.between(6, 11), rng.between(3, 6), 0, 0, Math.PI * 2);
        context.fill();
      }
    });
  }

  /**
   * @returns Tejas de escama en hileras desfasadas, casi blancas para teñirlas, en mosaico; sirve también como relieve.
   */
  static shingles(): CanvasTexture {
    return TextureCanvas.build("shingles", 128, 128, true, SurfaceTextures.paintShingles);
  }

  /**
   * @returns Las mismas tejas, repetidas para techos redondos (cúpulas y conos con coordenadas de 0 a 1).
   */
  static roundShingles(): CanvasTexture {
    const texture = TextureCanvas.build("shingles-round", 128, 128, true, SurfaceTextures.paintShingles);
    texture.repeat.set(10, 3);
    return texture;
  }

  private static paintShingles(this: void, context: CanvasRenderingContext2D, rng: SeededRandom, width: number, height: number): void {
    context.fillStyle = "#cfc6cc";
    context.fillRect(0, 0, width, height);
    const size = 16;
    for (let row = height / size; row >= -1; row -= 1) {
      for (let column = -1; column <= width / size; column += 1) {
        const x = column * size + (Math.abs(row) % 2 === 0 ? 0 : size / 2);
        const y = row * size;
        const light = Math.round(rng.between(232, 255));
        context.fillStyle = `rgb(${light},${light},${light})`;
        context.strokeStyle = "rgba(80,50,70,0.35)";
        context.lineWidth = 1.4;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x, y + size * 0.55);
        context.arc(x + size / 2, y + size * 0.55, size / 2, Math.PI, 0, true);
        context.lineTo(x + size, y);
        context.closePath();
        context.fill();
        context.stroke();
      }
    }
  }

  /**
   * Sombrero de hongo moteado: el color de fondo con lunares blancos de varios tamaños.
   *
   * @param color - Color del sombrero, en hexadecimal.
   * @returns La textura, guardada por color.
   */
  static spotted(color: number): CanvasTexture {
    const css = `#${color.toString(16).padStart(6, "0")}`;
    return TextureCanvas.build(`spotted-${css}`, 256, 128, true, (context, rng, width, height) => {
      context.fillStyle = css;
      context.fillRect(0, 0, width, height);
      for (let index = 0; index < 260; index += 1) {
        context.fillStyle = `rgba(0,0,0,${rng.between(0.03, 0.08)})`;
        context.beginPath();
        context.arc(rng.between(0, width), rng.between(0, height), rng.between(1, 3), 0, Math.PI * 2);
        context.fill();
      }
      SurfaceTextures.dots(context, new SeededRandom("lunares"), width, height, "#fffaf2");
    });
  }

  /**
   * @returns Máscara de los mismos lunares de `spotted` en blanco sobre negro, para que brillen de noche.
   */
  static spotGlow(): CanvasTexture {
    return TextureCanvas.build("spot-glow", 256, 128, true, (context, _rng, width, height) => {
      context.fillStyle = "#000000";
      context.fillRect(0, 0, width, height);
      SurfaceTextures.dots(context, new SeededRandom("lunares"), width, height, "#ffffff");
    });
  }

  private static dots(context: CanvasRenderingContext2D, rng: SeededRandom, width: number, height: number, fill: string): void {
    context.fillStyle = fill;
    for (let index = 0; index < 22; index += 1) {
      const y = rng.between(height * 0.08, height * 0.85);
      const radius = rng.between(5, 13) * (1 - y / height / 2);
      const x = rng.between(0, width);
      [x, x - width, x + width].forEach((at) => {
        context.beginPath();
        context.ellipse(at, y, radius * 1.3, radius, 0, 0, Math.PI * 2);
        context.fill();
      });
    }
  }

  /**
   * @returns Ondas finas de agua, en mosaico, para el mar; sirve también como relieve.
   */
  static ripples(): CanvasTexture {
    const texture = TextureCanvas.build("ripples", 256, 256, true, (context, rng, width, height) => {
      context.fillStyle = "#f4f8fb";
      context.fillRect(0, 0, width, height);
      context.lineWidth = 2;
      for (let index = 0; index < 90; index += 1) {
        const x = rng.between(0, width);
        const y = rng.between(0, height);
        context.strokeStyle = rng.chance(0.5) ? `rgba(20,90,160,${rng.between(0.1, 0.22)})` : `rgba(255,255,255,${rng.between(0.6, 0.95)})`;
        context.beginPath();
        context.moveTo(x, y);
        context.quadraticCurveTo(x + rng.between(8, 18), y - rng.between(4, 9), x + rng.between(20, 38), y);
        context.stroke();
      }
    });
    texture.repeat.set(30, 30);
    return texture;
  }
}
