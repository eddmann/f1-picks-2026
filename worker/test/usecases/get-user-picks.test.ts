import { describe, test, expect, beforeEach } from "bun:test";
import { getUserPicks } from "../../usecases/get-user-picks.usecase";
import { createMemorySeasonRepository } from "../../repositories/memory/season.memory";
import { createMemoryPickRepository } from "../../repositories/memory/pick.memory";
import { createMemoryRaceRepository } from "../../repositories/memory/race.memory";
import { createMemoryDriverRepository } from "../../repositories/memory/driver.memory";
import { createMemoryRaceResultRepository } from "../../repositories/memory/race-result.memory";
import { createTestStore, seedTestStore } from "../setup";
import {
  createSeason,
  createRace,
  createCompletedRace,
  createDriver,
  createUser,
  createPick,
  createRaceResult,
  resetAllFixtureCounters,
} from "../fixtures";

describe("getUserPicks", () => {
  beforeEach(() => {
    resetAllFixtureCounters();
  });

  function createDeps(store: ReturnType<typeof createTestStore>) {
    return {
      seasonRepository: createMemorySeasonRepository(store),
      pickRepository: createMemoryPickRepository(store),
      raceRepository: createMemoryRaceRepository(store),
      driverRepository: createMemoryDriverRepository(store),
      raceResultRepository: createMemoryRaceResultRepository(store),
    };
  }

  test("returns empty picks for user with no picks", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const user = createUser({ id: 1 });

    seedTestStore(store, { seasons: [season], users: [user] });

    const result = await getUserPicks(createDeps(store), { userId: 1 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.picks).toEqual([]);
    }
  });

  test("returns NOT_FOUND when no active season", async () => {
    const store = createTestStore();
    const user = createUser({ id: 1 });
    seedTestStore(store, { users: [user] });

    const result = await getUserPicks(createDeps(store), { userId: 1 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  test("returns picks enriched with driver and race info", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const user = createUser({ id: 1 });
    const race = createRace({
      id: 1,
      seasonId: 1,
      round: 1,
      name: "Bahrain GP",
    });
    const driver = createDriver({ id: 1, seasonId: 1, name: "Max Verstappen" });
    const pick = createPick({ userId: 1, raceId: 1, driverId: 1 });

    seedTestStore(store, {
      seasons: [season],
      users: [user],
      races: [race],
      drivers: [driver],
      picks: [pick],
    });

    const result = await getUserPicks(createDeps(store), { userId: 1 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.picks.length).toBe(1);
      expect(result.value.picks[0].driver?.name).toBe("Max Verstappen");
      expect(result.value.picks[0].race?.name).toBe("Bahrain GP");
    }
  });

  test("returns null driver when driver lookup fails", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const user = createUser({ id: 1 });
    const race = createRace({ id: 1, seasonId: 1, round: 1 });
    const pick = createPick({ userId: 1, raceId: 1, driverId: 99 });

    seedTestStore(store, {
      seasons: [season],
      users: [user],
      races: [race],
      picks: [pick],
    });

    const result = await getUserPicks(createDeps(store), { userId: 1 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.picks.length).toBe(1);
      expect(result.value.picks[0].driver).toBeNull();
      expect(result.value.picks[0].race?.id).toBe(1);
    }
  });

  test("includes points for completed races", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const user = createUser({ id: 1 });
    const race = createCompletedRace({ id: 1, seasonId: 1, round: 1 });
    const driver = createDriver({ id: 1, seasonId: 1 });
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
      users: [user],
      races: [race],
      drivers: [driver],
      picks: [pick],
      raceResults: [raceResult],
    });

    const result = await getUserPicks(createDeps(store), { userId: 1 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.picks[0].points).toBe(25);
    }
  });

  test("points undefined for races without results", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const user = createUser({ id: 1 });
    const race = createRace({
      id: 1,
      seasonId: 1,
      round: 1,
      status: "upcoming",
    });
    const driver = createDriver({ id: 1, seasonId: 1 });
    const pick = createPick({ userId: 1, raceId: 1, driverId: 1 });

    seedTestStore(store, {
      seasons: [season],
      users: [user],
      races: [race],
      drivers: [driver],
      picks: [pick],
    });

    const result = await getUserPicks(createDeps(store), { userId: 1 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.picks[0].points).toBeUndefined();
    }
  });

  test("includes both race and sprint points", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const user = createUser({ id: 1 });
    const race = createCompletedRace({ id: 1, seasonId: 1, hasSprint: true });
    const driver = createDriver({ id: 1, seasonId: 1 });
    const pick = createPick({ userId: 1, raceId: 1, driverId: 1 });
    // P1 race (25) + P1 sprint (8) = 33
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
      users: [user],
      races: [race],
      drivers: [driver],
      picks: [pick],
      raceResults: [raceResult],
    });

    const result = await getUserPicks(createDeps(store), { userId: 1 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.picks[0].points).toBe(33);
    }
  });

  test("returns multiple picks sorted by round", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const user = createUser({ id: 1 });
    const races = [
      createRace({ id: 3, seasonId: 1, round: 3 }),
      createRace({ id: 1, seasonId: 1, round: 1 }),
      createRace({ id: 2, seasonId: 1, round: 2 }),
    ];
    const drivers = [
      createDriver({ id: 1, seasonId: 1 }),
      createDriver({ id: 2, seasonId: 1 }),
      createDriver({ id: 3, seasonId: 1 }),
    ];
    const picks = [
      createPick({ userId: 1, raceId: 3, driverId: 3 }),
      createPick({ userId: 1, raceId: 1, driverId: 1 }),
      createPick({ userId: 1, raceId: 2, driverId: 2 }),
    ];

    seedTestStore(store, {
      seasons: [season],
      users: [user],
      races,
      drivers,
      picks,
    });

    const result = await getUserPicks(createDeps(store), { userId: 1 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.picks.length).toBe(3);
      expect(result.value.picks[0].race?.round).toBe(1);
      expect(result.value.picks[1].race?.round).toBe(2);
      expect(result.value.picks[2].race?.round).toBe(3);
    }
  });

  test("only returns picks for active season", async () => {
    const store = createTestStore();
    const season2025 = createSeason({ id: 1, year: 2025, isActive: false });
    const season2026 = createSeason({ id: 2, year: 2026, isActive: true });
    const user = createUser({ id: 1 });
    const race2025 = createRace({ id: 1, seasonId: 1, round: 1 });
    const race2026 = createRace({ id: 2, seasonId: 2, round: 1 });
    const drivers = [
      createDriver({ id: 1, seasonId: 1 }),
      createDriver({ id: 2, seasonId: 2 }),
    ];
    const picks = [
      createPick({ userId: 1, raceId: 1, driverId: 1 }),
      createPick({ userId: 1, raceId: 2, driverId: 2 }),
    ];

    seedTestStore(store, {
      seasons: [season2025, season2026],
      users: [user],
      races: [race2025, race2026],
      drivers,
      picks,
    });

    const result = await getUserPicks(createDeps(store), { userId: 1 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.picks.length).toBe(1);
      expect(result.value.picks[0].race_id).toBe(2);
    }
  });
});
