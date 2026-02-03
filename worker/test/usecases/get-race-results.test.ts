import { describe, test, expect, beforeEach } from "bun:test";
import { getRaceResults } from "../../usecases/get-race-results.usecase";
import { createMemoryRaceRepository } from "../../repositories/memory/race.memory";
import { createMemoryRaceResultRepository } from "../../repositories/memory/race-result.memory";
import { createMemoryDriverRepository } from "../../repositories/memory/driver.memory";
import { createMemoryPickRepository } from "../../repositories/memory/pick.memory";
import { createTestStore, seedTestStore } from "../setup";
import {
  createSeason,
  createRace,
  createDriver,
  createUser,
  createPick,
  createRaceResult,
  resetAllFixtureCounters,
} from "../fixtures";

describe("getRaceResults", () => {
  beforeEach(() => {
    resetAllFixtureCounters();
  });

  test("returns race with empty results and picks", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({ id: 1, seasonId: 1 });

    seedTestStore(store, { seasons: [season], races: [race] });

    const deps = {
      raceRepository: createMemoryRaceRepository(store),
      raceResultRepository: createMemoryRaceResultRepository(store),
      driverRepository: createMemoryDriverRepository(store),
      pickRepository: createMemoryPickRepository(store),
    };

    const result = await getRaceResults(deps, { raceId: 1 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.race.id).toBe(1);
      expect(result.value.results).toEqual([]);
      expect(result.value.picks).toEqual([]);
    }
  });

  test("returns enriched results with driver info", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({ id: 1, seasonId: 1 });
    const drivers = [
      createDriver({ id: 1, seasonId: 1, name: "Max Verstappen" }),
      createDriver({ id: 2, seasonId: 1, name: "Lewis Hamilton" }),
    ];
    const results = [
      createRaceResult({ raceId: 1, driverId: 1, racePosition: 1 }),
      createRaceResult({ raceId: 1, driverId: 2, racePosition: 2 }),
    ];

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      drivers,
      raceResults: results,
    });

    const deps = {
      raceRepository: createMemoryRaceRepository(store),
      raceResultRepository: createMemoryRaceResultRepository(store),
      driverRepository: createMemoryDriverRepository(store),
      pickRepository: createMemoryPickRepository(store),
    };

    const result = await getRaceResults(deps, { raceId: 1 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.results.length).toBe(2);
      expect(result.value.results[0].driver?.name).toBe("Max Verstappen");
      expect(result.value.results[0].race_position).toBe(1);
      expect(result.value.results[1].driver?.name).toBe("Lewis Hamilton");
      expect(result.value.results[1].race_position).toBe(2);
    }
  });

  test("returns enriched picks with driver info and points", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({ id: 1, seasonId: 1 });
    const driver = createDriver({ id: 1, seasonId: 1, name: "Max Verstappen" });
    const user = createUser({ id: 1, name: "Alice" });
    const pick = createPick({ userId: 1, raceId: 1, driverId: 1 });
    // P1 = 25 points
    const raceResult = createRaceResult({
      raceId: 1,
      driverId: 1,
      racePosition: 1,
      racePoints: 25,
    });

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      drivers: [driver],
      users: [user],
      picks: [pick],
      raceResults: [raceResult],
    });

    const deps = {
      raceRepository: createMemoryRaceRepository(store),
      raceResultRepository: createMemoryRaceResultRepository(store),
      driverRepository: createMemoryDriverRepository(store),
      pickRepository: createMemoryPickRepository(store),
    };

    const result = await getRaceResults(deps, { raceId: 1 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.picks.length).toBe(1);
      expect(result.value.picks[0].user_name).toBe("Alice");
      expect(result.value.picks[0].driver?.name).toBe("Max Verstappen");
      expect(result.value.picks[0].points).toBe(25);
    }
  });

  test("picks without results get 0 points", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({ id: 1, seasonId: 1 });
    const driver = createDriver({ id: 1, seasonId: 1, name: "Max Verstappen" });
    const user = createUser({ id: 1, name: "Alice" });
    const pick = createPick({ userId: 1, raceId: 1, driverId: 1 });
    // No race result for this driver

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      drivers: [driver],
      users: [user],
      picks: [pick],
    });

    const deps = {
      raceRepository: createMemoryRaceRepository(store),
      raceResultRepository: createMemoryRaceResultRepository(store),
      driverRepository: createMemoryDriverRepository(store),
      pickRepository: createMemoryPickRepository(store),
    };

    const result = await getRaceResults(deps, { raceId: 1 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.picks[0].points).toBe(0);
    }
  });

  test("includes both race and sprint points", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({ id: 1, seasonId: 1, hasSprint: true });
    const driver = createDriver({ id: 1, seasonId: 1 });
    const user = createUser({ id: 1 });
    const pick = createPick({ userId: 1, raceId: 1, driverId: 1 });
    // P1 race (25pts) + P1 sprint (8pts) = 33pts
    const raceResult = createRaceResult({
      raceId: 1,
      driverId: 1,
      racePosition: 1,
      sprintPosition: 1,
      racePoints: 25,
      sprintPoints: 8,
    });

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      drivers: [driver],
      users: [user],
      picks: [pick],
      raceResults: [raceResult],
    });

    const deps = {
      raceRepository: createMemoryRaceRepository(store),
      raceResultRepository: createMemoryRaceResultRepository(store),
      driverRepository: createMemoryDriverRepository(store),
      pickRepository: createMemoryPickRepository(store),
    };

    const result = await getRaceResults(deps, { raceId: 1 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.picks[0].points).toBe(33);
    }
  });

  test("returns NOT_FOUND for nonexistent race", async () => {
    const store = createTestStore();

    const deps = {
      raceRepository: createMemoryRaceRepository(store),
      raceResultRepository: createMemoryRaceResultRepository(store),
      driverRepository: createMemoryDriverRepository(store),
      pickRepository: createMemoryPickRepository(store),
    };

    const result = await getRaceResults(deps, { raceId: 999 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  test("returns VALIDATION_ERROR for invalid race ID", async () => {
    const store = createTestStore();

    const deps = {
      raceRepository: createMemoryRaceRepository(store),
      raceResultRepository: createMemoryRaceResultRepository(store),
      driverRepository: createMemoryDriverRepository(store),
      pickRepository: createMemoryPickRepository(store),
    };

    const result = await getRaceResults(deps, { raceId: 0 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  test("returns null driver when driver lookup fails", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({ id: 1, seasonId: 1 });
    const results = [
      createRaceResult({
        raceId: 1,
        driverId: 99,
        racePosition: 1,
        racePoints: 25,
      }),
    ];

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      raceResults: results,
    });

    const deps = {
      raceRepository: createMemoryRaceRepository(store),
      raceResultRepository: createMemoryRaceResultRepository(store),
      driverRepository: createMemoryDriverRepository(store),
      pickRepository: createMemoryPickRepository(store),
    };

    const result = await getRaceResults(deps, { raceId: 1 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.results.length).toBe(1);
      expect(result.value.results[0].driver).toBeNull();
    }
  });

  test("returns null driver for pick when driver lookup fails", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({ id: 1, seasonId: 1 });
    const user = createUser({ id: 1, name: "Alice" });
    const pick = createPick({ userId: 1, raceId: 1, driverId: 99 });
    const raceResult = createRaceResult({
      raceId: 1,
      driverId: 99,
      racePosition: 1,
      racePoints: 25,
    });

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      users: [user],
      picks: [pick],
      raceResults: [raceResult],
    });

    const deps = {
      raceRepository: createMemoryRaceRepository(store),
      raceResultRepository: createMemoryRaceResultRepository(store),
      driverRepository: createMemoryDriverRepository(store),
      pickRepository: createMemoryPickRepository(store),
    };

    const result = await getRaceResults(deps, { raceId: 1 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.picks.length).toBe(1);
      expect(result.value.picks[0].user_name).toBe("Alice");
      expect(result.value.picks[0].driver).toBeNull();
      expect(result.value.picks[0].points).toBe(25);
    }
  });

  test("multiple users with picks for same race", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({ id: 1, seasonId: 1 });
    const drivers = [
      createDriver({ id: 1, seasonId: 1 }),
      createDriver({ id: 2, seasonId: 1 }),
    ];
    const users = [
      createUser({ id: 1, name: "Alice" }),
      createUser({ id: 2, name: "Bob" }),
    ];
    const picks = [
      createPick({ userId: 1, raceId: 1, driverId: 1 }),
      createPick({ userId: 2, raceId: 1, driverId: 2 }),
    ];
    const results = [
      createRaceResult({
        raceId: 1,
        driverId: 1,
        racePosition: 1,
        racePoints: 25,
      }),
      createRaceResult({
        raceId: 1,
        driverId: 2,
        racePosition: 10,
        racePoints: 1,
      }),
    ];

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      drivers,
      users,
      picks,
      raceResults: results,
    });

    const deps = {
      raceRepository: createMemoryRaceRepository(store),
      raceResultRepository: createMemoryRaceResultRepository(store),
      driverRepository: createMemoryDriverRepository(store),
      pickRepository: createMemoryPickRepository(store),
    };

    const result = await getRaceResults(deps, { raceId: 1 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.picks.length).toBe(2);
      const alicePick = result.value.picks.find((p) => p.user_name === "Alice");
      const bobPick = result.value.picks.find((p) => p.user_name === "Bob");
      expect(alicePick?.points).toBe(25);
      expect(bobPick?.points).toBe(1);
    }
  });
});
