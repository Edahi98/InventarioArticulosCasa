import { z } from "zod";
import { searchTextSchema } from "./commonValidators.js";

export const searchQuery = z.object({ q: searchTextSchema });

export type SearchQuery = z.infer<typeof searchQuery>;
