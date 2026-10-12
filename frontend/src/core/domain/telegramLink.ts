export interface TelegramLinkCode {
  code: string;
  expiresAt: string;
  botUsername: string | null;
}

export interface TelegramLinkRepository {
  createCode(): Promise<TelegramLinkCode>;
}
