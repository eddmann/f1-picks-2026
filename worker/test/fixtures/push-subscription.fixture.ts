/**
 * PushSubscription test fixtures
 */

import type { PushSubscriptionRecord } from "../../repositories/interfaces/push-subscription.repository";

let pushSubscriptionIdCounter = 1;

export interface CreatePushSubscriptionOptions {
  id?: number;
  userId?: number;
  endpoint?: string;
  p256dh?: string;
  auth?: string;
  createdAt?: string;
}

export function createPushSubscription(
  options: CreatePushSubscriptionOptions = {},
): PushSubscriptionRecord {
  const id = options.id ?? pushSubscriptionIdCounter++;
  return {
    id,
    user_id: options.userId ?? 1,
    endpoint: options.endpoint ?? `https://push.example.com/sub/${id}`,
    p256dh: options.p256dh ?? `p256dh-key-${id}`,
    auth: options.auth ?? `auth-key-${id}`,
    created_at: options.createdAt ?? new Date().toISOString(),
  };
}

export function resetPushSubscriptionIdCounter(): void {
  pushSubscriptionIdCounter = 1;
}
