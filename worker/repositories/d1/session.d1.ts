import type { Session } from "../../../shared/types";
import type { SessionRepository } from "../interfaces/session.repository";
import type { Env } from "../../types";

export function createD1SessionRepository(env: Env): SessionRepository {
  return {
    async create(userId: number, token: string): Promise<Session> {
      // 30 day expiry
      const expiresAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const result = await env.DB.prepare(
        "INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?) RETURNING *",
      )
        .bind(userId, token, expiresAt)
        .first<Session>();
      return result!;
    },

    async delete(token: string): Promise<void> {
      await env.DB.prepare("DELETE FROM sessions WHERE token = ?")
        .bind(token)
        .run();
    },

    async getValidSession(token: string): Promise<Session | null> {
      return env.DB.prepare(
        "SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')",
      )
        .bind(token)
        .first<Session>();
    },
  };
}
