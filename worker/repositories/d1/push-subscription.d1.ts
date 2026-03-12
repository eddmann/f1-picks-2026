import type {
  PushSubscriptionRepository,
  PushSubscriptionRecord,
} from "../interfaces/push-subscription.repository";
import type { Env } from "../../types";

export function createD1PushSubscriptionRepository(
  env: Env,
): PushSubscriptionRepository {
  return {
    async getByUserId(userId: number): Promise<PushSubscriptionRecord[]> {
      const result = await env.DB.prepare(
        "SELECT * FROM push_subscriptions WHERE user_id = ?",
      )
        .bind(userId)
        .all<PushSubscriptionRecord>();
      return result.results;
    },

    async getAllActive(): Promise<PushSubscriptionRecord[]> {
      const result = await env.DB.prepare(
        "SELECT * FROM push_subscriptions",
      ).all<PushSubscriptionRecord>();
      return result.results;
    },

    async getForUsersWithoutPick(
      raceId: number,
    ): Promise<PushSubscriptionRecord[]> {
      const result = await env.DB.prepare(
        `SELECT ps.* FROM push_subscriptions ps
         WHERE ps.user_id NOT IN (SELECT p.user_id FROM picks p WHERE p.race_id = ?)`,
      )
        .bind(raceId)
        .all<PushSubscriptionRecord>();
      return result.results;
    },

    async upsert(
      userId: number,
      endpoint: string,
      p256dh: string,
      auth: string,
    ): Promise<PushSubscriptionRecord> {
      const result = await env.DB.prepare(
        `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(endpoint) DO UPDATE SET
           user_id = excluded.user_id,
           p256dh = excluded.p256dh,
           auth = excluded.auth
         RETURNING *`,
      )
        .bind(userId, endpoint, p256dh, auth)
        .first<PushSubscriptionRecord>();
      return result!;
    },

    async deleteByUserAndEndpoint(
      userId: number,
      endpoint: string,
    ): Promise<boolean> {
      const result = await env.DB.prepare(
        "DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?",
      )
        .bind(userId, endpoint)
        .run();
      return (result.meta.changes ?? 0) > 0;
    },

    async deleteByEndpoint(endpoint: string): Promise<void> {
      await env.DB.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?")
        .bind(endpoint)
        .run();
    },
  };
}
