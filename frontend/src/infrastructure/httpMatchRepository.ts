import type { MatchRepository, TermMatches } from "../core/domain/checklist.js";
import { authenticatedHttpClient } from "../services/http/AuthenticatedHttpClient.js";

export class HttpMatchRepository implements MatchRepository {
  /**
   * Pide al servidor los artículos guardados que coinciden con cada texto.
   *
   * @param terms - Textos a buscar, uno por cosa.
   * @returns Para cada texto, sus coincidencias de mayor a menor puntaje.
   * @throws Error si el servidor rechaza la lista o no responde.
   */
  async match(terms: string[]): Promise<TermMatches[]> {
    return authenticatedHttpClient.request<TermMatches[]>("/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ terms }),
    });
  }
}

export const httpMatchRepository = new HttpMatchRepository();
