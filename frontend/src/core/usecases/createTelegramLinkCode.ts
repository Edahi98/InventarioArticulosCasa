import type { TelegramLinkCode, TelegramLinkRepository } from "../domain/telegramLink.js";
import { httpTelegramLinkRepository } from "../../infrastructure/httpTelegramLinkRepository.js";

export class CreateTelegramLinkCodeUseCase {
  constructor(private readonly repository: TelegramLinkRepository) {}

  async execute(): Promise<TelegramLinkCode> {
    return this.repository.createCode();
  }
}

export const createTelegramLinkCodeUseCase = new CreateTelegramLinkCodeUseCase(httpTelegramLinkRepository);
