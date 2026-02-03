import { describe, test, expect, beforeEach } from "bun:test";
import { submitRaceResultsManual } from "../../usecases/submit-race-results-manual.usecase";
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

describe("submitRaceResultsManual", () => {
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

  test("submits results and updates race status", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({ id: 1, seasonId: 1 });
    const drivers = [
      createDriver({ id: 1, seasonId: 1 }),
      createDriver({ id: 2, seasonId: 1 }),
    ];

    seedTestStore(store, { seasons: [season], races: [race], drivers });

    const result = await submitRaceResultsManual(createDeps(store), {
      raceId: 1,
      results: [
        { driver_id: 1, race_position: 1 },
        { driver_id: 2, race_position: 2 },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.results.length).toBe(2);
      expect(result.value.raceStatus).toBe("completed");

      // Check race status was updated
      expect(store.races[0].status).toBe("completed");
    }
  });

  test("calculates race points correctly (P1=25, P10=1)", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({ id: 1, seasonId: 1 });
    const drivers = [
      createDriver({ id: 1, seasonId: 1 }),
      createDriver({ id: 2, seasonId: 1 }),
    ];

    seedTestStore(store, { seasons: [season], races: [race], drivers });

    const result = await submitRaceResultsManual(createDeps(store), {
      raceId: 1,
      results: [
        { driver_id: 1, race_position: 1 },
        { driver_id: 2, race_position: 10 },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const p1 = result.value.results.find((r) => r.driver_id === 1);
      const p10 = result.value.results.find((r) => r.driver_id === 2);
      expect(p1?.race_points).toBe(25);
      expect(p10?.race_points).toBe(1);
    }
  });

  test("calculates sprint points correctly (P1=8, P8=1)", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({ id: 1, seasonId: 1, hasSprint: true });
    const drivers = [
      createDriver({ id: 1, seasonId: 1 }),
      createDriver({ id: 2, seasonId: 1 }),
    ];

    seedTestStore(store, { seasons: [season], races: [race], drivers });

    const result = await submitRaceResultsManual(createDeps(store), {
      raceId: 1,
      results: [
        { driver_id: 1, race_position: 1, sprint_position: 1 },
        { driver_id: 2, race_position: 10, sprint_position: 8 },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const p1 = result.value.results.find((r) => r.driver_id === 1);
      const p8 = result.value.results.find((r) => r.driver_id === 2);
      expect(p1?.sprint_points).toBe(8);
      expect(p8?.sprint_points).toBe(1);
    }
  });

  test("returns NOT_FOUND for nonexistent race", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    seedTestStore(store, { seasons: [season] });

    const result = await submitRaceResultsManual(createDeps(store), {
      raceId: 999,
      results: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  test("returns VALIDATION_ERROR for invalid race ID", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    seedTestStore(store, { seasons: [season] });

    const result = await submitRaceResultsManual(createDeps(store), {
      raceId: 0,
      results: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  test("returns VALIDATION_ERROR when no active season exists", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, isActive: false });
    const race = createRace({ id: 1, seasonId: 1 });
    seedTestStore(store, { seasons: [season], races: [race] });

    const result = await submitRaceResultsManual(createDeps(store), {
      raceId: 1,
      results: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  test("returns VALIDATION_ERROR for race not in active season", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({ id: 1, seasonId: 2 }); // Different season

    seedTestStore(store, { seasons: [season], races: [race] });

    const result = await submitRaceResultsManual(createDeps(store), {
      raceId: 1,
      results: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  test("returns VALIDATION_ERROR for invalid driver ID", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({ id: 1, seasonId: 1 });
    const driver = createDriver({ id: 1, seasonId: 1 });

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      drivers: [driver],
    });

    const result = await submitRaceResultsManual(createDeps(store), {
      raceId: 1,
      results: [{ driver_id: 999, race_position: 1 }],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  test("returns VALIDATION_ERROR when sprint results provided for non-sprint race", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({ id: 1, seasonId: 1, hasSprint: false });
    const driver = createDriver({ id: 1, seasonId: 1 });

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      drivers: [driver],
    });

    const result = await submitRaceResultsManual(createDeps(store), {
      raceId: 1,
      results: [{ driver_id: 1, race_position: 1, sprint_position: 1 }],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
    expect(store.raceResults.length).toBe(0);
  });

  test("updates user stats for all users with picks", async () => {
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
    // Alice picked driver 1, Bob picked driver 2
    const picks = [
      createPick({ userId: 1, raceId: 1, driverId: 1 }),
      createPick({ userId: 2, raceId: 1, driverId: 2 }),
    ];

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      drivers,
      users,
      picks,
    });

    await submitRaceResultsManual(createDeps(store), {
      raceId: 1,
      results: [
        { driver_id: 1, race_position: 1 }, // 25 points
        { driver_id: 2, race_position: 10 }, // 1 point
      ],
    });

    // Check user stats were created/updated
    expect(store.userSeasonStats.length).toBe(2);

    const aliceStats = store.userSeasonStats.find((s) => s.user_id === 1);
    const bobStats = store.userSeasonStats.find((s) => s.user_id === 2);

    expect(aliceStats?.total_points).toBe(25);
    expect(aliceStats?.races_completed).toBe(1);
    expect(bobStats?.total_points).toBe(1);
    expect(bobStats?.races_completed).toBe(1);
  });

  test("does not create user stats when no picks exist", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({ id: 1, seasonId: 1 });
    const driver = createDriver({ id: 1, seasonId: 1 });

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      drivers: [driver],
    });

    const result = await submitRaceResultsManual(createDeps(store), {
      raceId: 1,
      results: [{ driver_id: 1, race_position: 1 }],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.raceStatus).toBe("completed");
    }
    expect(store.userSeasonStats.length).toBe(0);
  });

  test("no points for race positions outside top 10 (P11+ = 0)", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({ id: 1, seasonId: 1 });
    const driver = createDriver({ id: 1, seasonId: 1 });

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      drivers: [driver],
    });

    const result = await submitRaceResultsManual(createDeps(store), {
      raceId: 1,
      results: [{ driver_id: 1, race_position: 11 }],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.results[0].race_points).toBe(0);
    }
  });

  test("no points for sprint positions outside top 8 (P9+ = 0)", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({ id: 1, seasonId: 1, hasSprint: true });
    const driver = createDriver({ id: 1, seasonId: 1 });

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      drivers: [driver],
    });

    const result = await submitRaceResultsManual(createDeps(store), {
      raceId: 1,
      results: [{ driver_id: 1, race_position: 1, sprint_position: 9 }],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.results[0].sprint_points).toBe(0);
      // Race points should still be awarded
      expect(result.value.results[0].race_points).toBe(25);
    }
  });

  test("handles null positions (DNF)", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({ id: 1, seasonId: 1 });
    const driver = createDriver({ id: 1, seasonId: 1 });

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      drivers: [driver],
    });

    const result = await submitRaceResultsManual(createDeps(store), {
      raceId: 1,
      results: [{ driver_id: 1, race_position: null }],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.results[0].race_position).toBeNull();
      expect(result.value.results[0].race_points).toBe(0);
    }
  });

  test("upserts results (updates existing)", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({ id: 1, seasonId: 1 });
    const driver = createDriver({ id: 1, seasonId: 1 });

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      drivers: [driver],
    });

    // First submission
    await submitRaceResultsManual(createDeps(store), {
      raceId: 1,
      results: [{ driver_id: 1, race_position: 5 }],
    });

    // Second submission with updated position
    const result = await submitRaceResultsManual(createDeps(store), {
      raceId: 1,
      results: [{ driver_id: 1, race_position: 1 }],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.results[0].race_position).toBe(1);
      expect(result.value.results[0].race_points).toBe(25);
    }

    // Should only have 1 result entry
    expect(store.raceResults.length).toBe(1);
  });
});
