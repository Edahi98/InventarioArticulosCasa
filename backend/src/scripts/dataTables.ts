import { articles, categories, notes, users } from "../db/client.js";

export const dataTables = [
  { name: "users", table: users },
  { name: "categories", table: categories },
  { name: "articles", table: articles },
  { name: "notes", table: notes },
] as const;

export const DATA_FILE = "data.json";
export const IMAGES_DIR = "images";
export const IMAGES_MANIFEST = "images.json";
export const IMAGE_COLUMN = "imageUrl";

export interface ImageEntry {
  file: string;
  table: string;
  id: number;
  column: string;
  url: string;
}
