import { describe, test, expect, beforeEach } from "bun:test";
import { getDrivers } from "../../usecases/get-drivers.usecase";
import { createMemorySeasonRepository } from "../../repositories/memory/season.memory";
import { createMemoryDriverRepository } from "../../repositories/memory/driver.memory";
import { createTestStore, seedTestStore } from "../setup";
import {
  createSeason,
  createDriver,
  createDrivers,
  resetAllFixtureCounters,
} from "../fixtures";

describe("getDrivers", () => {
  beforeEach(() => {
    resetAllFixtureCounters();
  });

  test("returns drivers for the active season", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, year: 2026 });
    const drivers = createDrivers(5, { seasonId: 1 });

    seedTestStore(store, { seasons: [season], drivers });

    const seasonRepository = createMemorySeasonRepository(store);
    const driverRepository = createMemoryDriverRepository(store);

    const result = await getDrivers({ seasonRepository, driverRepository });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.drivers.length).toBe(5);
    }
  });

  test("returns NOT_FOUND when no active season exists", async () => {
    const store = createTestStore();
    const seasonRepository = createMemorySeasonRepository(store);
    const driverRepository = createMemoryDriverRepository(store);

    const result = await getDrivers({ seasonRepository, driverRepository });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  test("returns empty array when season has no drivers", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, year: 2026 });
    seedTestStore(store, { seasons: [season] });

    const seasonRepository = createMemorySeasonRepository(store);
    const driverRepository = createMemoryDriverRepository(store);

    const result = await getDrivers({ seasonRepository, driverRepository });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.drivers).toEqual([]);
    }
  });

  test("only returns drivers for the active season", async () => {
    const store = createTestStore();
    const season2025 = createSeason({ id: 1, year: 2025, isActive: false });
    const season2026 = createSeason({ id: 2, year: 2026, isActive: true });
    const drivers2025 = [
      createDriver({ id: 1, seasonId: 1, name: "Old Driver" }),
    ];
    const drivers2026 = [
      createDriver({ id: 2, seasonId: 2, name: "New Driver 1" }),
      createDriver({ id: 3, seasonId: 2, name: "New Driver 2" }),
    ];

    seedTestStore(store, {
      seasons: [season2025, season2026],
      drivers: [...drivers2025, ...drivers2026],
    });

    const seasonRepository = createMemorySeasonRepository(store);
    const driverRepository = createMemoryDriverRepository(store);

    const result = await getDrivers({ seasonRepository, driverRepository });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.drivers.length).toBe(2);
      expect(result.value.drivers.every((d) => d.season_id === 2)).toBe(true);
    }
  });

  test("drivers are sorted by team and number", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, year: 2026 });
    const drivers = [
      createDriver({ id: 1, seasonId: 1, team: "Mercedes", number: 63 }),
      createDriver({ id: 2, seasonId: 1, team: "Ferrari", number: 16 }),
      createDriver({ id: 3, seasonId: 1, team: "Ferrari", number: 1 }),
      createDriver({ id: 4, seasonId: 1, team: "Mercedes", number: 44 }),
    ];

    seedTestStore(store, { seasons: [season], drivers });

    const seasonRepository = createMemorySeasonRepository(store);
    const driverRepository = createMemoryDriverRepository(store);

    const result = await getDrivers({ seasonRepository, driverRepository });

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Ferrari first (alphabetically), then Mercedes
      // Within team, sorted by number
      expect(result.value.drivers[0].team).toBe("Ferrari");
      expect(result.value.drivers[0].number).toBe(1);
      expect(result.value.drivers[1].team).toBe("Ferrari");
      expect(result.value.drivers[1].number).toBe(16);
      expect(result.value.drivers[2].team).toBe("Mercedes");
      expect(result.value.drivers[2].number).toBe(44);
      expect(result.value.drivers[3].team).toBe("Mercedes");
      expect(result.value.drivers[3].number).toBe(63);
    }
  });
});
