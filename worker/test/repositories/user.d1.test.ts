import { describe, test, expect, beforeEach } from "bun:test";
import { createTestD1Env, clearD1Tables } from "../d1-setup";
import { createD1UserRepository } from "../../repositories/d1/user.d1";
import type { Env } from "../../types";
import type { UserRepository } from "../../repositories/interfaces/user.repository";

describe("D1 UserRepository", () => {
  let env: Env;
  let repo: UserRepository;

  beforeEach(async () => {
    env = await createTestD1Env();
    await clearD1Tables(env);
    repo = createD1UserRepository(env);
  });

  describe("create()", () => {
    test("inserts user and returns it", async () => {
      const user = await repo.create(
        "test@example.com",
        "Test User",
        "hashedpassword",
        "America/New_York",
      );

      expect(user.email).toBe("test@example.com");
      expect(user.name).toBe("Test User");
      expect(user.password_hash).toBe("hashedpassword");
      expect(user.timezone).toBe("America/New_York");
      expect(user.id).toBeDefined();
    });

    test("assigns auto-incremented id", async () => {
      const user1 = await repo.create(
        "user1@test.com",
        "User 1",
        "hash",
        "UTC",
      );
      const user2 = await repo.create(
        "user2@test.com",
        "User 2",
        "hash",
        "UTC",
      );

      expect(user2.id).toBeGreaterThan(user1.id);
    });

    test("defaults is_admin to false", async () => {
      const user = await repo.create("test@test.com", "Test", "hash", "UTC");

      expect(user.is_admin).toBe(0); // SQLite returns 0 for FALSE
    });
  });

  describe("getByEmail()", () => {
    test("returns null when email does not exist", async () => {
      const user = await repo.getByEmail("nonexistent@test.com");

      expect(user).toBeNull();
    });

    test("returns user by email", async () => {
      await repo.create("test@example.com", "Test User", "hash", "UTC");

      const user = await repo.getByEmail("test@example.com");

      expect(user).not.toBeNull();
      expect(user!.email).toBe("test@example.com");
      expect(user!.name).toBe("Test User");
    });

    test("email lookup is case-sensitive", async () => {
      await repo.create("Test@Example.com", "Test User", "hash", "UTC");

      const user = await repo.getByEmail("test@example.com");

      // SQLite is case-sensitive by default for string comparisons
      expect(user).toBeNull();
    });
  });

  describe("getById()", () => {
    test("returns null when id does not exist", async () => {
      const user = await repo.getById(999);

      expect(user).toBeNull();
    });

    test("returns user by id", async () => {
      const created = await repo.create("test@test.com", "Test", "hash", "UTC");

      const user = await repo.getById(created.id);

      expect(user).not.toBeNull();
      expect(user!.id).toBe(created.id);
      expect(user!.email).toBe("test@test.com");
    });
  });

  describe("email uniqueness", () => {
    test("throws on duplicate email", async () => {
      await repo.create("test@test.com", "User 1", "hash", "UTC");

      await expect(
        repo.create("test@test.com", "User 2", "hash", "UTC"),
      ).rejects.toThrow();
    });
  });
});
