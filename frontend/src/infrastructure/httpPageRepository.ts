import type { PageRepository, ScrapedPage } from "../core/domain/checklist.js";
import { authenticatedHttpClient } from "../services/http/AuthenticatedHttpClient.js";

export class HttpPageRepository implements PageRepository {
  /**
   * Pide al servidor que lea una página web y devuelva su contenido estructurado.
   *
   * @param url - Dirección http o https pública de la página.
   * @returns El título, la descripción y las listas de la página.
   * @throws Error si la dirección no es pública, la página no carga o tarda demasiado.
   */
  async scrape(url: string): Promise<ScrapedPage> {
    return authenticatedHttpClient.request<ScrapedPage>("/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
  }
}

export const httpPageRepository = new HttpPageRepository();
