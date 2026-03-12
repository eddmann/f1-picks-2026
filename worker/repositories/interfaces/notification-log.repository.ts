export interface NotificationLogRecord {
  id: number;
  key: string;
  sent_at: string;
}

export interface NotificationLogRepository {
  hasBeenSent(key: string): Promise<boolean>;
  record(key: string): Promise<void>;
}
