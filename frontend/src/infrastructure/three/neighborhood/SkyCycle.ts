import { Color } from "three";
import type { SkyPalette } from "../SkyTexture.js";

export interface SkyState {
  palette: SkyPalette;
  fog: number;
  light: number;
  lightIntensity: number;
  hemiSky: number;
  hemiGround: number;
  ambientIntensity: number;
  night: number;
  arc: number;
}

interface Keyframe {
  hour: number;
  top: string;
  mid: string;
  horizon: string;
  light: number;
  lightIntensity: number;
  hemiSky: number;
  hemiGround: number;
  ambientIntensity: number;
  night: number;
}

const KEYFRAMES: Keyframe[] = [
  { hour: 0, top: "#080c2a", mid: "#1b1a4d", horizon: "#3a2a63", light: 0x8fa4ff, lightIntensity: 0.8, hemiSky: 0x6a70c8, hemiGround: 0x3a3a88, ambientIntensity: 0.55, night: 1 },
  { hour: 5, top: "#1f2a5a", mid: "#7a5a9a", horizon: "#ffb08a", light: 0xffb08a, lightIntensity: 1.0, hemiSky: 0x9a88d0, hemiGround: 0x6a5a90, ambientIntensity: 0.62, night: 0.7 },
  { hour: 7.5, top: "#8fb6ff", mid: "#ffc9b8", horizon: "#fff0d6", light: 0xffe2b0, lightIntensity: 1.9, hemiSky: 0xcdbaf7, hemiGround: 0xbfe9d5, ambientIntensity: 0.75, night: 0.08 },
  { hour: 12, top: "#6fb4ff", mid: "#bfe3ff", horizon: "#fff6e8", light: 0xffffff, lightIntensity: 2.5, hemiSky: 0xdff1ff, hemiGround: 0xbfe9d5, ambientIntensity: 0.8, night: 0 },
  { hour: 17, top: "#b9a4f2", mid: "#ffb3cb", horizon: "#ffe3d6", light: 0xfff0d6, lightIntensity: 2.3, hemiSky: 0xcdbaf7, hemiGround: 0xbfe9d5, ambientIntensity: 0.75, night: 0.1 },
  { hour: 19, top: "#4b3b8f", mid: "#e86a8f", horizon: "#ffb36b", light: 0xffa86b, lightIntensity: 1.7, hemiSky: 0xc59ae8, hemiGround: 0x95b8a8, ambientIntensity: 0.85, night: 0.5 },
  { hour: 21, top: "#151a4a", mid: "#2d2a68", horizon: "#5a3a78", light: 0x8fa4ff, lightIntensity: 0.9, hemiSky: 0x7a80d8, hemiGround: 0x4a6aa8, ambientIntensity: 0.62, night: 0.92 },
  { hour: 24, top: "#080c2a", mid: "#1b1a4d", horizon: "#3a2a63", light: 0x8fa4ff, lightIntensity: 0.8, hemiSky: 0x6a70c8, hemiGround: 0x3a3a88, ambientIntensity: 0.55, night: 1 },
];

export class SkyCycle {
  /**
   * La hora local como decimal entre 0 y 24 (por ejemplo, 18.5 son las 6:30 de la tarde).
   *
   * @param date - Momento a convertir; por defecto, ahora.
   * @returns Las horas decimales.
   */
  static hourOf(date: Date = new Date()): number {
    return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  }

  /**
   * Cómo luce el cielo a una hora: colores, luz, qué tan de noche es y dónde está el sol o la luna.
   *
   * @param hour - Hora decimal entre 0 y 24.
   * @returns El estado interpolado entre los momentos clave del día.
   */
  static at(hour: number): SkyState {
    const wrapped = ((hour % 24) + 24) % 24;
    const next = KEYFRAMES.findIndex((frame) => frame.hour > wrapped);
    const to = KEYFRAMES[next === -1 ? KEYFRAMES.length - 1 : next] as Keyframe;
    const from = KEYFRAMES[Math.max(next - 1, 0)] as Keyframe;
    const span = to.hour - from.hour;
    const t = span === 0 ? 0 : (wrapped - from.hour) / span;
    const smooth = t * t * (3 - 2 * t);
    const mix = (a: number, b: number): number => a + (b - a) * smooth;
    const color = (a: string | number, b: string | number): Color => new Color(a).lerp(new Color(b), smooth);

    const daytime = wrapped >= 6 && wrapped < 18;
    const progress = daytime ? (wrapped - 6) / 12 : ((wrapped - 18 + 24) % 24) / 12;
    return {
      palette: {
        top: `#${color(from.top, to.top).getHexString()}`,
        mid: `#${color(from.mid, to.mid).getHexString()}`,
        horizon: `#${color(from.horizon, to.horizon).getHexString()}`,
      },
      fog: color(from.horizon, to.horizon).getHex(),
      light: color(from.light, to.light).getHex(),
      lightIntensity: mix(from.lightIntensity, to.lightIntensity),
      hemiSky: color(from.hemiSky, to.hemiSky).getHex(),
      hemiGround: color(from.hemiGround, to.hemiGround).getHex(),
      ambientIntensity: mix(from.ambientIntensity, to.ambientIntensity),
      night: mix(from.night, to.night),
      arc: progress * Math.PI,
    };
  }
}
