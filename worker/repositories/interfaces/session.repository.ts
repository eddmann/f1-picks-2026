import type { Session } from "../../../shared/types";

export interface SessionRepository {
  /**
   * Create a new session for a user
   */
  create(userId: number, token: string): Promise<Session>;

  /**
   * Delete a session by token
   */
  delete(token: string): Promise<void>;

  /**
   * Get a valid (non-expired) session by token
   */
  getValidSession(token: string): Promise<Session | null>;
}
