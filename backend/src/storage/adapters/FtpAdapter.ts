import * as ftp from "basic-ftp";
import { Readable } from "node:stream";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { IStorageAdapter, UploadedFile } from "./IStorageAdapter.js";

export class FtpAdapter implements IStorageAdapter {
  private readonly host: string;
  private readonly port: number;
  private readonly user: string;
  private readonly password: string;
  private readonly folder: string;
  /** URL base HTTP desde donde el backend sirve los archivos como static. */
  private readonly publicBaseUrl: string;

  constructor() {
    this.host = process.env.FTP_HOST ?? "localhost";
    this.port = Number(process.env.FTP_PORT ?? 21);
    this.user = process.env.FTP_USER ?? "user";
    this.password = process.env.FTP_PASS ?? "user";
    this.folder = process.env.FTP_FOLDER ?? "/";
    this.publicBaseUrl = (process.env.PUBLIC_URL ?? "http://localhost:4000").replace(/\/$/, "");
  }

  private async withClient<T>(fn: (client: ftp.Client) => Promise<T>): Promise<T> {
    const client = new ftp.Client();
    try {
      await client.access({
        host: this.host,
        port: this.port,
        user: this.user,
        password: this.password,
        secure: false,
      });
      return await fn(client);
    } finally {
      client.close();
    }
  }

  async upload(buffer: Buffer, originalName: string): Promise<UploadedFile> {
    const ext = path.extname(originalName) || ".bin";
    const filename = `${randomUUID()}${ext}`;
    const remotePath = path.posix.join(this.folder, filename);

    await this.withClient(async (client) => {
      const stream = Readable.from(buffer);
      await client.uploadFrom(stream, remotePath);
    });

    return {
      id: remotePath,
      url: `${this.publicBaseUrl}/files/${filename}`,
    };
  }

  async delete(id: string): Promise<void> {
    await this.withClient((client) => client.remove(id));
  }

  /** Lista los archivos del directorio remoto. */
  async list(): Promise<ftp.FileInfo[]> {
    return this.withClient((client) => client.list(this.folder));
  }
}
