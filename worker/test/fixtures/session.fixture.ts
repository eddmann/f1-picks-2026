/**
 * Session test fixtures
 */

import type { Session } from "../../../shared/types";

let sessionIdCounter = 1;

export interface CreateSessionOptions {
  id?: number;
  userId?: number;
  token?: string;
  expiresAt?: string;
  createdAt?: string;
}

export function createSession(options: CreateSessionOptions = {}): Session {
  const id = options.id ?? sessionIdCounter++;
  const thirtyDaysFromNow = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  ).toISOString();
  return {
    id,
    user_id: options.userId ?? 1,
    token: options.token ?? `test-token-${id}`,
    expires_at: options.expiresAt ?? thirtyDaysFromNow,
    created_at: options.createdAt ?? new Date().toISOString(),
  };
}

export function createExpiredSession(
  options: CreateSessionOptions = {},
): Session {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  return createSession({ ...options, expiresAt: oneDayAgo });
}

export function resetSessionIdCounter(): void {
  sessionIdCounter = 1;
}
