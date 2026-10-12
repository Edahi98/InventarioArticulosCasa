import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

export interface UploadedImage {
  id: string;
  url: string;
}

export class CloudinaryService {
  /**
   * Sube una imagen a Cloudinary.
   *
   * @param buffer - Contenido binario de la imagen.
   * @param folder - Carpeta de destino en Cloudinary.
   * @returns El `id` público y la `url` segura de la imagen subida.
   * @throws Error si Cloudinary rechaza la subida.
   */
  async uploadFromBuffer(buffer: Buffer, folder = "inventario-casa"): Promise<UploadedImage> {
    const response = await this.streamUpload(buffer, folder);
    return { id: response.public_id, url: response.secure_url };
  }

  /**
   * Envía el buffer a Cloudinary mediante un stream de subida.
   *
   * @param buffer - Contenido binario de la imagen.
   * @param folder - Carpeta de destino.
   * @returns La respuesta de Cloudinary.
   */
  private streamUpload(buffer: Buffer, folder: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("No se pudo subir la imagen a Cloudinary."));
            return;
          }
          resolve(result);
        },
      );
      uploadStream.end(buffer);
    });
  }
}

export const cloudinaryService = new CloudinaryService();
