export const MAX_URL_LENGTH = 2048;

export const NAVIGATION_TIMEOUT_MS = 20_000;
export const USER_AGENT = "Mozilla/5.0 (compatible; InventarioBot/1.0)";
export const LOCAL_SCHEMES = ["data:", "blob:", "about:"];

export const MAX_HEADINGS = 200;
export const MAX_TABLES = 30;
export const MAX_TABLE_ROWS = 500;
export const MAX_LISTS = 50;
export const MAX_LIST_ITEMS = 300;
export const MAX_LINKS = 300;
export const MAX_PARAGRAPHS = 150;

export const CHROME_SELECTOR =
  "nav, header, footer, aside, [role=navigation], [role=banner], [role=contentinfo], [class*=cookie], [id*=cookie], [class*=consent], [id*=consent], [class*=menu], [id*=menu]";
export const CONTENT_SELECTOR = "main, article, [role=main]";
