import type { Session } from "../../../shared/types";
import type { SessionRepository } from "../interfaces/session.repository";
import type { TestStore } from "../../test/setup";

export function createMemorySessionRepository(
  store: TestStore,
): SessionRepository {
  return {
    async create(userId: number, token: string): Promise<Session> {
      const expiresAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const newSession: Session = {
        id: store.sessions.length + 1,
        user_id: userId,
        token,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      };
      store.sessions.push(newSession);
      return newSession;
    },

    async delete(token: string): Promise<void> {
      const index = store.sessions.findIndex((s) => s.token === token);
      if (index !== -1) {
        store.sessions.splice(index, 1);
      }
    },

    async getValidSession(token: string): Promise<Session | null> {
      const session = store.sessions.find((s) => s.token === token);
      if (!session) return null;

      // Check if expired
      if (new Date(session.expires_at) <= new Date()) {
        return null;
      }

      return session;
    },
  };
}
