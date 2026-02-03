import { describe, test, expect, beforeEach } from "bun:test";
import { syncRaceResults } from "../../usecases/sync-race-results.usecase";
import { createMemorySeasonRepository } from "../../repositories/memory/season.memory";
import { createMemoryRaceRepository } from "../../repositories/memory/race.memory";
import { createMemoryDriverRepository } from "../../repositories/memory/driver.memory";
import { createMemoryRaceResultRepository } from "../../repositories/memory/race-result.memory";
import { createMemoryPickRepository } from "../../repositories/memory/pick.memory";
import { createMemoryUserStatsRepository } from "../../repositories/memory/user-stats.memory";
import { createTestStore, seedTestStore } from "../setup";
import {
  createSeason,
  createRace,
  createDriver,
  createUser,
  createPick,
  resetAllFixtureCounters,
} from "../fixtures";

describe("syncRaceResults", () => {
  beforeEach(() => {
    resetAllFixtureCounters();
  });

  function createDeps(store: ReturnType<typeof createTestStore>) {
    return {
      seasonRepository: createMemorySeasonRepository(store),
      raceRepository: createMemoryRaceRepository(store),
      driverRepository: createMemoryDriverRepository(store),
      raceResultRepository: createMemoryRaceResultRepository(store),
      pickRepository: createMemoryPickRepository(store),
      userStatsRepository: createMemoryUserStatsRepository(store),
    };
  }

  test("syncs results 5 hours after race start and updates stats", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, isActive: true });
    const race = createRace({
      id: 1,
      seasonId: 1,
      status: "upcoming",
      qualiTime: "2026-03-07T15:00:00Z",
      raceTime: "2026-03-08T14:00:00Z",
      isWildCard: false,
    });
    const drivers = [
      createDriver({ id: 1, seasonId: 1, number: 1 }),
      createDriver({ id: 2, seasonId: 1, number: 11 }),
    ];
    const user = createUser({ id: 1 });
    const pick = createPick({
      id: 1,
      userId: user.id,
      raceId: race.id,
      driverId: 1,
    });

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      drivers,
      users: [user],
      picks: [pick],
    });

    const now = new Date("2026-03-08T20:00:00Z"); // 6 hours after race start
    const f1ResultsFetcher = {
      async fetchResults() {
        return {
          ok: true as const,
          results: [
            { driver_number: 1, race_position: 1, sprint_position: null },
            { driver_number: 11, race_position: 2, sprint_position: null },
          ],
        };
      },
    };

    const result = await syncRaceResults({
      ...createDeps(store),
      f1ResultsFetcher,
      clock: { now: () => now },
    });

    expect(result.started).toBe(1);
    expect(result.synced).toEqual([race.id]);
    expect(result.failed.length).toBe(0);
    expect(store.races[0].status).toBe("completed");
    expect(store.raceResults.length).toBe(2);
    expect(store.userSeasonStats.length).toBe(1);
    expect(store.userSeasonStats[0].total_points).toBe(25);
  });

  test("does not sync before 5 hours after race start", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, isActive: true });
    const race = createRace({
      id: 1,
      seasonId: 1,
      status: "upcoming",
      qualiTime: "2026-03-07T15:00:00Z",
      raceTime: "2026-03-08T14:00:00Z",
    });
    const drivers = [createDriver({ id: 1, seasonId: 1, number: 1 })];

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      drivers,
    });

    const now = new Date("2026-03-08T18:00:00Z"); // 4 hours after race start
    let calls = 0;
    const f1ResultsFetcher = {
      async fetchResults() {
        calls += 1;
        return { ok: true as const, results: [] };
      },
    };

    const result = await syncRaceResults({
      ...createDeps(store),
      f1ResultsFetcher,
      clock: { now: () => now },
    });

    expect(result.started).toBe(1);
    expect(result.synced.length).toBe(0);
    expect(result.failed.length).toBe(0);
    expect(calls).toBe(0);
    expect(store.races[0].status).toBe("in_progress");
  });

  test("skips races already completed", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, isActive: true });
    const race = createRace({
      id: 1,
      seasonId: 1,
      status: "completed",
      raceTime: "2026-03-08T14:00:00Z",
    });

    seedTestStore(store, {
      seasons: [season],
      races: [race],
    });

    let calls = 0;
    const f1ResultsFetcher = {
      async fetchResults() {
        calls += 1;
        return { ok: true as const, results: [] };
      },
    };

    const result = await syncRaceResults({
      ...createDeps(store),
      f1ResultsFetcher,
      clock: { now: () => new Date("2026-03-08T20:00:00Z") },
    });

    expect(result.started).toBe(0);
    expect(result.synced.length).toBe(0);
    expect(result.failed.length).toBe(0);
    expect(calls).toBe(0);
    expect(store.races[0].status).toBe("completed");
  });

  test("records failure when fetcher returns ok: false", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, isActive: true });
    const race = createRace({
      id: 1,
      seasonId: 1,
      status: "upcoming",
      raceTime: "2026-03-08T14:00:00Z",
    });

    seedTestStore(store, {
      seasons: [season],
      races: [race],
    });

    const f1ResultsFetcher = {
      async fetchResults() {
        return { ok: false as const, message: "No data yet" };
      },
    };

    const result = await syncRaceResults({
      ...createDeps(store),
      f1ResultsFetcher,
      clock: { now: () => new Date("2026-03-08T20:00:00Z") },
    });

    expect(result.synced.length).toBe(0);
    expect(result.failed).toEqual([race.id]);
    expect(store.raceResults.length).toBe(0);
    expect(store.races[0].status).not.toBe("completed");
  });

  test("fails when unknown driver numbers are returned", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, isActive: true });
    const race = createRace({
      id: 1,
      seasonId: 1,
      status: "upcoming",
      raceTime: "2026-03-08T14:00:00Z",
    });
    const drivers = [createDriver({ id: 1, seasonId: 1, number: 1 })];

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      drivers,
    });

    const f1ResultsFetcher = {
      async fetchResults() {
        return {
          ok: true as const,
          results: [
            { driver_number: 1, race_position: 1, sprint_position: null },
            { driver_number: 99, race_position: 2, sprint_position: null },
          ],
        };
      },
    };

    const result = await syncRaceResults({
      ...createDeps(store),
      f1ResultsFetcher,
      clock: { now: () => new Date("2026-03-08T20:00:00Z") },
    });

    expect(result.synced.length).toBe(0);
    expect(result.failed).toEqual([race.id]);
    expect(store.raceResults.length).toBe(0);
  });

  test("applies sprint points when sprint results are present", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, isActive: true });
    const race = createRace({
      id: 1,
      seasonId: 1,
      status: "upcoming",
      hasSprint: true,
      raceTime: "2026-03-08T14:00:00Z",
    });
    const drivers = [createDriver({ id: 1, seasonId: 1, number: 1 })];
    const user = createUser({ id: 1 });
    const pick = createPick({
      id: 1,
      userId: user.id,
      raceId: race.id,
      driverId: 1,
    });

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      drivers,
      users: [user],
      picks: [pick],
    });

    const f1ResultsFetcher = {
      async fetchResults() {
        return {
          ok: true as const,
          results: [{ driver_number: 1, race_position: 1, sprint_position: 1 }],
        };
      },
    };

    const result = await syncRaceResults({
      ...createDeps(store),
      f1ResultsFetcher,
      clock: { now: () => new Date("2026-03-08T20:00:00Z") },
    });

    expect(result.synced).toEqual([race.id]);
    expect(store.raceResults[0].race_points).toBe(25);
    expect(store.raceResults[0].sprint_points).toBe(8);
    expect(store.userSeasonStats[0].total_points).toBe(33);
  });

  test("fails when sprint results are provided for non-sprint race", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, isActive: true });
    const race = createRace({
      id: 1,
      seasonId: 1,
      status: "upcoming",
      hasSprint: false,
      raceTime: "2026-03-08T14:00:00Z",
    });
    const drivers = [createDriver({ id: 1, seasonId: 1, number: 1 })];

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      drivers,
    });

    const f1ResultsFetcher = {
      async fetchResults() {
        return {
          ok: true as const,
          results: [{ driver_number: 1, race_position: 1, sprint_position: 1 }],
        };
      },
    };

    const result = await syncRaceResults({
      ...createDeps(store),
      f1ResultsFetcher,
      clock: { now: () => new Date("2026-03-08T20:00:00Z") },
    });

    expect(result.synced.length).toBe(0);
    expect(result.failed).toEqual([race.id]);
    expect(store.raceResults.length).toBe(0);
    expect(store.races[0].status).not.toBe("completed");
  });
});
