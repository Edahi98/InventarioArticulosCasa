import { articles, categories, notes, users } from "../db/client.js";

export const dataTables = [
  { name: "users", table: users },
  { name: "categories", table: categories },
  { name: "articles", table: articles },
  { name: "notes", table: notes },
] as const;
