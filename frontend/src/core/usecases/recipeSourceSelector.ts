import type { ListSource, ScrapedPage, SourceList } from "../domain/checklist.js";
import {
  MAX_ITEM_LENGTH,
  MAX_ITEMS_PER_LIST,
  FALLBACK_SOURCES,
  MAX_SHOWN_LISTS,
  MIN_FALLBACK_HEADING_LEVEL,
  MIN_USEFUL_LIST_ITEMS,
  QUANTITY_PATTERN,
} from "../../constantes/checklist_constantes.js";

export class RecipeSourceSelector {
  /**
   * Elige de dónde sacar las cosas de una página. Primero van las listas y las tablas que empiezan con una cantidad o un número
   * (`2 tazas`, `200 g`); si ninguna las tiene se siguen buscando fuentes: las demás listas y tablas y, después, los encabezados
   * y los párrafos. En todos los casos se descartan los
   * textos largos y se limita la cantidad de elementos.
   *
   * @param page - Contenido de la página leído por el servidor.
   * @returns Hasta 6 fuentes, las más parecidas a una lista de cosas primero.
   */
  select(page: ScrapedPage): SourceList[] {
    const structured = this.rank(this.structured(page));
    const withMeasures = structured.some((source) => this.quantityShare(source) > 0);
    return withMeasures ? structured : [...structured.slice(0, MAX_SHOWN_LISTS - FALLBACK_SOURCES), ...this.fallback(page)];
  }

  /**
   * Reúne las listas y las tablas de la página; cada fila de tabla se junta en un solo texto.
   *
   * @param page - Contenido de la página.
   * @returns Las fuentes con suficientes elementos cortos.
   */
  private structured(page: ScrapedPage): SourceList[] {
    const lists = page.lists.map((list) => this.tidy("lista", list.items));
    const tables = page.tables.map((table) => this.tidy("tabla", table.rows.map((row) => row.filter(Boolean).join(" "))));
    return [...lists, ...tables].filter((source) => this.isUseful(source));
  }

  /**
   * Arma las fuentes de respaldo con los encabezados (sin el título principal) y los párrafos.
   *
   * @param page - Contenido de la página.
   * @returns Las fuentes de respaldo con suficientes elementos cortos, en ese orden.
   */
  private fallback(page: ScrapedPage): SourceList[] {
    const headings = page.headings.filter((heading) => heading.level >= MIN_FALLBACK_HEADING_LEVEL).map((heading) => heading.text);
    return [this.tidy("encabezados", headings), this.tidy("parrafos", page.paragraphs)].filter((source) => this.isUseful(source));
  }

  /**
   * Ordena las fuentes: primero las que más elementos empiezan con una cantidad o un número
   * (`2 tazas`, `1/2 kg`), señal de lista de ingredientes, y a igualdad las más largas.
   *
   * @param sources - Fuentes de listas y tablas.
   * @returns Hasta 6 fuentes ordenadas.
   */
  private rank(sources: SourceList[]): SourceList[] {
    return sources
      .map((source) => ({ source, share: this.quantityShare(source) }))
      .sort((left, right) => right.share - left.share || right.source.items.length - left.source.items.length)
      .map(({ source }) => source)
      .slice(0, MAX_SHOWN_LISTS);
  }

  /**
   * Quita los elementos vacíos, repetidos o de más de 90 caracteres y se queda con los primeros 60.
   *
   * @param source - Origen de los elementos.
   * @param items - Textos originales.
   * @returns La fuente ya depurada.
   */
  private tidy(source: ListSource, items: string[]): SourceList {
    const short = items.map((item) => item.trim()).filter((item) => item.length > 0 && item.length <= MAX_ITEM_LENGTH);
    return { source, items: [...new Set(short)].slice(0, MAX_ITEMS_PER_LIST) };
  }

  /**
   * Indica si una fuente tiene los elementos suficientes para armar una lista.
   *
   * @param source - Fuente depurada.
   * @returns `true` si llega al mínimo de elementos.
   */
  private isUseful(source: SourceList): boolean {
    return source.items.length >= MIN_USEFUL_LIST_ITEMS;
  }

  /**
   * Calcula qué parte de una fuente empieza con una cantidad.
   *
   * @param source - Fuente depurada, con al menos un elemento.
   * @returns Un número de 0 a 1.
   */
  private quantityShare(source: SourceList): number {
    return source.items.filter((item) => QUANTITY_PATTERN.test(item)).length / source.items.length;
  }
}

export const recipeSourceSelector = new RecipeSourceSelector();
