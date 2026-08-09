import type {
  NewUserInput,
  SystemUser,
  UpdateUserInput,
  UserRepository,
} from "../core/domain/user.js";
import { authenticatedHttpClient } from "../services/http/AuthenticatedHttpClient.js";

const API_BASE_URL = "/users";

export class HttpUserRepository implements UserRepository {
  async findAll(): Promise<SystemUser[]> {
    return authenticatedHttpClient.request<SystemUser[]>(API_BASE_URL);
  }

  async create(input: NewUserInput): Promise<SystemUser> {
    return authenticatedHttpClient.request<SystemUser>(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  async update(id: number, input: UpdateUserInput): Promise<SystemUser> {
    return authenticatedHttpClient.request<SystemUser>(`${API_BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  async remove(id: number): Promise<void> {
    await authenticatedHttpClient.request<void>(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
    });
  }
}

export const httpUserRepository = new HttpUserRepository();
