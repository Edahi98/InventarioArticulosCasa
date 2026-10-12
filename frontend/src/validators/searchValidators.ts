import { z } from "zod";
import { searchTextSchema } from "./commonValidators.js";

export const searchForm = z.object({ q: searchTextSchema });

export type SearchFormInput = z.output<typeof searchForm>;
