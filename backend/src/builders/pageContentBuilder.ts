import { load, type CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";
import {
  MAX_HEADINGS,
  MAX_LINKS,
  MAX_LIST_ITEMS,
  MAX_LISTS,
  MAX_PARAGRAPHS,
  MAX_TABLE_ROWS,
  MAX_TABLES,
} from "../constantes/scrape_constantes.js";

export interface PageHeading {
  level: number;
  text: string;
}

export interface PageTable {
  caption: string;
  headers: string[];
  rows: string[][];
}

export interface PageList {
  ordered: boolean;
  items: string[];
}

export interface PageLink {
  text: string;
  href: string;
}

export interface PageContent {
  url: string;
  title: string;
  description: string;
  headings: PageHeading[];
  tables: PageTable[];
  lists: PageList[];
  paragraphs: string[];
  links: PageLink[];
}

export class PageContentBuilder {
  /**
   * Extrae del HTML de una página su título, descripción, encabezados, tablas, listas y enlaces.
   * Descarta `script`, `style` y `noscript`, y limita la cantidad de elementos de cada tipo.
   *
   * @param html - HTML ya renderizado de la página.
   * @param url - URL final de la página, usada para volver absolutos los enlaces.
   * @returns El contenido estructurado de la página.
   */
  build(html: string, url: string): PageContent {
    const $ = load(html);
    $("script, style, noscript").remove();

    return {
      url,
      title: this.clean($("title").first().text()),
      description: this.clean($('meta[name="description"]').attr("content") ?? ""),
      headings: this.headings($),
      tables: this.tables($),
      lists: this.lists($),
      paragraphs: this.paragraphs($),
      links: this.links($, url),
    };
  }

  /**
   * Lee los encabezados `h1`–`h6` con su nivel.
   *
   * @param $ - Documento cargado en Cheerio.
   * @returns Los encabezados no vacíos, en orden de aparición.
   */
  private headings($: CheerioAPI): PageHeading[] {
    return $("h1, h2, h3, h4, h5, h6")
      .toArray()
      .map((element) => ({ level: Number($(element).prop("tagName")?.[1]), text: this.clean($(element).text()) }))
      .filter((heading) => heading.text)
      .slice(0, MAX_HEADINGS);
  }

  /**
   * Lee las tablas: título, encabezados (celdas `th`) y filas de datos (celdas `td`).
   *
   * @param $ - Documento cargado en Cheerio.
   * @returns Las tablas que tienen al menos una fila o un encabezado.
   */
  private tables($: CheerioAPI): PageTable[] {
    return $("table")
      .toArray()
      .slice(0, MAX_TABLES)
      .map((table) => this.table($, table))
      .filter((table) => table.headers.length > 0 || table.rows.length > 0);
  }

  /**
   * Convierte una tabla HTML en título, encabezados y filas.
   *
   * @param $ - Documento cargado en Cheerio.
   * @param table - Nodo `table`.
   * @returns La tabla estructurada.
   */
  private table($: CheerioAPI, table: AnyNode): PageTable {
    const rows = $(table).find("tr").toArray();
    const headerRow = rows.find((row) => $(row).children("th").length > 0 && $(row).children("td").length === 0);
    const dataRows = rows.filter((row) => row !== headerRow && $(row).children("td, th").length > 0);

    return {
      caption: this.clean($(table).find("caption").first().text()),
      headers: headerRow ? this.cells($, headerRow) : [],
      rows: dataRows.slice(0, MAX_TABLE_ROWS).map((row) => this.cells($, row)),
    };
  }

  /**
   * Lee el texto de las celdas de una fila.
   *
   * @param $ - Documento cargado en Cheerio.
   * @param row - Nodo `tr`.
   * @returns El texto de cada celda.
   */
  private cells($: CheerioAPI, row: AnyNode): string[] {
    return $(row)
      .children("td, th")
      .toArray()
      .map((cell) => this.clean($(cell).text()));
  }

  /**
   * Lee las listas `ul` y `ol` de primer nivel (las anidadas no se incluyen y el texto de cada elemento excluye la sublista).
   *
   * @param $ - Documento cargado en Cheerio.
   * @returns Las listas con elementos, indicando si son ordenadas.
   */
  private lists($: CheerioAPI): PageList[] {
    return $("ul, ol")
      .toArray()
      .filter((list) => $(list).parents("ul, ol").length === 0)
      .slice(0, MAX_LISTS)
      .map((list) => ({
        ordered: $(list).prop("tagName") === "OL",
        items: $(list)
          .children("li")
          .toArray()
          .map((item) => this.clean($(item).clone().children("ul, ol").remove().end().text()))
          .filter(Boolean)
          .slice(0, MAX_LIST_ITEMS),
      }))
      .filter((list) => list.items.length > 0);
  }

  /**
   * Lee los párrafos con texto, sin repetirlos.
   *
   * @param $ - Documento cargado en Cheerio.
   * @returns Los párrafos no vacíos, en orden de aparición.
   */
  private paragraphs($: CheerioAPI): string[] {
    const texts = $("p").toArray().map((element) => this.clean($(element).text())).filter(Boolean);
    return [...new Set(texts)].slice(0, MAX_PARAGRAPHS);
  }

  /**
   * Lee los enlaces con texto y los vuelve absolutos; descarta los que no son `http` o `https`.
   *
   * @param $ - Documento cargado en Cheerio.
   * @param baseUrl - URL contra la que se resuelven los enlaces relativos.
   * @returns Los enlaces válidos, sin repetir.
   */
  private links($: CheerioAPI, baseUrl: string): PageLink[] {
    const seen = new Set<string>();
    const found: PageLink[] = [];

    for (const element of $("a[href]").toArray()) {
      const text = this.clean($(element).text());
      const href = this.absolute($(element).attr("href") ?? "", baseUrl);
      if (!text || !href || seen.has(href)) continue;
      seen.add(href);
      found.push({ text, href });
      if (found.length >= MAX_LINKS) break;
    }
    return found;
  }

  /**
   * Resuelve una dirección contra la URL base.
   *
   * @param href - Valor del atributo `href`.
   * @param baseUrl - URL base.
   * @returns La URL absoluta, o una cadena vacía si no es `http`/`https`.
   */
  private absolute(href: string, baseUrl: string): string {
    try {
      const url = new URL(href, baseUrl);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  /**
   * Junta los espacios y saltos de línea repetidos.
   *
   * @param text - Texto extraído.
   * @returns El texto sin espacios sobrantes.
   */
  private clean(text: string): string {
    return text.replace(/\s+/g, " ").trim();
  }
}

export const pageContentBuilder = new PageContentBuilder();
