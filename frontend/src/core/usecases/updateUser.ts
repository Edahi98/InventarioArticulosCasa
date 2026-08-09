import type { SystemUser, UpdateUserInput, UserRepository } from "../domain/user.js";
import { httpUserRepository } from "../../infrastructure/httpUserRepository.js";

export class UpdateUserUseCase {
  constructor(private readonly repository: UserRepository) {}

  async execute(id: number, input: UpdateUserInput): Promise<SystemUser> {
    return this.repository.update(id, input);
  }
}

export const updateUserUseCase = new UpdateUserUseCase(httpUserRepository);
