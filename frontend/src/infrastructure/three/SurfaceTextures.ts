import type { CanvasTexture } from "three";
import { TextureCanvas } from "./TextureCanvas.js";

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
