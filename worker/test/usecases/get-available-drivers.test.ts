import { describe, test, expect, beforeEach } from "bun:test";
import { getAvailableDrivers } from "../../usecases/get-available-drivers.usecase";
import { createMemorySeasonRepository } from "../../repositories/memory/season.memory";
import { createMemoryDriverRepository } from "../../repositories/memory/driver.memory";
import { createMemoryPickRepository } from "../../repositories/memory/pick.memory";
import { createTestStore, seedTestStore } from "../setup";
import {
  createSeason,
  createUser,
  createDriver,
  createRace,
  createWildCardRace,
  createPick,
  resetAllFixtureCounters,
} from "../fixtures";

describe("getAvailableDrivers", () => {
  beforeEach(() => {
    resetAllFixtureCounters();
  });

  test("returns all drivers as available when user has no picks", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, year: 2026 });
    const user = createUser({ id: 1 });
    const drivers = [
      createDriver({ id: 1, seasonId: 1 }),
      createDriver({ id: 2, seasonId: 1 }),
      createDriver({ id: 3, seasonId: 1 }),
    ];

    seedTestStore(store, { seasons: [season], users: [user], drivers });

    const seasonRepository = createMemorySeasonRepository(store);
    const driverRepository = createMemoryDriverRepository(store);
    const pickRepository = createMemoryPickRepository(store);

    const result = await getAvailableDrivers(
      { seasonRepository, driverRepository, pickRepository },
      { userId: 1 },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.drivers.length).toBe(3);
      expect(result.value.drivers.every((d) => d.is_available)).toBe(true);
      expect(result.value.used_driver_ids).toEqual([]);
    }
  });

  test("marks drivers as unavailable when picked in non-wild-card race", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, year: 2026 });
    const user = createUser({ id: 1 });
    const drivers = [
      createDriver({ id: 1, seasonId: 1 }),
      createDriver({ id: 2, seasonId: 1 }),
      createDriver({ id: 3, seasonId: 1 }),
    ];
    const race = createRace({ id: 1, seasonId: 1, round: 1 });
    const pick = createPick({ userId: 1, raceId: 1, driverId: 2 });

    seedTestStore(store, {
      seasons: [season],
      users: [user],
      drivers,
      races: [race],
      picks: [pick],
    });

    const seasonRepository = createMemorySeasonRepository(store);
    const driverRepository = createMemoryDriverRepository(store);
    const pickRepository = createMemoryPickRepository(store);

    const result = await getAvailableDrivers(
      { seasonRepository, driverRepository, pickRepository },
      { userId: 1 },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const driver1 = result.value.drivers.find((d) => d.id === 1);
      const driver2 = result.value.drivers.find((d) => d.id === 2);
      const driver3 = result.value.drivers.find((d) => d.id === 3);

      expect(driver1?.is_available).toBe(true);
      expect(driver2?.is_available).toBe(false);
      expect(driver3?.is_available).toBe(true);
      expect(result.value.used_driver_ids).toEqual([2]);
    }
  });

  test("drivers picked in wild-card races remain available", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, year: 2026 });
    const user = createUser({ id: 1 });
    const drivers = [
      createDriver({ id: 1, seasonId: 1 }),
      createDriver({ id: 2, seasonId: 1 }),
    ];
    const wildCardRace = createWildCardRace({ id: 1, seasonId: 1, round: 23 });
    const pick = createPick({ userId: 1, raceId: 1, driverId: 1 });

    seedTestStore(store, {
      seasons: [season],
      users: [user],
      drivers,
      races: [wildCardRace],
      picks: [pick],
    });

    const seasonRepository = createMemorySeasonRepository(store);
    const driverRepository = createMemoryDriverRepository(store);
    const pickRepository = createMemoryPickRepository(store);

    const result = await getAvailableDrivers(
      { seasonRepository, driverRepository, pickRepository },
      { userId: 1 },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Driver 1 was picked in a wild-card race, so still available
      expect(result.value.drivers.every((d) => d.is_available)).toBe(true);
      expect(result.value.used_driver_ids).toEqual([]);
    }
  });

  test("returns NOT_FOUND when no active season", async () => {
    const store = createTestStore();
    const user = createUser({ id: 1 });
    seedTestStore(store, { users: [user] });

    const seasonRepository = createMemorySeasonRepository(store);
    const driverRepository = createMemoryDriverRepository(store);
    const pickRepository = createMemoryPickRepository(store);

    const result = await getAvailableDrivers(
      { seasonRepository, driverRepository, pickRepository },
      { userId: 1 },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  test("different users have independent availability", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, year: 2026 });
    const user1 = createUser({ id: 1, name: "Alice" });
    const user2 = createUser({ id: 2, name: "Bob" });
    const drivers = [
      createDriver({ id: 1, seasonId: 1 }),
      createDriver({ id: 2, seasonId: 1 }),
    ];
    const race = createRace({ id: 1, seasonId: 1, round: 1 });
    // User 1 picked driver 1, User 2 picked driver 2
    const pick1 = createPick({ userId: 1, raceId: 1, driverId: 1 });
    const pick2 = createPick({ userId: 2, raceId: 1, driverId: 2 });

    seedTestStore(store, {
      seasons: [season],
      users: [user1, user2],
      drivers,
      races: [race],
      picks: [pick1, pick2],
    });

    const seasonRepository = createMemorySeasonRepository(store);
    const driverRepository = createMemoryDriverRepository(store);
    const pickRepository = createMemoryPickRepository(store);

    // Check user 1's availability
    const result1 = await getAvailableDrivers(
      { seasonRepository, driverRepository, pickRepository },
      { userId: 1 },
    );

    expect(result1.ok).toBe(true);
    if (result1.ok) {
      expect(result1.value.used_driver_ids).toEqual([1]);
      expect(result1.value.drivers.find((d) => d.id === 1)?.is_available).toBe(
        false,
      );
      expect(result1.value.drivers.find((d) => d.id === 2)?.is_available).toBe(
        true,
      );
    }

    // Check user 2's availability
    const result2 = await getAvailableDrivers(
      { seasonRepository, driverRepository, pickRepository },
      { userId: 2 },
    );

    expect(result2.ok).toBe(true);
    if (result2.ok) {
      expect(result2.value.used_driver_ids).toEqual([2]);
      expect(result2.value.drivers.find((d) => d.id === 1)?.is_available).toBe(
        true,
      );
      expect(result2.value.drivers.find((d) => d.id === 2)?.is_available).toBe(
        false,
      );
    }
  });

  test("multiple picks accumulate unavailable drivers", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, year: 2026 });
    const user = createUser({ id: 1 });
    const drivers = [
      createDriver({ id: 1, seasonId: 1 }),
      createDriver({ id: 2, seasonId: 1 }),
      createDriver({ id: 3, seasonId: 1 }),
    ];
    const race1 = createRace({ id: 1, seasonId: 1, round: 1 });
    const race2 = createRace({ id: 2, seasonId: 1, round: 2 });
    const pick1 = createPick({ userId: 1, raceId: 1, driverId: 1 });
    const pick2 = createPick({ userId: 1, raceId: 2, driverId: 2 });

    seedTestStore(store, {
      seasons: [season],
      users: [user],
      drivers,
      races: [race1, race2],
      picks: [pick1, pick2],
    });

    const seasonRepository = createMemorySeasonRepository(store);
    const driverRepository = createMemoryDriverRepository(store);
    const pickRepository = createMemoryPickRepository(store);

    const result = await getAvailableDrivers(
      { seasonRepository, driverRepository, pickRepository },
      { userId: 1 },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.used_driver_ids.sort()).toEqual([1, 2]);
      expect(result.value.drivers.find((d) => d.id === 1)?.is_available).toBe(
        false,
      );
      expect(result.value.drivers.find((d) => d.id === 2)?.is_available).toBe(
        false,
      );
      expect(result.value.drivers.find((d) => d.id === 3)?.is_available).toBe(
        true,
      );
    }
  });
});
