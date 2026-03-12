import type { NotificationLogRepository } from "../interfaces/notification-log.repository";
import type { Env } from "../../types";

export function createD1NotificationLogRepository(
  env: Env,
): NotificationLogRepository {
  return {
    async hasBeenSent(key: string): Promise<boolean> {
      const row = await env.DB.prepare(
        "SELECT 1 FROM notification_log WHERE key = ?",
      )
        .bind(key)
        .first();
      return row !== null;
    },

    async record(key: string): Promise<void> {
      await env.DB.prepare(
        "INSERT OR IGNORE INTO notification_log (key) VALUES (?)",
      )
        .bind(key)
        .run();
    },
  };
}
