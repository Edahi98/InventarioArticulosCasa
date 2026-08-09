import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

export interface UploadedImage {
  id: string;
  url: string;
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  api_key: process.env.CLOUDINARY_API_KEY ?? "",
  api_secret: process.env.CLOUDINARY_API_SECRET ?? "",
});

export class CloudinaryService {
  async uploadFromBuffer(buffer: Buffer, folder = "inventario-casa"): Promise<UploadedImage> {
    const response = await this.streamUpload(buffer, folder);
    return { id: response.public_id, url: response.secure_url };
  }

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
