import pl from "nodejs-polars";
import {
  CONTAINED_MIN_SCORE,
  EXACT_SCORE,
  MAX_FUZZY_DISTANCE,
  MAX_MATCHES_PER_TERM,
  MIN_FUZZY_LENGTH,
  MIN_SCORE,
} from "../constantes/match_constantes.js";
import ArticleService, { type ArticleWithCategory } from "./articleService.js";
import { textNormalizerService } from "./textNormalizerService.js";

export type MatchMethod = "exacta" | "contenida" | "parcial";

export interface ArticleMatch {
  articleId: number;
  name: string;
  categoryName: string;
  location: string;
  stock: number;
  imageUrl: string;
  needsRepair: boolean;
  score: number;
  method: MatchMethod;
}

export interface TermMatches {
  term: string;
  matches: ArticleMatch[];
}

interface MatchRow {
  indiceTexto: number;
  idArticulo: number;
  nombre: string;
  categoria: string;
  ubicacion: string;
  stock: number;
  imagen: string;
  reparar: boolean;
  puntaje: number;
  metodo: MatchMethod;
}

export class MatchService {
  private readonly articles = new ArticleService();

  /**
   * Busca, para cada texto, los artículos guardados que coinciden con él.
   *
   * @param terms - Textos a buscar (por ejemplo, los ingredientes de una receta).
   * @returns Para cada texto, sus coincidencias de mayor a menor puntaje.
   */
  async match(terms: string[]): Promise<TermMatches[]> {
    return this.matchAgainst(terms, await this.articles.list());
  }

  /**
   * Compara textos contra una lista de artículos con tablas de Polars. Los textos y los nombres se convierten en
   * tablas de palabras, se corrigen las erratas, se cruzan por palabra, se puntúa cada pareja y se conservan las
   * mejores de cada texto. Todas las operaciones por fila son columnas de Polars.
   *
   * @param terms - Textos a buscar.
   * @param articles - Artículos contra los que se compara.
   * @returns Para cada texto, hasta 5 coincidencias con puntaje de 0.5 a 1.
   */
  matchAgainst(terms: string[], articles: ArticleWithCategory[]): TermMatches[] {
    if (terms.length === 0 || articles.length === 0) return terms.map((term) => ({ term, matches: [] }));

    const termWords = textNormalizerService.tokenFrame(terms.map((_, index) => index), terms, "indiceTexto");
    const articleWords = textNormalizerService.tokenFrame(articles.map((article) => article.id), articles.map((article) => article.name), "idArticulo");
    const scored = this.score(this.fixTypos(termWords, articleWords), articleWords);
    const rows = this.withArticleData(this.best(scored), articles).toRecords() as unknown as MatchRow[];

    return terms.map((term, index) => ({
      term,
      matches: rows.filter((row) => row.indiceTexto === index).map((row) => this.toMatch(row)),
    }));
  }

  /**
   * Sustituye las palabras de los textos con una letra de error por la palabra parecida de los artículos.
   * Polars arma las parejas candidatas (palabras largas, misma inicial y largo casi igual) con un cruce de
   * vocabularios; solo esas pocas parejas se miden con la distancia de edición.
   *
   * @param termWords - Tabla `indiceTexto`, `token` de los textos.
   * @param articleWords - Tabla `idArticulo`, `token` de los artículos.
   * @returns La tabla de los textos con las erratas corregidas.
   */
  private fixTypos(termWords: pl.DataFrame, articleWords: pl.DataFrame): pl.DataFrame {
    const length = (name: string) => pl.col(name).str.lengths();
    const candidates = termWords
      .select(pl.col("token").alias("palabraTexto"))
      .unique()
      .join(articleWords.select(pl.col("token").alias("palabraArticulo")).unique(), { how: "cross" })
      .filter(
        length("palabraTexto").gtEq(pl.lit(MIN_FUZZY_LENGTH))
          .and(length("palabraArticulo").gtEq(pl.lit(MIN_FUZZY_LENGTH)))
          .and(pl.col("palabraTexto").neq(pl.col("palabraArticulo")))
          .and(pl.col("palabraTexto").str.slice(0, 1).eq(pl.col("palabraArticulo").str.slice(0, 1)))
          .and(length("palabraTexto").sub(length("palabraArticulo")).abs().ltEq(pl.lit(MAX_FUZZY_DISTANCE))),
      )
      .toRecords() as { palabraTexto: string; palabraArticulo: string }[];

    const fixes = new Map<string, string>();
    candidates
      .filter(({ palabraTexto, palabraArticulo }) => this.distance(palabraTexto, palabraArticulo) <= MAX_FUZZY_DISTANCE)
      .forEach(({ palabraTexto, palabraArticulo }) => fixes.set(palabraTexto, fixes.get(palabraTexto) ?? palabraArticulo));
    if (fixes.size === 0) return termWords;

    const mapping = pl.DataFrame({ token: [...fixes.keys()], corregida: [...fixes.values()] });
    return termWords
      .join(mapping, { on: "token", how: "left" })
      .select(
        pl.col("indiceTexto"),
        pl.when(pl.col("corregida").isNull()).then(pl.col("token")).otherwise(pl.col("corregida")).alias("token"),
      )
      .unique();
  }

