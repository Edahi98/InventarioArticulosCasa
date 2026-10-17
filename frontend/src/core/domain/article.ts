export interface Article {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  categoryId: number;
  stock: number;
  needsRepair: boolean;
  location: string;
  createdAt: string;
}

export interface NewArticleInput {
  name: string;
  description: string;
  imageUrl: string;
  categoryId: number;
  stock: number;
  needsRepair: boolean;
  location: string;
}

export interface UploadedImage {
  id: string;
  url: string;
}

export interface ArticleRepository {
  create(input: NewArticleInput): Promise<Article>;
  uploadImage(file: File): Promise<UploadedImage>;
  findById(id: number): Promise<Article>;
  findByCategoryId(categoryId: number): Promise<Article[]>;
  update(id: number, input: NewArticleInput): Promise<Article>;
  remove(id: number): Promise<void>;
}
