import type { SystemUser, UserRepository } from "../domain/user.js";
import { httpUserRepository } from "../../infrastructure/httpUserRepository.js";

export class ListUsersUseCase {
  constructor(private readonly repository: UserRepository) {}

  async execute(): Promise<SystemUser[]> {
    return this.repository.findAll();
  }
}

export const listUsersUseCase = new ListUsersUseCase(httpUserRepository);
