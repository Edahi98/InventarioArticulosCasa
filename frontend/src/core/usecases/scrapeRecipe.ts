import type { PageRepository, SourceList } from "../domain/checklist.js";
import { PAGE_TITLE_SEPARATOR } from "../../constantes/checklist_constantes.js";
import { httpPageRepository } from "../../infrastructure/httpPageRepository.js";
import { recipeSourceSelector, type RecipeSourceSelector } from "./recipeSourceSelector.js";

export interface RecipePage {
  planName: string;
  lists: SourceList[];
}

export class ScrapeRecipeUseCase {
  constructor(
    private readonly repository: PageRepository,
    private readonly selector: RecipeSourceSelector,
  ) {}

  /**
   * Lee una página y devuelve de dónde sacar las cosas: primero sus listas y tablas, y solo si no tiene
   * ninguna utilizable, sus encabezados y párrafos.
   *
   * @param url - Dirección http o https pública de la página.
   * @returns El nombre sugerido para el plan y las fuentes encontradas, de la más parecida a una lista de cosas a la menos.
   * @throws Error si la página no se puede leer.
   */
  async execute(url: string): Promise<RecipePage> {
    const page = await this.repository.scrape(url);
    return {
      planName: page.title.split(PAGE_TITLE_SEPARATOR)[0]?.trim() ?? "",
      lists: this.selector.select(page),
    };
  }
}

export const scrapeRecipeUseCase = new ScrapeRecipeUseCase(httpPageRepository, recipeSourceSelector);
