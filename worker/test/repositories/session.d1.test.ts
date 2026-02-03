import { describe, test, expect, beforeEach } from "bun:test";
import { createTestD1Env, clearD1Tables, execSQL } from "../d1-setup";
import { createD1SessionRepository } from "../../repositories/d1/session.d1";
import type { Env } from "../../types";
import type { SessionRepository } from "../../repositories/interfaces/session.repository";

describe("D1 SessionRepository", () => {
  let env: Env;
  let repo: SessionRepository;

  beforeEach(async () => {
    env = await createTestD1Env();
    await clearD1Tables(env);
    repo = createD1SessionRepository(env);

    // Seed a user for foreign key constraint
    await execSQL(
      env,
      `
      INSERT INTO users (id, email, name, password_hash, timezone) VALUES (1, 'test@test.com', 'Test User', 'hash', 'UTC');
    `,
    );
  });

  describe("create()", () => {
    test("inserts session and returns it", async () => {
      const session = await repo.create(1, "test-token-123");

      expect(session.user_id).toBe(1);
      expect(session.token).toBe("test-token-123");
      expect(session.id).toBeDefined();
      expect(session.expires_at).toBeDefined();
    });

    test("sets expiry to ~30 days in the future", async () => {
      const before = Date.now();
      const session = await repo.create(1, "test-token");
      const after = Date.now();

      const expiryTime = new Date(session.expires_at).getTime();
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

      // Should be about 30 days in the future (with some tolerance)
      expect(expiryTime).toBeGreaterThan(before + thirtyDaysInMs - 10000);
      expect(expiryTime).toBeLessThan(after + thirtyDaysInMs + 10000);
    });
  });

  describe("getValidSession()", () => {
    test("returns null when token does not exist", async () => {
      const session = await repo.getValidSession("nonexistent-token");

      expect(session).toBeNull();
    });

    test("returns session when token is valid and not expired", async () => {
      await repo.create(1, "valid-token");

      const session = await repo.getValidSession("valid-token");

      expect(session).not.toBeNull();
      expect(session!.token).toBe("valid-token");
      expect(session!.user_id).toBe(1);
    });

    test("returns null when session is expired", async () => {
      // Insert expired session directly
      await execSQL(
        env,
        `
        INSERT INTO sessions (user_id, token, expires_at)
          VALUES (1, 'expired-token', datetime('now', '-1 day'));
      `,
      );

      const session = await repo.getValidSession("expired-token");

      expect(session).toBeNull();
    });
  });

  describe("delete()", () => {
    test("removes session by token", async () => {
      await repo.create(1, "token-to-delete");

      await repo.delete("token-to-delete");

      const session = await repo.getValidSession("token-to-delete");
      expect(session).toBeNull();
    });

    test("does not throw when token does not exist", async () => {
      await expect(repo.delete("nonexistent")).resolves.toBeUndefined();
    });
  });

  describe("token uniqueness", () => {
    test("throws on duplicate token", async () => {
      await repo.create(1, "duplicate-token");

      await expect(repo.create(1, "duplicate-token")).rejects.toThrow();
    });
  });
});
