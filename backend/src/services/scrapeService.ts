import puppeteer, { type Browser, type HTTPRequest } from "puppeteer";
import { pageContentBuilder, type PageContent } from "../builders/pageContentBuilder.js";
import { LOCAL_SCHEMES, NAVIGATION_TIMEOUT_MS, USER_AGENT } from "../constantes/scrape_constantes.js";
import { AppError } from "../middleware/errorHandler.js";
import { urlGuardService } from "./urlGuardService.js";

export class ScrapeService {
  private browser: Promise<Browser> | null = null;

  /**
   * Carga una página con Chromium (ejecutando su JavaScript) y extrae su contenido con Cheerio.
   * Cada petición que hace la página, incluidas las redirecciones, se revisa para que no llegue a redes locales.
   *
   * @param rawUrl - Dirección pública `http` o `https` de la página.
   * @returns Título, descripción, encabezados, tablas, listas y enlaces de la página.
   * @throws AppError 400 si la URL no es pública.
   * @throws AppError 502 si la página no carga, responde con error o tarda más de 20 segundos.
   * @throws AppError 503 si Chromium no se puede abrir.
   */
  async scrape(rawUrl: string): Promise<PageContent> {
    const url = await urlGuardService.assertPublic(rawUrl);
    const browser = await this.launch().catch((error: unknown) => {
      console.error(error);
      throw new AppError("El navegador del servidor no está disponible.", 503);
    });
    const page = await browser.newPage();

    try {
      await page.setUserAgent({ userAgent: USER_AGENT });
      await page.setRequestInterception(true);
      page.on("request", (request) => void this.screen(request));

      const response = await page.goto(url.href, { waitUntil: "networkidle2", timeout: NAVIGATION_TIMEOUT_MS });
      if (!response || !response.ok()) {
        throw new AppError(`La página respondió con el estado ${response?.status() ?? "desconocido"}.`, 502);
      }
      return pageContentBuilder.build(await page.content(), page.url());
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("No se pudo cargar la página o tardó demasiado en responder.", 502);
    } finally {
      await page.close().catch(() => undefined);
    }
  }

  /**
   * Cierra el navegador compartido, si está abierto.
   */
  async close(): Promise<void> {
    const pending = this.browser;
    this.browser = null;
    await (await pending)?.close().catch(() => undefined);
  }

  /**
   * Devuelve el navegador compartido, abriéndolo la primera vez y de nuevo si se cerró.
   * Con `PUPPETEER_NO_SANDBOX=true` lo abre sin sandbox, necesario en contenedores Docker.
   *
   * @returns El navegador de Chromium.
   */
  private async launch(): Promise<Browser> {
    const current = this.browser ? await this.browser : null;
    if (current?.connected) return current;

    const noSandbox = process.env.PUPPETEER_NO_SANDBOX === "true";
    this.browser = puppeteer.launch({
      headless: true,
      args: noSandbox ? ["--no-sandbox", "--disable-setuid-sandbox"] : [],
    });
    return this.browser;
  }

  /**
   * Deja pasar una petición de la página solo si su destino es público; las demás se abortan.
   *
   * @param request - Petición interceptada.
   */
  private async screen(request: HTTPRequest): Promise<void> {
    const target = request.url();
    if (LOCAL_SCHEMES.some((scheme) => target.startsWith(scheme))) {
      await request.continue().catch(() => undefined);
      return;
    }
    try {
      await urlGuardService.assertPublic(target);
      await request.continue();
    } catch {
      await request.abort("blockedbyclient").catch(() => undefined);
    }
  }
}

export const scrapeService = new ScrapeService();
