import type { NewUserInput, SystemUser, UserRepository } from "../domain/user.js";
import { httpUserRepository } from "../../infrastructure/httpUserRepository.js";

export class CreateUserUseCase {
  constructor(private readonly repository: UserRepository) {}

  async execute(input: NewUserInput): Promise<SystemUser> {
    return this.repository.create(input);
  }
}

export const createUserUseCase = new CreateUserUseCase(httpUserRepository);