  /**
   * Puntúa cada pareja texto–artículo que comparte alguna palabra.
   * `exacta` (1): tienen las mismas palabras. `contenida` (mínimo 0.7): todas las palabras de uno están en el otro.
   * Las parejas que solo comparten algunas palabras (`parcial`) se descartan: si no hay coincidencia exacta o contenida, el texto no devuelve nada.
   *
   * @param termWords - Tabla `indiceTexto`, `token` ya corregida.
   * @param articleWords - Tabla `idArticulo`, `token`.
   * @returns Las parejas con `compartidas`, `puntaje` y `metodo`.
   */
  private score(termWords: pl.DataFrame, articleWords: pl.DataFrame): pl.DataFrame {
    const termSizes = termWords.groupBy("indiceTexto").agg(pl.col("token").count().alias("nTexto"));
    const articleSizes = articleWords.groupBy("idArticulo").agg(pl.col("token").count().alias("nArticulo"));
    const shared = termWords
      .join(articleWords, { on: "token", how: "inner" })
      .groupBy(["indiceTexto", "idArticulo"])
      .agg(pl.col("token").count().alias("compartidas"));

    const inArticle = pl.col("compartidas").eq(pl.col("nArticulo"));
    const inTerm = pl.col("compartidas").eq(pl.col("nTexto"));
    const dice = pl.col("compartidas").mul(pl.lit(2)).div(pl.col("nTexto").add(pl.col("nArticulo")));

    return shared
      .join(termSizes, { on: "indiceTexto", how: "inner" })
      .join(articleSizes, { on: "idArticulo", how: "inner" })
      .withColumns(
        dice.alias("dice"),
        pl.when(inArticle.and(inTerm)).then(pl.lit("exacta"))
          .when(inArticle.or(inTerm)).then(pl.lit("contenida"))
          .otherwise(pl.lit("parcial")).alias("metodo"),
      )
      .withColumn(
        pl.when(pl.col("metodo").eq(pl.lit("exacta"))).then(pl.lit(EXACT_SCORE))
          .when(pl.col("metodo").eq(pl.lit("contenida"))).then(pl.when(pl.col("dice").ltEq(pl.lit(CONTAINED_MIN_SCORE))).then(pl.lit(CONTAINED_MIN_SCORE)).otherwise(pl.col("dice")))
          .otherwise(pl.col("dice")).round(2).alias("puntaje"),
      )
      .filter(pl.col("metodo").neq(pl.lit("parcial")).and(pl.col("puntaje").gtEq(pl.lit(MIN_SCORE))));
  }

  /**
   * Se queda con las mejores coincidencias de cada texto, ordenadas por puntaje.
   *
   * @param scored - Parejas puntuadas.
   * @returns Hasta 5 parejas por texto.
   */
  private best(scored: pl.DataFrame): pl.DataFrame {
    return scored
      .withColumn(pl.col("puntaje").rank("ordinal", true).over("indiceTexto").alias("posicion"))
      .filter(pl.col("posicion").ltEq(pl.lit(MAX_MATCHES_PER_TERM)))
      .sort(["indiceTexto", "posicion"]);
  }

  /**
   * Agrega a cada pareja los datos del artículo.
   *
   * @param matches - Parejas ya filtradas.
   * @param articles - Artículos originales.
   * @returns Las parejas con nombre, categoría, ubicación y stock.
   */
  private withArticleData(matches: pl.DataFrame, articles: ArticleWithCategory[]): pl.DataFrame {
    const data = pl.DataFrame({
      idArticulo: articles.map((article) => article.id),
      nombre: articles.map((article) => article.name),
      categoria: articles.map((article) => article.categoryName ?? ""),
      ubicacion: articles.map((article) => article.location),
      stock: articles.map((article) => article.stock),
      imagen: articles.map((article) => article.imageUrl),
      reparar: articles.map((article) => article.needsRepair),
    });
    return matches.join(data, { on: "idArticulo", how: "inner" }).sort(["indiceTexto", "posicion"]);
  }

  /**
   * Calcula la distancia de Levenshtein entre dos palabras.
   *
   * @param left - Una palabra.
   * @param right - La otra palabra.
   * @returns El número mínimo de inserciones, borrados o cambios de letra para convertir una en otra.
   */
  private distance(left: string, right: string): number {
    let previous = Array.from({ length: right.length + 1 }, (_, index) => index);

    for (let row = 1; row <= left.length; row++) {
      const current = [row];
      for (let column = 1; column <= right.length; column++) {
        const cost = left[row - 1] === right[column - 1] ? 0 : 1;
        current[column] = Math.min(previous[column] + 1, current[column - 1] + 1, previous[column - 1] + cost);
      }
      previous = current;
    }
    return previous[right.length];
  }

  /**
   * Da forma de respuesta a una fila de la tabla de coincidencias.
   *
   * @param row - Fila con los datos del artículo y su puntaje.
   * @returns La coincidencia lista para devolver.
   */
  private toMatch(row: MatchRow): ArticleMatch {
    return {
      articleId: row.idArticulo,
      name: row.nombre,
      categoryName: row.categoria,
      location: row.ubicacion,
      stock: row.stock,
      imageUrl: row.imagen,
      needsRepair: row.reparar,
      score: row.puntaje,
      method: row.metodo,
    };
  }
}

export const matchService = new MatchService();
