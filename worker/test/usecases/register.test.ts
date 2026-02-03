import { describe, test, expect, beforeEach } from "bun:test";
import { register } from "../../usecases/register.usecase";
import { createMemoryUserRepository } from "../../repositories/memory/user.memory";
import { createMemorySessionRepository } from "../../repositories/memory/session.memory";
import { createTestStore, seedTestStore } from "../setup";
import { createUser, resetAllFixtureCounters } from "../fixtures";
import type {
  PasswordService,
  TokenService,
} from "../../services/auth.service";

// Stub services for testing
const stubPasswordService: PasswordService = {
  hash: async (p: string) => `hashed:${p}`,
  verify: async (p: string, h: string) => h === `hashed:${p}`,
};

const stubTokenService: TokenService = {
  generate: () => "test-token-123",
};

describe("register", () => {
  beforeEach(() => {
    resetAllFixtureCounters();
  });

  test("creates new user and returns token", async () => {
    const store = createTestStore();
    const deps = {
      userRepository: createMemoryUserRepository(store),
      sessionRepository: createMemorySessionRepository(store),
      passwordService: stubPasswordService,
      tokenService: stubTokenService,
    };

    const result = await register(deps, {
      email: "test@example.com",
      name: "Test User",
      password: "password123",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.user.email).toBe("test@example.com");
      expect(result.value.user.name).toBe("Test User");
      expect(result.value.user.timezone).toBe("UTC");
      expect(result.value.user.is_admin).toBe(false);
      expect(result.value.token).toBe("test-token-123");
    }
  });

  test("uses provided timezone", async () => {
    const store = createTestStore();
    const deps = {
      userRepository: createMemoryUserRepository(store),
      sessionRepository: createMemorySessionRepository(store),
      passwordService: stubPasswordService,
      tokenService: stubTokenService,
    };

    const result = await register(deps, {
      email: "test@example.com",
      name: "Test User",
      password: "password123",
      timezone: "America/New_York",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.user.timezone).toBe("America/New_York");
    }
  });

  test("lowercases email", async () => {
    const store = createTestStore();
    const deps = {
      userRepository: createMemoryUserRepository(store),
      sessionRepository: createMemorySessionRepository(store),
      passwordService: stubPasswordService,
      tokenService: stubTokenService,
    };

    const result = await register(deps, {
      email: "TEST@EXAMPLE.COM",
      name: "Test User",
      password: "password123",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.user.email).toBe("test@example.com");
    }
  });

  test("returns CONFLICT when email already exists", async () => {
    const store = createTestStore();
    const existingUser = createUser({ email: "test@example.com" });
    seedTestStore(store, { users: [existingUser] });

    const deps = {
      userRepository: createMemoryUserRepository(store),
      sessionRepository: createMemorySessionRepository(store),
      passwordService: stubPasswordService,
      tokenService: stubTokenService,
    };

    const result = await register(deps, {
      email: "test@example.com",
      name: "Test User",
      password: "password123",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("CONFLICT");
    }
  });

  test("returns VALIDATION_ERROR for invalid email", async () => {
    const store = createTestStore();
    const deps = {
      userRepository: createMemoryUserRepository(store),
      sessionRepository: createMemorySessionRepository(store),
      passwordService: stubPasswordService,
      tokenService: stubTokenService,
    };

    const result = await register(deps, {
      email: "not-an-email",
      name: "Test User",
      password: "password123",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  test("returns VALIDATION_ERROR for empty name", async () => {
    const store = createTestStore();
    const deps = {
      userRepository: createMemoryUserRepository(store),
      sessionRepository: createMemorySessionRepository(store),
      passwordService: stubPasswordService,
      tokenService: stubTokenService,
    };

    const result = await register(deps, {
      email: "test@example.com",
      name: "",
      password: "password123",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  test("returns VALIDATION_ERROR for short password", async () => {
    const store = createTestStore();
    const deps = {
      userRepository: createMemoryUserRepository(store),
      sessionRepository: createMemorySessionRepository(store),
      passwordService: stubPasswordService,
      tokenService: stubTokenService,
    };

    const result = await register(deps, {
      email: "test@example.com",
      name: "Test User",
      password: "123",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  test("creates session for new user", async () => {
    const store = createTestStore();
    const deps = {
      userRepository: createMemoryUserRepository(store),
      sessionRepository: createMemorySessionRepository(store),
      passwordService: stubPasswordService,
      tokenService: stubTokenService,
    };

    await register(deps, {
      email: "test@example.com",
      name: "Test User",
      password: "password123",
    });

    expect(store.sessions.length).toBe(1);
    expect(store.sessions[0].token).toBe("test-token-123");
  });
});
