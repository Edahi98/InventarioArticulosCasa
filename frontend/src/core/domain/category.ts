export interface Category {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  location: string;
  createdAt: string;
}

export interface NewCategoryInput {
  name: string;
  description: string;
  imageUrl: string;
  location: string;
}

export interface CategoryRepository {
  findAll(): Promise<Category[]>;
  create(input: NewCategoryInput): Promise<Category>;
  findById(id: number): Promise<Category>;
  update(id: number, input: NewCategoryInput): Promise<Category>;
  remove(id: number): Promise<void>;
}
