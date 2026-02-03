import { describe, test, expect, beforeEach } from "bun:test";
import { getLeaderboard } from "../../usecases/get-leaderboard.usecase";
import { createMemorySeasonRepository } from "../../repositories/memory/season.memory";
import { createMemoryUserStatsRepository } from "../../repositories/memory/user-stats.memory";
import { createTestStore, seedTestStore } from "../setup";
import {
  createSeason,
  createUser,
  createUserSeasonStats,
  resetAllFixtureCounters,
} from "../fixtures";

describe("getLeaderboard", () => {
  beforeEach(() => {
    resetAllFixtureCounters();
  });

  test("returns empty standings when no users have stats", async () => {
    const store = createTestStore();
    const season = createSeason({ year: 2026 });
    seedTestStore(store, { seasons: [season] });

    const seasonRepository = createMemorySeasonRepository(store);
    const userStatsRepository = createMemoryUserStatsRepository(store);

    const result = await getLeaderboard({
      seasonRepository,
      userStatsRepository,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.season.year).toBe(2026);
      expect(result.value.standings).toEqual([]);
    }
  });

  test("returns NOT_FOUND when no active season exists", async () => {
    const store = createTestStore();
    const seasonRepository = createMemorySeasonRepository(store);
    const userStatsRepository = createMemoryUserStatsRepository(store);

    const result = await getLeaderboard({
      seasonRepository,
      userStatsRepository,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
      expect(result.error.entity).toBe("Season");
    }
  });

  test("returns standings sorted by points descending", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, year: 2026 });
    const user1 = createUser({ id: 1, name: "Alice" });
    const user2 = createUser({ id: 2, name: "Bob" });
    const user3 = createUser({ id: 3, name: "Charlie" });

    // Bob has most points, then Charlie, then Alice
    const stats1 = createUserSeasonStats({
      userId: 1,
      seasonId: 1,
      totalPoints: 10,
      racesCompleted: 2,
    });
    const stats2 = createUserSeasonStats({
      userId: 2,
      seasonId: 1,
      totalPoints: 50,
      racesCompleted: 3,
    });
    const stats3 = createUserSeasonStats({
      userId: 3,
      seasonId: 1,
      totalPoints: 25,
      racesCompleted: 2,
    });

    seedTestStore(store, {
      seasons: [season],
      users: [user1, user2, user3],
      userSeasonStats: [stats1, stats2, stats3],
    });

    const seasonRepository = createMemorySeasonRepository(store);
    const userStatsRepository = createMemoryUserStatsRepository(store);

    const result = await getLeaderboard({
      seasonRepository,
      userStatsRepository,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.standings.length).toBe(3);
      expect(result.value.standings[0].user_name).toBe("Bob");
      expect(result.value.standings[0].total_points).toBe(50);
      expect(result.value.standings[0].rank).toBe(1);

      expect(result.value.standings[1].user_name).toBe("Charlie");
      expect(result.value.standings[1].total_points).toBe(25);
      expect(result.value.standings[1].rank).toBe(2);

      expect(result.value.standings[2].user_name).toBe("Alice");
      expect(result.value.standings[2].total_points).toBe(10);
      expect(result.value.standings[2].rank).toBe(3);
    }
  });

  test("breaks ties by races completed", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, year: 2026 });
    const user1 = createUser({ id: 1, name: "Alice" });
    const user2 = createUser({ id: 2, name: "Bob" });

    // Same points, but Bob has more races completed
    const stats1 = createUserSeasonStats({
      userId: 1,
      seasonId: 1,
      totalPoints: 25,
      racesCompleted: 2,
    });
    const stats2 = createUserSeasonStats({
      userId: 2,
      seasonId: 1,
      totalPoints: 25,
      racesCompleted: 5,
    });

    seedTestStore(store, {
      seasons: [season],
      users: [user1, user2],
      userSeasonStats: [stats1, stats2],
    });

    const seasonRepository = createMemorySeasonRepository(store);
    const userStatsRepository = createMemoryUserStatsRepository(store);

    const result = await getLeaderboard({
      seasonRepository,
      userStatsRepository,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.standings.length).toBe(2);
      // Bob should be first (same points, more races)
      expect(result.value.standings[0].user_name).toBe("Bob");
      expect(result.value.standings[0].rank).toBe(1);
      expect(result.value.standings[1].user_name).toBe("Alice");
      expect(result.value.standings[1].rank).toBe(2);
    }
  });

  test("only includes stats for the active season", async () => {
    const store = createTestStore();
    const season2025 = createSeason({ id: 1, year: 2025, isActive: false });
    const season2026 = createSeason({ id: 2, year: 2026, isActive: true });
    const user = createUser({ id: 1, name: "Alice" });

    // Stats for both seasons
    const stats2025 = createUserSeasonStats({
      userId: 1,
      seasonId: 1,
      totalPoints: 100,
      racesCompleted: 10,
    });
    const stats2026 = createUserSeasonStats({
      userId: 1,
      seasonId: 2,
      totalPoints: 25,
      racesCompleted: 2,
    });

    seedTestStore(store, {
      seasons: [season2025, season2026],
      users: [user],
      userSeasonStats: [stats2025, stats2026],
    });

    const seasonRepository = createMemorySeasonRepository(store);
    const userStatsRepository = createMemoryUserStatsRepository(store);

    const result = await getLeaderboard({
      seasonRepository,
      userStatsRepository,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Should return the active 2026 season stats
      expect(result.value.season.year).toBe(2026);
      expect(result.value.standings.length).toBe(1);
      expect(result.value.standings[0].total_points).toBe(25);
      expect(result.value.standings[0].races_completed).toBe(2);
    }
  });
});
