import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { PRIVATE_IPV4_RANGES } from "../constantes/red_constantes.js";
import { AppError } from "../middleware/errorHandler.js";

export class UrlGuardService {
  /**
   * Verifica que una URL apunte a un servidor público: solo `http`/`https` y sin direcciones locales ni privadas.
   * Resuelve el nombre de dominio y revisa todas las direcciones a las que apunta.
   *
   * @param rawUrl - URL a comprobar.
   * @returns La URL ya interpretada.
   * @throws AppError 400 si la URL no es válida, el protocolo no es http(s) o el destino es local o privado.
   * @throws AppError 502 si el dominio no se puede resolver.
   */
  async assertPublic(rawUrl: string): Promise<URL> {
    const url = this.parse(rawUrl);
    const host = url.hostname.replace(/^\[|\]$/g, "");

    if (isIP(host)) {
      this.assertAddress(host);
      return url;
    }

    const addresses = await lookup(host, { all: true }).catch(() => {
      throw new AppError(`No se pudo resolver el dominio "${host}".`, 502);
    });
    addresses.forEach(({ address }) => this.assertAddress(address));
    return url;
  }

  /**
   * Interpreta una URL y exige el protocolo `http` o `https`.
   *
   * @param rawUrl - Texto recibido.
   * @returns La URL interpretada.
   * @throws AppError 400 si no es una URL o su protocolo no está permitido.
   */
  private parse(rawUrl: string): URL {
    try {
      const url = new URL(rawUrl);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("protocolo");
      return url;
    } catch {
      throw new AppError("La URL debe ser una dirección http o https válida.", 400);
    }
  }

  /**
   * Rechaza una dirección IP local, privada, reservada o de multidifusión.
   *
   * @param address - Dirección IPv4 o IPv6.
   * @throws AppError 400 si la dirección no es pública.
   */
  private assertAddress(address: string): void {
    if (this.isPrivate(address)) {
      throw new AppError("La URL apunta a una dirección local o privada, que no se permite.", 400);
    }
  }

  /**
   * Convierte una dirección IPv6 que envuelve una IPv4 (`::ffff:a.b.c.d` o `::ffff:xxxx:xxxx`) en la IPv4 original.
   *
   * @param address - Dirección en minúsculas.
   * @returns La IPv4 envuelta, o la dirección sin cambios si no es de ese tipo.
   */
  private unmap(address: string): string {
    const dotted = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (dotted) return dotted[1];

    const hex = address.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (!hex) return address;

    const high = parseInt(hex[1], 16);
    const low = parseInt(hex[2], 16);
    return [high >> 8, high & 255, low >> 8, low & 255].join(".");
  }

  /**
   * Indica si una dirección IP no es pública.
   *
   * @param address - Dirección IPv4 o IPv6.
   * @returns `true` si es loopback, privada, de enlace local, reservada o multidifusión.
   */
  private isPrivate(address: string): boolean {
    const ip = this.unmap(address.toLowerCase());

    if (isIP(ip) === 4) {
      const value = ip.split(".").reduce((total, part) => total * 256 + Number(part), 0);
      return PRIVATE_IPV4_RANGES.some(([start, end]) => value >= start && value <= end);
    }

    return ip === "::" || ip === "::1" || /^f[cd]/.test(ip) || /^fe[89ab]/.test(ip) || ip.startsWith("ff");
  }
}

export const urlGuardService = new UrlGuardService();
