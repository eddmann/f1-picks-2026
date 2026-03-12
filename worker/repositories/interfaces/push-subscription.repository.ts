export interface PushSubscriptionRecord {
  id: number;
  user_id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export interface PushSubscriptionRepository {
  getByUserId(userId: number): Promise<PushSubscriptionRecord[]>;
  getAllActive(): Promise<PushSubscriptionRecord[]>;
  getForUsersWithoutPick(raceId: number): Promise<PushSubscriptionRecord[]>;
  upsert(
    userId: number,
    endpoint: string,
    p256dh: string,
    auth: string,
  ): Promise<PushSubscriptionRecord>;
  deleteByUserAndEndpoint(userId: number, endpoint: string): Promise<boolean>;
  deleteByEndpoint(endpoint: string): Promise<void>;
}
