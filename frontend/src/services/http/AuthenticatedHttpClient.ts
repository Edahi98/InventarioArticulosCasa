import { ref, type Ref } from "vue";
import { API_ROOT_URL } from "../../infrastructure/apiConfig.js";

const TOKEN_STORAGE_KEY = "inventario_auth_token";

export class TokenStorage {
  private readonly currentToken: Ref<string | null> = ref(localStorage.getItem(TOKEN_STORAGE_KEY));

  getToken(): string | null {
    return this.currentToken.value;
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    this.currentToken.value = token;
  }

  clearToken(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    this.currentToken.value = null;
  }

  hasToken(): boolean {
    return Boolean(this.currentToken.value);
  }
}

export const tokenStorage = new TokenStorage();

export class AuthenticatedHttpClient {
  constructor(private readonly storage: TokenStorage) {}

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = this.storage.getToken();
    const headers = new Headers(init.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_ROOT_URL}${path}`, { ...init, headers });

    if (response.status === 401) {
      this.storage.clearToken();
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message ?? "Ocurrió un error al comunicarse con el servidor.");
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  async login(username: string, password: string): Promise<void> {
    const response = await fetch(`${API_ROOT_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message ?? "No se pudo iniciar sesión.");
    }

    const { token } = (await response.json()) as { token: string };
    this.storage.setToken(token);
  }

  logout(): void {
    this.storage.clearToken();
  }

  isAuthenticated(): boolean {
    return this.storage.hasToken();
  }
}

export const authenticatedHttpClient = new AuthenticatedHttpClient(tokenStorage);
