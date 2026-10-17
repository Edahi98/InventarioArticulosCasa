export const MAX_TERMS = 100;
export const MAX_TERM_LENGTH = 200;
export const MAX_MATCHES_PER_TERM = 5;

export const MIN_SCORE = 0.5;
export const CONTAINED_MIN_SCORE = 0.7;
export const EXACT_SCORE = 1;
export const MIN_FUZZY_LENGTH = 5;
export const MAX_FUZZY_DISTANCE = 1;
export const MIN_SINGULAR_LENGTH = 4;

export const ACCENT_REPLACEMENTS: [RegExp, string][] = [
  [/[áàäâ]/, "a"],
  [/[éèëê]/, "e"],
  [/[íìïî]/, "i"],
  [/[óòöô]/, "o"],
  [/[úùüû]/, "u"],
];

export const PARENTHESES_PATTERN = /\(.*?\)/;
export const NUMBERS_PATTERN = /\d+([./,]\d+)?/;
export const PUNCTUATION_PATTERN = /[^a-z0-9ñ ]/;
export const SPACES_PATTERN = /\s+/;

export const SINGULAR_ES_PATTERN = /([lnrdzj])es$/;
export const SINGULAR_CES_PATTERN = /ces$/;
export const SINGULAR_S_PATTERN = /s$/;

const UNITS = [
  "tazas?",
  "cucharadas?",
  "cucharaditas?",
  "gramos?",
  "kilos?",
  "litros?",
  "mililitros?",
  "g",
  "gr",
  "kg",
  "ml",
  "lt",
  "l",
  "pizcas?",
  "piezas?",
  "paquetes?",
  "rebanadas?",
];

const STOPWORDS = ["de", "del", "la", "las", "el", "los", "un", "una", "unos", "unas", "y", "o", "con", "sin", "para", "al", "en", "a", "por", "gusto"];

export const UNITS_PATTERN = new RegExp(`\\b(${UNITS.join("|")})\\b`);
export const STOPWORDS_PATTERN = new RegExp(`\\b(${STOPWORDS.join("|")})\\b`);
