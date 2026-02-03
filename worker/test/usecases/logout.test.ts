import { describe, test, expect, beforeEach } from "bun:test";
import { logout } from "../../usecases/logout.usecase";
import { createMemorySessionRepository } from "../../repositories/memory/session.memory";
import { createTestStore, seedTestStore } from "../setup";
import { createSession, resetAllFixtureCounters } from "../fixtures";

describe("logout", () => {
  beforeEach(() => {
    resetAllFixtureCounters();
  });

  test("deletes session when token is provided", async () => {
    const store = createTestStore();
    const session = createSession({ token: "logout-token" });
    seedTestStore(store, { sessions: [session] });

    const result = await logout(
      { sessionRepository: createMemorySessionRepository(store) },
      { token: "logout-token" },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.success).toBe(true);
    }
    expect(store.sessions.length).toBe(0);
  });

  test("returns success when token is null and leaves sessions untouched", async () => {
    const store = createTestStore();
    const session = createSession({ token: "session-token" });
    seedTestStore(store, { sessions: [session] });

    const result = await logout(
      { sessionRepository: createMemorySessionRepository(store) },
      { token: null },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.success).toBe(true);
    }
    expect(store.sessions.length).toBe(1);
  });
});
