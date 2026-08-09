export interface UploadedFile {
  /** Identificador único del archivo (public_id en Cloudinary, ruta relativa en FTP). */
  id: string;
  /** URL pública accesible por HTTP. */
  url: string;
}

export interface IStorageAdapter {
  upload(buffer: Buffer, originalName: string): Promise<UploadedFile>;
  delete(id: string): Promise<void>;
}
