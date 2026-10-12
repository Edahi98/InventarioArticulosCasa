import type { TelegramLinkCode, TelegramLinkRepository } from "../core/domain/telegramLink.js";
import { authenticatedHttpClient } from "../services/http/AuthenticatedHttpClient.js";

export class HttpTelegramLinkRepository implements TelegramLinkRepository {
  async createCode(): Promise<TelegramLinkCode> {
    return authenticatedHttpClient.request<TelegramLinkCode>("/auth/telegram/code", {
      method: "POST",
    });
  }
}

export const httpTelegramLinkRepository = new HttpTelegramLinkRepository();
