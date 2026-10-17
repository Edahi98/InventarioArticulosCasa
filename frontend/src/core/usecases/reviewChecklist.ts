import type {
  ArticleMatch,
  ChecklistItem,
  ChecklistStatus,
  ChecklistSummary,
  MatchRepository,
} from "../domain/checklist.js";
import { httpMatchRepository } from "../../infrastructure/httpMatchRepository.js";

export class ReviewChecklistUseCase {
  constructor(private readonly repository: MatchRepository) {}

  /**
   * Revisa qué cosas de la lista están guardadas en la casa.
   *
   * @param terms - Una cosa por texto (por ejemplo, los ingredientes de una receta).
   * @returns Un elemento por texto, con la mejor coincidencia ya elegida.
   * @throws Error si el servidor no puede hacer la búsqueda.
   */
  async execute(terms: string[]): Promise<ChecklistItem[]> {
    const found = await this.repository.match(terms);
    return found.map(({ term, matches }) => ({ term, matches, choice: matches.length > 0 ? 0 : null }));
  }

  /**
   * Devuelve el artículo guardado que se eligió para una cosa.
   *
   * @param item - Elemento de la lista.
   * @returns El artículo elegido, o `null` si no hay ninguno.
   */
  chosen(item: ChecklistItem): ArticleMatch | null {
    return item.choice === null ? null : (item.matches[item.choice] ?? null);
  }

  /**
   * Decide si una cosa está lista: `tengo` si hay existencias en buen estado, `revisar` si está agotada
   * o necesita reparación, `falta` si no hay ninguna coincidencia elegida.
   *
   * @param item - Elemento de la lista.
   * @returns El estado del elemento.
   */
  classify(item: ChecklistItem): ChecklistStatus {
    const chosen = this.chosen(item);
    if (!chosen) return "falta";
    return chosen.stock <= 0 || chosen.needsRepair ? "revisar" : "tengo";
  }

  /**
   * Cuenta cuántas cosas hay de cada estado.
   *
   * @param items - Elementos de la lista.
   * @returns El conteo por estado, el total y si ya está todo listo.
   */
  summarize(items: ChecklistItem[]): ChecklistSummary {
    const counts = { tengo: 0, revisar: 0, falta: 0 };
    items.forEach((item) => {
      counts[this.classify(item)] += 1;
    });
    return { ...counts, total: items.length, complete: items.length > 0 && counts.tengo === items.length };
  }

  /**
   * Arma un texto con lo que hay que conseguir o arreglar, listo para copiar.
   *
   * @param items - Elementos de la lista.
   * @param title - Nombre del plan; si está vacío no se incluye.
   * @returns Un texto con una línea por cosa pendiente, o una cadena vacía si no falta nada.
   */
  shoppingList(items: ChecklistItem[], title: string): string {
    const pending = items.filter((item) => this.classify(item) !== "tengo");
    if (pending.length === 0) return "";
    const heading = title ? `Me falta para ${title}:` : "Me falta:";
    return [heading, ...pending.map((item) => `- ${item.term}`)].join("\n");
  }
}

export const reviewChecklistUseCase = new ReviewChecklistUseCase(httpMatchRepository);
