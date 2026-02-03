import type { User } from "../../../shared/types";
import type { UserRepository } from "../interfaces/user.repository";
import type { Env } from "../../types";

export function createD1UserRepository(env: Env): UserRepository {
  return {
    async getByEmail(email: string): Promise<User | null> {
      return env.DB.prepare("SELECT * FROM users WHERE email = ?")
        .bind(email)
        .first<User>();
    },

    async getById(id: number): Promise<User | null> {
      return env.DB.prepare("SELECT * FROM users WHERE id = ?")
        .bind(id)
        .first<User>();
    },

    async create(
      email: string,
      name: string,
      passwordHash: string,
      timezone: string,
    ): Promise<User> {
      const result = await env.DB.prepare(
        "INSERT INTO users (email, name, password_hash, timezone) VALUES (?, ?, ?, ?) RETURNING *",
      )
        .bind(email, name, passwordHash, timezone)
        .first<User>();
      return result!;
    },
  };
}
