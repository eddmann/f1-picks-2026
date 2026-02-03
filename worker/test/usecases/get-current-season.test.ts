import { describe, test, expect, beforeEach } from "bun:test";
import { getCurrentSeason } from "../../usecases/get-current-season.usecase";
import { createMemorySeasonRepository } from "../../repositories/memory/season.memory";
import { createTestStore, seedTestStore } from "../setup";
import {
  createSeason,
  createInactiveSeason,
  resetAllFixtureCounters,
} from "../fixtures";

describe("getCurrentSeason", () => {
  beforeEach(() => {
    resetAllFixtureCounters();
  });

  test("returns active season when one exists", async () => {
    const store = createTestStore();
    const activeSeason = createSeason({ year: 2026, isActive: true });
    seedTestStore(store, { seasons: [activeSeason] });

    const seasonRepository = createMemorySeasonRepository(store);
    const result = await getCurrentSeason({ seasonRepository });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.year).toBe(2026);
      expect(result.value.is_active).toBe(true);
    }
  });

  test("returns NOT_FOUND error when no active season exists", async () => {
    const store = createTestStore();
    const inactiveSeason = createInactiveSeason({ year: 2025 });
    seedTestStore(store, { seasons: [inactiveSeason] });

    const seasonRepository = createMemorySeasonRepository(store);
    const result = await getCurrentSeason({ seasonRepository });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
      expect(result.error.entity).toBe("Season");
    }
  });

  test("returns NOT_FOUND error when no seasons exist", async () => {
    const store = createTestStore();
    const seasonRepository = createMemorySeasonRepository(store);
    const result = await getCurrentSeason({ seasonRepository });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  test("returns first active season when multiple exist", async () => {
    const store = createTestStore();
    // Note: In practice, only one season should be active, but test the behavior
    const season2025 = createSeason({ id: 1, year: 2025, isActive: true });
    const season2026 = createSeason({ id: 2, year: 2026, isActive: true });
    seedTestStore(store, { seasons: [season2025, season2026] });

    const seasonRepository = createMemorySeasonRepository(store);
    const result = await getCurrentSeason({ seasonRepository });

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Returns the first one found
      expect(result.value.year).toBe(2025);
    }
  });
});
