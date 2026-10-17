import type { CanvasTexture } from "three";
import { SurfaceTextures } from "../SurfaceTextures.js";
import { TextureCanvas } from "../TextureCanvas.js";

export class SeaTextures {
  /**
   * @returns Textura de roca clara con manchas, vetas y grietas; es la misma de las demás escenas.
   */
  static rock(): CanvasTexture {
    return SurfaceTextures.rock();
  }

  /**
   * @returns Textura de arena con rizos y granitos que se repite en mosaico; sirve también como relieve.
   */
  static sand(): CanvasTexture {
    const texture = TextureCanvas.build("sand", 256, 256, true, (context, rng, width, height) => {
      context.fillStyle = "#fbd062";
      context.fillRect(0, 0, width, height);
      context.lineWidth = 4;
      for (let row = 0; row < height; row += 16) {
        context.strokeStyle = `rgba(196,122,24,${rng.between(0.1, 0.2)})`;
        context.beginPath();
        for (let x = 0; x <= width; x += 8) context.lineTo(x, row + Math.sin((x / width) * Math.PI * 4 + row) * 3);
        context.stroke();
      }
      for (let index = 0; index < 900; index += 1) {
        context.fillStyle = rng.chance(0.55) ? `rgba(130,84,20,${rng.between(0.2, 0.45)})` : `rgba(255,248,214,${rng.between(0.3, 0.6)})`;
        context.beginPath();
        context.arc(rng.between(0, width), rng.between(0, height), rng.between(0.8, 3), 0, Math.PI * 2);
        context.fill();
      }
    });
    texture.repeat.set(40, 40);
    return texture;
  }

  /**
   * @returns Textura de red de reflejos de luz (cáusticas) con fondo transparente, para mezclar en suma sobre el fondo.
   */
  static caustics(): CanvasTexture {
    const texture = TextureCanvas.build("caustics", 256, 256, true, (context, rng, width, height) => {
      context.clearRect(0, 0, width, height);
      context.filter = "blur(1.5px)";
      context.strokeStyle = "rgba(255,255,255,0.75)";
      for (let index = 0; index < 90; index += 1) {
        const x = rng.between(0, width);
        const y = rng.between(0, height);
        context.lineWidth = rng.between(1.5, 4);
        context.beginPath();
        context.moveTo(x, y);
        context.quadraticCurveTo(x + rng.between(-30, 30), y + rng.between(-30, 30), x + rng.between(-40, 40), y + rng.between(-40, 40));
        context.stroke();
      }
    });
    texture.repeat.set(14, 14);
    return texture;
  }

  /**
   * @returns Degradado vertical oscuro en la base y claro en la punta, con una vena al centro, para las algas.
   */
  static weed(): CanvasTexture {
    return TextureCanvas.build("weed", 16, 128, false, (context, _rng, width, height) => {
      const gradient = context.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(1, "#5d7a62");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
      context.fillStyle = "rgba(0,40,20,0.22)";
      context.fillRect(width / 2 - 1, 0, 2, height);
    });
  }

  /**
   * @returns Textura clara moteada de puntos oscuros y claros, para corales, conchas y pasto.
   */
  static speckle(): CanvasTexture {
    return TextureCanvas.build("speckle", 128, 128, false, (context, rng, width, height) => {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      for (let index = 0; index < 260; index += 1) {
        context.fillStyle = rng.chance(0.6) ? `rgba(0,0,0,${rng.between(0.1, 0.24)})` : `rgba(255,255,255,${rng.between(0.3, 0.6)})`;
        context.beginPath();
        context.arc(rng.between(0, width), rng.between(0, height), rng.between(1.2, 5), 0, Math.PI * 2);
        context.fill();
      }
    });
  }

  /**
   * @returns Degradado vertical con el lomo más oscuro y el vientre claro, para los peces.
   */
  static belly(): CanvasTexture {
    return TextureCanvas.build("belly", 8, 64, false, (context, _rng, width, height) => {
      const gradient = context.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#9aa0aa");
      gradient.addColorStop(0.55, "#f2f2f2");
      gradient.addColorStop(1, "#ffffff");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
    });
  }

}
