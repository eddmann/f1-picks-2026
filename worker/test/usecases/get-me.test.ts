import { describe, test, expect, beforeEach } from "bun:test";
import { getMe } from "../../usecases/get-me.usecase";
import { createMemoryUserRepository } from "../../repositories/memory/user.memory";
import { createMemorySessionRepository } from "../../repositories/memory/session.memory";
import { createTestStore, seedTestStore } from "../setup";
import {
  createUser,
  createSession,
  createExpiredSession,
  resetAllFixtureCounters,
} from "../fixtures";

describe("getMe", () => {
  beforeEach(() => {
    resetAllFixtureCounters();
  });

  function createDeps(store: ReturnType<typeof createTestStore>) {
    return {
      userRepository: createMemoryUserRepository(store),
      sessionRepository: createMemorySessionRepository(store),
    };
  }

  test("returns UNAUTHORIZED when token is missing", async () => {
    const store = createTestStore();

    const result = await getMe(createDeps(store), { token: null });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });

  test("returns UNAUTHORIZED when session is invalid", async () => {
    const store = createTestStore();

    const result = await getMe(createDeps(store), { token: "missing-token" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });

  test("returns UNAUTHORIZED when session is expired", async () => {
    const store = createTestStore();
    const session = createExpiredSession({ token: "expired-token" });
    seedTestStore(store, { sessions: [session] });

    const result = await getMe(createDeps(store), { token: "expired-token" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });

  test("returns UNAUTHORIZED when user is missing", async () => {
    const store = createTestStore();
    const session = createSession({ userId: 1, token: "valid-token" });
    seedTestStore(store, { sessions: [session] });

    const result = await getMe(createDeps(store), { token: "valid-token" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });

  test("returns public user when session is valid", async () => {
    const store = createTestStore();
    const user = createUser({ id: 1, isAdmin: true });
    const session = createSession({ userId: 1, token: "valid-token" });
    seedTestStore(store, { users: [user], sessions: [session] });

    const result = await getMe(createDeps(store), { token: "valid-token" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.user.id).toBe(1);
      expect(result.value.user.email).toBe(user.email);
      expect(result.value.user.is_admin).toBe(true);
    }
  });
});
