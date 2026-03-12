/**
 * NotificationLog test fixtures
 */

import type { NotificationLogRecord } from "../../repositories/interfaces/notification-log.repository";

let notificationLogIdCounter = 1;

export interface CreateNotificationLogOptions {
  id?: number;
  key?: string;
  sentAt?: string;
}

export function createNotificationLog(
  options: CreateNotificationLogOptions = {},
): NotificationLogRecord {
  const id = options.id ?? notificationLogIdCounter++;
  return {
    id,
    key: options.key ?? `race_results:${id}`,
    sent_at: options.sentAt ?? new Date().toISOString(),
  };
}

export function resetNotificationLogIdCounter(): void {
  notificationLogIdCounter = 1;
}
