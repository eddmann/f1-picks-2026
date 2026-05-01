import { describe, test, expect, beforeEach } from "bun:test";
import { cancelRace } from "../../usecases/cancel-race.usecase";
import { createMemorySeasonRepository } from "../../repositories/memory/season.memory";
import { createMemoryRaceRepository } from "../../repositories/memory/race.memory";
import { createMemoryRaceResultRepository } from "../../repositories/memory/race-result.memory";
import { createMemoryPickRepository } from "../../repositories/memory/pick.memory";
import { createMemoryUserStatsRepository } from "../../repositories/memory/user-stats.memory";
import { createTestStore, seedTestStore } from "../setup";
import {
  createSeason,
  createRace,
  createUser,
  createDriver,
  createPick,
  createRaceResult,
  createUserSeasonStats,
  resetAllFixtureCounters,
} from "../fixtures";

describe("cancelRace", () => {
  beforeEach(() => {
    resetAllFixtureCounters();
  });

  function createDeps(store: ReturnType<typeof createTestStore>) {
    return {
      seasonRepository: createMemorySeasonRepository(store),
      raceRepository: createMemoryRaceRepository(store),
      raceResultRepository: createMemoryRaceResultRepository(store),
      pickRepository: createMemoryPickRepository(store),
      userStatsRepository: createMemoryUserStatsRepository(store),
    };
  }

  test("marks race as cancelled, removes results, and recalculates affected stats", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const user = createUser({ id: 1 });
    const driver = createDriver({ id: 1, seasonId: 1 });
    const race = createRace({ id: 1, seasonId: 1, status: "completed" });
    const pick = createPick({ userId: 1, raceId: 1, driverId: 1 });
    const result = createRaceResult({
      raceId: 1,
      driverId: 1,
      racePosition: 1,
    });
    const stats = createUserSeasonStats({
      userId: 1,
      seasonId: 1,
      totalPoints: 25,
      racesCompleted: 1,
    });

    seedTestStore(store, {
      seasons: [season],
      users: [user],
      drivers: [driver],
      races: [race],
      picks: [pick],
      raceResults: [result],
      userSeasonStats: [stats],
    });

    const cancelResult = await cancelRace(createDeps(store), { raceId: 1 });

    expect(cancelResult.ok).toBe(true);
    expect(store.races[0].status).toBe("cancelled");
    expect(store.raceResults).toEqual([]);
    expect(store.userSeasonStats[0].total_points).toBe(0);
    expect(store.userSeasonStats[0].races_completed).toBe(0);
  });

  test("returns validation error when race is outside active season", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({ id: 1, seasonId: 2 });

    seedTestStore(store, { seasons: [season], races: [race] });

    const result = await cancelRace(createDeps(store), { raceId: 1 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });
});
