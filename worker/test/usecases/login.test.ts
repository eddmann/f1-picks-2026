import { describe, test, expect, beforeEach } from "bun:test";
import { login } from "../../usecases/login.usecase";
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
  generate: () => "test-token-456",
};

describe("login", () => {
  beforeEach(() => {
    resetAllFixtureCounters();
  });

  test("returns user and token for valid credentials", async () => {
    const store = createTestStore();
    const user = createUser({
      email: "test@example.com",
      name: "Test User",
      passwordHash: "hashed:password123",
    });
    seedTestStore(store, { users: [user] });

    const deps = {
      userRepository: createMemoryUserRepository(store),
      sessionRepository: createMemorySessionRepository(store),
      passwordService: stubPasswordService,
      tokenService: stubTokenService,
    };

    const result = await login(deps, {
      email: "test@example.com",
      password: "password123",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.user.email).toBe("test@example.com");
      expect(result.value.user.name).toBe("Test User");
      expect(result.value.token).toBe("test-token-456");
    }
  });

  test("lowercases email", async () => {
    const store = createTestStore();
    const user = createUser({
      email: "test@example.com",
      passwordHash: "hashed:password123",
    });
    seedTestStore(store, { users: [user] });

    const deps = {
      userRepository: createMemoryUserRepository(store),
      sessionRepository: createMemorySessionRepository(store),
      passwordService: stubPasswordService,
      tokenService: stubTokenService,
    };

    const result = await login(deps, {
      email: "TEST@EXAMPLE.COM",
      password: "password123",
    });

    expect(result.ok).toBe(true);
  });

  test("returns UNAUTHORIZED for nonexistent email", async () => {
    const store = createTestStore();
    const deps = {
      userRepository: createMemoryUserRepository(store),
      sessionRepository: createMemorySessionRepository(store),
      passwordService: stubPasswordService,
      tokenService: stubTokenService,
    };

    const result = await login(deps, {
      email: "nobody@example.com",
      password: "password123",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });

  test("returns UNAUTHORIZED for wrong password", async () => {
    const store = createTestStore();
    const user = createUser({
      email: "test@example.com",
      passwordHash: "hashed:correctpassword",
    });
    seedTestStore(store, { users: [user] });

    const deps = {
      userRepository: createMemoryUserRepository(store),
      sessionRepository: createMemorySessionRepository(store),
      passwordService: stubPasswordService,
      tokenService: stubTokenService,
    };

    const result = await login(deps, {
      email: "test@example.com",
      password: "wrongpassword",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });

  test("returns VALIDATION_ERROR for missing email", async () => {
    const store = createTestStore();
    const deps = {
      userRepository: createMemoryUserRepository(store),
      sessionRepository: createMemorySessionRepository(store),
      passwordService: stubPasswordService,
      tokenService: stubTokenService,
    };

    const result = await login(deps, {
      email: "",
      password: "password123",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  test("returns VALIDATION_ERROR for missing password", async () => {
    const store = createTestStore();
    const deps = {
      userRepository: createMemoryUserRepository(store),
      sessionRepository: createMemorySessionRepository(store),
      passwordService: stubPasswordService,
      tokenService: stubTokenService,
    };

    const result = await login(deps, {
      email: "test@example.com",
      password: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  test("creates session on successful login", async () => {
    const store = createTestStore();
    const user = createUser({
      email: "test@example.com",
      passwordHash: "hashed:password123",
    });
    seedTestStore(store, { users: [user] });

    const deps = {
      userRepository: createMemoryUserRepository(store),
      sessionRepository: createMemorySessionRepository(store),
      passwordService: stubPasswordService,
      tokenService: stubTokenService,
    };

    await login(deps, {
      email: "test@example.com",
      password: "password123",
    });

    expect(store.sessions.length).toBe(1);
    expect(store.sessions[0].token).toBe("test-token-456");
    expect(store.sessions[0].user_id).toBe(user.id);
  });

  test("returns admin status correctly", async () => {
    const store = createTestStore();
    const admin = createUser({
      email: "admin@example.com",
      passwordHash: "hashed:adminpass",
      isAdmin: true,
    });
    seedTestStore(store, { users: [admin] });

    const deps = {
      userRepository: createMemoryUserRepository(store),
      sessionRepository: createMemorySessionRepository(store),
      passwordService: stubPasswordService,
      tokenService: stubTokenService,
    };

    const result = await login(deps, {
      email: "admin@example.com",
      password: "adminpass",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.user.is_admin).toBe(true);
    }
  });
});
