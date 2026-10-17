export type MatchMethod = "exacta" | "contenida" | "parcial";

export type ChecklistStatus = "tengo" | "revisar" | "falta";

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

export interface ChecklistItem {
  term: string;
  matches: ArticleMatch[];
  choice: number | null;
}

export interface ChecklistEntry {
  item: ChecklistItem;
  index: number;
  match: ArticleMatch | null;
  status: ChecklistStatus;
}

export interface ChecklistSummary {
  tengo: number;
  revisar: number;
  falta: number;
  total: number;
  complete: boolean;
}

export interface PageList {
  ordered: boolean;
  items: string[];
}

export interface PageHeading {
  level: number;
  text: string;
}

export interface PageTable {
  caption: string;
  headers: string[];
  rows: string[][];
}

export type ListSource = "lista" | "tabla" | "encabezados" | "parrafos";

export interface SourceList {
  source: ListSource;
  items: string[];
}

export interface ScrapedPage {
  url: string;
  title: string;
  description: string;
  headings: PageHeading[];
  tables: PageTable[];
  lists: PageList[];
  paragraphs: string[];
}

export interface MatchRepository {
  match(terms: string[]): Promise<TermMatches[]>;
}

export interface PageRepository {
  scrape(url: string): Promise<ScrapedPage>;
}
