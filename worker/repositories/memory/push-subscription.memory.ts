import type {
  PushSubscriptionRepository,
  PushSubscriptionRecord,
} from "../interfaces/push-subscription.repository";
import type { TestStore } from "../../test/setup";

export function createMemoryPushSubscriptionRepository(
  store: TestStore,
): PushSubscriptionRepository {
  return {
    async getByUserId(userId: number): Promise<PushSubscriptionRecord[]> {
      return store.pushSubscriptions.filter((s) => s.user_id === userId);
    },

    async getAllActive(): Promise<PushSubscriptionRecord[]> {
      return [...store.pushSubscriptions];
    },

    async getForUsersWithoutPick(
      raceId: number,
    ): Promise<PushSubscriptionRecord[]> {
      const userIdsWithPick = new Set(
        store.picks.filter((p) => p.race_id === raceId).map((p) => p.user_id),
      );
      return store.pushSubscriptions.filter(
        (s) => !userIdsWithPick.has(s.user_id),
      );
    },

    async upsert(
      userId: number,
      endpoint: string,
      p256dh: string,
      auth: string,
    ): Promise<PushSubscriptionRecord> {
      const existing = store.pushSubscriptions.findIndex(
        (s) => s.endpoint === endpoint,
      );
      const record: PushSubscriptionRecord = {
        id:
          existing >= 0
            ? store.pushSubscriptions[existing].id
            : store.pushSubscriptions.length + 1,
        user_id: userId,
        endpoint,
        p256dh,
        auth,
        created_at:
          existing >= 0
            ? store.pushSubscriptions[existing].created_at
            : new Date().toISOString(),
      };
      if (existing >= 0) {
        store.pushSubscriptions[existing] = record;
      } else {
        store.pushSubscriptions.push(record);
      }
      return record;
    },

    async deleteByUserAndEndpoint(
      userId: number,
      endpoint: string,
    ): Promise<boolean> {
      const idx = store.pushSubscriptions.findIndex(
        (s) => s.user_id === userId && s.endpoint === endpoint,
      );
      if (idx >= 0) {
        store.pushSubscriptions.splice(idx, 1);
        return true;
      }
      return false;
    },

    async deleteByEndpoint(endpoint: string): Promise<void> {
      const idx = store.pushSubscriptions.findIndex(
        (s) => s.endpoint === endpoint,
      );
      if (idx >= 0) {
        store.pushSubscriptions.splice(idx, 1);
      }
    },
  };
}
