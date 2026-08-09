import type { UserRepository } from "../domain/user.js";
import { httpUserRepository } from "../../infrastructure/httpUserRepository.js";

export class DeleteUserUseCase {
  constructor(private readonly repository: UserRepository) {}

  async execute(id: number): Promise<void> {
    return this.repository.remove(id);
  }
}

export const deleteUserUseCase = new DeleteUserUseCase(httpUserRepository);
