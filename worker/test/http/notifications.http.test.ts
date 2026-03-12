import { describe, test, expect } from "bun:test";
import { createHttpEnv, requestJson, registerAndLogin } from "./helpers";

describe("HTTP /api/notifications", () => {
  describe("GET /vapid-key", () => {
    test("returns vapid public key without auth", async () => {
      const env = await createHttpEnv();
      env.VAPID_PUBLIC_KEY = "test-vapid-public-key";

      const { res, body } = await requestJson<{
        data: { vapidPublicKey: string };
      }>(env, "/api/notifications/vapid-key");

      expect(res.status).toBe(200);
      expect(body.data.vapidPublicKey).toBe("test-vapid-public-key");
    });
  });

  describe("POST /subscribe", () => {
    test("returns 401 when not authenticated", async () => {
      const env = await createHttpEnv();

      const { res } = await requestJson(env, "/api/notifications/subscribe", {
        method: "POST",
        body: JSON.stringify({
          endpoint: "https://push.example.com/sub/1",
          keys: { p256dh: "key1", auth: "key2" },
        }),
      });

      expect(res.status).toBe(401);
    });

    test("returns 400 with invalid body", async () => {
      const env = await createHttpEnv();
      const { token } = await registerAndLogin(env);

      const { res } = await requestJson(env, "/api/notifications/subscribe", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ endpoint: "not-a-url" }),
      });

      expect(res.status).toBe(400);
    });

    test("subscribes successfully", async () => {
      const env = await createHttpEnv();
      const { token } = await registerAndLogin(env);

      const { res, body } = await requestJson<{
        data: { subscription: { id: number } };
      }>(env, "/api/notifications/subscribe", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          endpoint: "https://push.example.com/sub/1",
          keys: { p256dh: "p256dh-key", auth: "auth-key" },
        }),
      });

      expect(res.status).toBe(200);
      expect(body.data.subscription.id).toBeGreaterThan(0);
    });
  });

  describe("GET /status", () => {
    test("returns 401 when not authenticated", async () => {
      const env = await createHttpEnv();

      const { res } = await requestJson(env, "/api/notifications/status");

      expect(res.status).toBe(401);
    });

    test("returns not subscribed when no subscriptions", async () => {
      const env = await createHttpEnv();
      const { token } = await registerAndLogin(env);

      const { res, body } = await requestJson<{
        data: { subscribed: boolean; count: number };
      }>(env, "/api/notifications/status", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status).toBe(200);
      expect(body.data.subscribed).toBe(false);
      expect(body.data.count).toBe(0);
    });

    test("returns subscribed after subscribing", async () => {
      const env = await createHttpEnv();
      const { token } = await registerAndLogin(env);

      await requestJson(env, "/api/notifications/subscribe", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          endpoint: "https://push.example.com/sub/1",
          keys: { p256dh: "p256dh-key", auth: "auth-key" },
        }),
      });

      const { res, body } = await requestJson<{
        data: { subscribed: boolean; count: number };
      }>(env, "/api/notifications/status", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status).toBe(200);
      expect(body.data.subscribed).toBe(true);
      expect(body.data.count).toBe(1);
    });
  });

  describe("DELETE /subscribe", () => {
    test("unsubscribes successfully", async () => {
      const env = await createHttpEnv();
      const { token } = await registerAndLogin(env);

      await requestJson(env, "/api/notifications/subscribe", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          endpoint: "https://push.example.com/sub/1",
          keys: { p256dh: "p256dh-key", auth: "auth-key" },
        }),
      });

      const { res, body } = await requestJson<{
        data: { deleted: boolean };
      }>(env, "/api/notifications/subscribe", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          endpoint: "https://push.example.com/sub/1",
        }),
      });

      expect(res.status).toBe(200);
      expect(body.data.deleted).toBe(true);
    });
  });

  describe("POST /test", () => {
    test("returns 401 when not authenticated", async () => {
      const env = await createHttpEnv();

      const { res } = await requestJson(env, "/api/notifications/test", {
        method: "POST",
      });

      expect(res.status).toBe(401);
    });

    test("returns 400 when user has no subscriptions", async () => {
      const env = await createHttpEnv();
      const { token } = await registerAndLogin(env);

      const { res, body } = await requestJson<{ error: string }>(
        env,
        "/api/notifications/test",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      expect(res.status).toBe(400);
      expect(body.error).toBe("No push subscriptions found");
    });
  });
});
