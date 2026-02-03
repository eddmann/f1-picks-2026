import type { User } from "../../../shared/types";
import type { UserRepository } from "../interfaces/user.repository";
import type { TestStore } from "../../test/setup";

export function createMemoryUserRepository(store: TestStore): UserRepository {
  return {
    async getByEmail(email: string): Promise<User | null> {
      return store.users.find((u) => u.email === email) ?? null;
    },

    async getById(id: number): Promise<User | null> {
      return store.users.find((u) => u.id === id) ?? null;
    },

    async create(
      email: string,
      name: string,
      passwordHash: string,
      timezone: string,
    ): Promise<User> {
      const newUser: User = {
        id: store.users.length + 1,
        email,
        name,
        password_hash: passwordHash,
        timezone,
        is_admin: false,
        created_at: new Date().toISOString(),
      };
      store.users.push(newUser);
      return newUser;
    },
  };
}
