import { describe, test, expect, beforeEach } from "bun:test";
import { createTestD1Env, clearD1Tables } from "../d1-setup";
import { createD1NotificationLogRepository } from "../../repositories/d1/notification-log.d1";
import type { Env } from "../../types";
import type { NotificationLogRepository } from "../../repositories/interfaces/notification-log.repository";

describe("D1 NotificationLogRepository", () => {
  let env: Env;
  let repo: NotificationLogRepository;

  beforeEach(async () => {
    env = await createTestD1Env();
    await clearD1Tables(env);
    repo = createD1NotificationLogRepository(env);
  });

  describe("hasBeenSent()", () => {
    test("returns false when no log exists", async () => {
      const sent = await repo.hasBeenSent("race_results:1");

      expect(sent).toBe(false);
    });

    test("returns true after recording", async () => {
      await repo.record("race_results:1");

      const sent = await repo.hasBeenSent("race_results:1");

      expect(sent).toBe(true);
    });

    test("distinguishes different keys", async () => {
      await repo.record("race_results:1");

      expect(await repo.hasBeenSent("race_results:1")).toBe(true);
      expect(await repo.hasBeenSent("pick_window_open:1")).toBe(false);
      expect(await repo.hasBeenSent("race_results:2")).toBe(false);
    });
  });

  describe("record()", () => {
    test("stores notification log entry", async () => {
      await repo.record("pick_reminder:1");

      const sent = await repo.hasBeenSent("pick_reminder:1");
      expect(sent).toBe(true);
    });

    test("is idempotent for the same key", async () => {
      await repo.record("race_results:1");
      await repo.record("race_results:1");

      expect(await repo.hasBeenSent("race_results:1")).toBe(true);
    });

    test("allows multiple records for different keys", async () => {
      await repo.record("race_results:1");
      await repo.record("race_results:2");

      expect(await repo.hasBeenSent("race_results:1")).toBe(true);
      expect(await repo.hasBeenSent("race_results:2")).toBe(true);
    });
  });
});
