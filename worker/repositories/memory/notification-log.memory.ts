import type {
  NotificationLogRepository,
  NotificationLogRecord,
} from "../interfaces/notification-log.repository";
import type { TestStore } from "../../test/setup";

export function createMemoryNotificationLogRepository(
  store: TestStore,
): NotificationLogRepository {
  return {
    async hasBeenSent(key: string): Promise<boolean> {
      return store.notificationLogs.some((log) => log.key === key);
    },

    async record(key: string): Promise<void> {
      if (store.notificationLogs.some((log) => log.key === key)) return;
      const record: NotificationLogRecord = {
        id: store.notificationLogs.length + 1,
        key,
        sent_at: new Date().toISOString(),
      };
      store.notificationLogs.push(record);
    },
  };
}
