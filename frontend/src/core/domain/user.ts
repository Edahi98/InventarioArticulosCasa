export interface SystemUser {
  id: number;
  username: string;
  createdAt: string;
}

export interface NewUserInput {
  username: string;
  password: string;
}

export interface UpdateUserInput {
  username: string;
  password?: string;
}

export interface UserRepository {
  findAll(): Promise<SystemUser[]>;
  create(input: NewUserInput): Promise<SystemUser>;
  update(id: number, input: UpdateUserInput): Promise<SystemUser>;
  remove(id: number): Promise<void>;
}
