import type { IStorageAdapter } from "./adapters/IStorageAdapter.js";

const engine = (process.env.STORAGE ?? "cloudinary") as "cloudinary" | "ftp";

const adapter: IStorageAdapter =
  engine === "ftp"
    ? new (await import("./adapters/FtpAdapter.js")).FtpAdapter()
    : new (await import("./adapters/CloudinaryAdapter.js")).CloudinaryAdapter();

export const storage = adapter;
