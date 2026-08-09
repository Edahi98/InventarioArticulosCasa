import { tokenStorage, type TokenStorage } from "./AuthenticatedHttpClient.js";
import { API_ROOT_URL } from "../../infrastructure/apiConfig.js";

export class ExcelDownloadAdapter {
  constructor(private readonly storage: TokenStorage) {}

  async download(path: string, filename: string): Promise<void> {
    const token = this.storage.getToken();
    const headers = new Headers();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_ROOT_URL}${path}`, { headers });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message ?? "No se pudo generar el reporte.");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }
}

export const excelDownloadAdapter = new ExcelDownloadAdapter(tokenStorage);
