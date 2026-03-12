import { describe, test, expect, beforeEach } from "bun:test";
import { createTestD1Env, clearD1Tables, execSQL } from "../d1-setup";
import { createD1PushSubscriptionRepository } from "../../repositories/d1/push-subscription.d1";
import type { Env } from "../../types";
import type { PushSubscriptionRepository } from "../../repositories/interfaces/push-subscription.repository";

describe("D1 PushSubscriptionRepository", () => {
  let env: Env;
  let repo: PushSubscriptionRepository;

  beforeEach(async () => {
    env = await createTestD1Env();
    await clearD1Tables(env);
    repo = createD1PushSubscriptionRepository(env);

    // Seed required foreign key data
    await execSQL(
      env,
      `
      INSERT INTO users (id, email, name, password_hash, timezone) VALUES (1, 'test@test.com', 'Test User', 'hash', 'UTC');
      INSERT INTO users (id, email, name, password_hash, timezone) VALUES (2, 'user2@test.com', 'User Two', 'hash', 'UTC');
      INSERT INTO seasons (id, year, name, is_active) VALUES (1, 2026, '2026', TRUE);
      INSERT INTO drivers (id, season_id, code, name, number, team, team_color) VALUES (1, 1, 'VER', 'Verstappen', 1, 'Red Bull', '#1E41FF');
      INSERT INTO races (id, season_id, round, name, location, circuit, country_code, quali_time, race_time)
        VALUES (1, 1, 1, 'Bahrain GP', 'Bahrain', 'Sakhir', 'BH', '2026-03-07T15:00:00Z', '2026-03-08T15:00:00Z');
    `,
    );
  });

  describe("upsert()", () => {
    test("inserts new subscription and returns it", async () => {
      const sub = await repo.upsert(
        1,
        "https://push.example.com/sub/1",
        "p256dh-key",
        "auth-key",
      );

      expect(sub.user_id).toBe(1);
      expect(sub.endpoint).toBe("https://push.example.com/sub/1");
      expect(sub.p256dh).toBe("p256dh-key");
      expect(sub.auth).toBe("auth-key");
      expect(sub.id).toBeDefined();
    });

    test("updates existing subscription on same endpoint", async () => {
      await repo.upsert(
        1,
        "https://push.example.com/sub/1",
        "old-key",
        "old-auth",
      );
      const updated = await repo.upsert(
        1,
        "https://push.example.com/sub/1",
        "new-key",
        "new-auth",
      );

      expect(updated.p256dh).toBe("new-key");
      expect(updated.auth).toBe("new-auth");

      const all = await repo.getAllActive();
      expect(all).toHaveLength(1);
    });
  });

  describe("getByUserId()", () => {
    test("returns empty array when no subscriptions", async () => {
      const subs = await repo.getByUserId(1);

      expect(subs).toEqual([]);
    });

    test("returns subscriptions for user", async () => {
      await repo.upsert(1, "https://push.example.com/sub/1", "key1", "auth1");
      await repo.upsert(1, "https://push.example.com/sub/2", "key2", "auth2");
      await repo.upsert(2, "https://push.example.com/sub/3", "key3", "auth3");

      const subs = await repo.getByUserId(1);

      expect(subs).toHaveLength(2);
      expect(subs.every((s) => s.user_id === 1)).toBe(true);
    });
  });

  describe("getAllActive()", () => {
    test("returns all subscriptions", async () => {
      await repo.upsert(1, "https://push.example.com/sub/1", "key1", "auth1");
      await repo.upsert(2, "https://push.example.com/sub/2", "key2", "auth2");

      const all = await repo.getAllActive();

      expect(all).toHaveLength(2);
    });
  });

  describe("getForUsersWithoutPick()", () => {
    test("returns subscriptions for users who have not picked", async () => {
      await repo.upsert(1, "https://push.example.com/sub/1", "key1", "auth1");
      await repo.upsert(2, "https://push.example.com/sub/2", "key2", "auth2");

      // User 1 has a pick for race 1
      await execSQL(
        env,
        "INSERT INTO picks (user_id, race_id, driver_id) VALUES (1, 1, 1)",
      );

      const subs = await repo.getForUsersWithoutPick(1);

      expect(subs).toHaveLength(1);
      expect(subs[0].user_id).toBe(2);
    });

    test("returns all subscriptions when no one has picked", async () => {
      await repo.upsert(1, "https://push.example.com/sub/1", "key1", "auth1");
      await repo.upsert(2, "https://push.example.com/sub/2", "key2", "auth2");

      const subs = await repo.getForUsersWithoutPick(1);

      expect(subs).toHaveLength(2);
    });
  });

  describe("deleteByUserAndEndpoint()", () => {
    test("deletes matching subscription and returns true", async () => {
      await repo.upsert(1, "https://push.example.com/sub/1", "key", "auth");

      const deleted = await repo.deleteByUserAndEndpoint(
        1,
        "https://push.example.com/sub/1",
      );

      expect(deleted).toBe(true);
      expect(await repo.getByUserId(1)).toHaveLength(0);
    });

    test("returns false when no match", async () => {
      const deleted = await repo.deleteByUserAndEndpoint(
        1,
        "https://push.example.com/nonexistent",
      );

      expect(deleted).toBe(false);
    });
  });

  describe("deleteByEndpoint()", () => {
    test("removes subscription by endpoint", async () => {
      await repo.upsert(1, "https://push.example.com/sub/1", "key", "auth");

      await repo.deleteByEndpoint("https://push.example.com/sub/1");

      expect(await repo.getAllActive()).toHaveLength(0);
    });
  });
});
