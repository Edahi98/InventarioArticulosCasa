import { v2 as cloudinary } from "cloudinary";
import type { IStorageAdapter, UploadedFile } from "./IStorageAdapter.js";

export class CloudinaryAdapter implements IStorageAdapter {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? "",
      api_key: process.env.CLOUDINARY_API_KEY ?? "",
      api_secret: process.env.CLOUDINARY_API_SECRET ?? "",
    });
  }

  upload(buffer: Buffer, _originalName: string): Promise<UploadedFile> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "inventario-casa" },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary no devolvió resultado."));
            return;
          }
          resolve({ id: result.public_id, url: result.secure_url });
        }
      );
      stream.end(buffer);
    });
  }

  async delete(id: string): Promise<void> {
    await cloudinary.uploader.destroy(id);
  }
}
