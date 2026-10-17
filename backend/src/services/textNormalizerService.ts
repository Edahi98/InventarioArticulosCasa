import pl from "nodejs-polars";
import {
  ACCENT_REPLACEMENTS,
  MIN_SINGULAR_LENGTH,
  NUMBERS_PATTERN,
  PARENTHESES_PATTERN,
  PUNCTUATION_PATTERN,
  SINGULAR_CES_PATTERN,
  SINGULAR_ES_PATTERN,
  SINGULAR_S_PATTERN,
  SPACES_PATTERN,
  STOPWORDS_PATTERN,
  UNITS_PATTERN,
} from "../constantes/match_constantes.js";

export class TextNormalizerService {
  /**
   * Convierte una lista de textos en una tabla de palabras, todo con columnas de Polars (sin recorrer filas en JavaScript):
   * minúsculas, quitar acentos, paréntesis, cantidades, unidades, palabras vacías y puntuación, separar en palabras,
   * pasar cada una a singular y descartar repetidas.
   *
   * @param ids - Identificador de cada texto; se conserva en la tabla resultante.
   * @param texts - Textos originales, en el mismo orden que `ids`.
   * @param idName - Nombre de la columna del identificador.
   * @returns Una tabla con las columnas `idName` y `token`, una fila por palabra distinta de cada texto.
   */
  tokenFrame(ids: number[], texts: string[], idName: string): pl.DataFrame {
    const words = pl
      .DataFrame({ [idName]: ids, texto: texts })
      .select(pl.col(idName), this.treatments(pl.col("texto")).str.split(" ").alias("token"))
      .explode("token")
      .filter(pl.col("token").neq(pl.lit("")));

    return words.select(pl.col(idName), this.singular(pl.col("token")).alias("token")).unique();
  }

  /**
   * Encadena los tratamientos de texto sobre una columna.
   *
   * @param column - Expresión de la columna con el texto original.
   * @returns La expresión con todos los tratamientos aplicados.
   */
  private treatments(column: pl.Expr): pl.Expr {
    const withoutAccents = ACCENT_REPLACEMENTS.reduce(
      (expression, [pattern, replacement]) => expression.str.replaceAll(pattern, replacement),
      column.str.toLowerCase(),
    );

    return withoutAccents
      .str.replaceAll(PARENTHESES_PATTERN, " ")
      .str.replaceAll(NUMBERS_PATTERN, " ")
      .str.replaceAll(UNITS_PATTERN, " ")
      .str.replaceAll(STOPWORDS_PATTERN, " ")
      .str.replaceAll(PUNCTUATION_PATTERN, " ")
      .str.replaceAll(SPACES_PATTERN, " ")
      .str.strip();
  }

  /**
   * Pasa una columna de palabras del español a singular con reglas simples (`limones` → `limon`, `luces` → `luz`,
   * `huevos` → `huevo`). Las palabras de menos de 4 letras no cambian.
   *
   * @param column - Expresión de la columna con palabras ya normalizadas.
   * @returns La expresión con las palabras en singular.
   */
  private singular(column: pl.Expr): pl.Expr {
    const converted = column.str
      .replace(SINGULAR_ES_PATTERN, "$1")
      .str.replace(SINGULAR_CES_PATTERN, "z")
      .str.replace(SINGULAR_S_PATTERN, "");

    return pl.when(column.str.lengths().ltEq(pl.lit(MIN_SINGULAR_LENGTH - 1))).then(column).otherwise(converted);
  }
}

export const textNormalizerService = new TextNormalizerService();
