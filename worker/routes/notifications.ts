import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppBindings } from "../types";
import { authMiddleware } from "../middleware/auth";
import { createD1PushSubscriptionRepository } from "../repositories/d1/push-subscription.d1";
import { createWebPushService } from "../services/web-push";

const notifications = new Hono<AppBindings>();

// Public: return VAPID public key
notifications.get("/vapid-key", (c) => {
  return c.json({
    data: { vapidPublicKey: c.env.VAPID_PUBLIC_KEY },
  });
});

// Protected routes
const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

notifications.post(
  "/subscribe",
  authMiddleware,
  zValidator("json", subscribeSchema),
  async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");
    const repo = createD1PushSubscriptionRepository(c.env);

    const subscription = await repo.upsert(
      user.id,
      body.endpoint,
      body.keys.p256dh,
      body.keys.auth,
    );

    return c.json({ data: { subscription: { id: subscription.id } } });
  },
);

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

notifications.delete(
  "/subscribe",
  authMiddleware,
  zValidator("json", unsubscribeSchema),
  async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");
    const repo = createD1PushSubscriptionRepository(c.env);

    const deleted = await repo.deleteByUserAndEndpoint(user.id, body.endpoint);

    return c.json({ data: { deleted } });
  },
);

notifications.get("/status", authMiddleware, async (c) => {
  const user = c.get("user");
  const repo = createD1PushSubscriptionRepository(c.env);

  const subscriptions = await repo.getByUserId(user.id);

  return c.json({
    data: {
      subscribed: subscriptions.length > 0,
      count: subscriptions.length,
    },
  });
});

notifications.post("/test", authMiddleware, async (c) => {
  const user = c.get("user");
  const repo = createD1PushSubscriptionRepository(c.env);

  const subscriptions = await repo.getByUserId(user.id);
  if (subscriptions.length === 0) {
    return c.json({ error: "No push subscriptions found" }, 400);
  }

  const webPush = createWebPushService(
    c.env.VAPID_PUBLIC_KEY,
    c.env.VAPID_PRIVATE_KEY,
    c.env.VAPID_SUBJECT,
  );

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    const result = await webPush.sendNotification(
      { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
      {
        title: "Test notification",
        body: "Push notifications are working!",
        tag: "test",
      },
    );

    if (result.success) {
      sent++;
    } else {
      failed++;
      if (result.gone) {
        await repo.deleteByUserAndEndpoint(user.id, sub.endpoint);
      }
    }
  }

  return c.json({ data: { sent, failed } });
});

export default notifications;
