import type { UserSeasonStats } from "../../../shared/types";
import type {
  UserStatsRepository,
  LeaderboardEntry,
} from "../interfaces/user-stats.repository";
import type { TestStore } from "../../test/setup";

export function createMemoryUserStatsRepository(
  store: TestStore,
): UserStatsRepository {
  return {
    async getLeaderboard(seasonId: number): Promise<LeaderboardEntry[]> {
      const stats = store.userSeasonStats.filter(
        (s) => s.season_id === seasonId,
      );

      // Join with users to get names
      return stats
        .map((stat) => {
          const user = store.users.find((u) => u.id === stat.user_id);
          return {
            ...stat,
            user_name: user?.name ?? "Unknown",
          };
        })
        .sort((a, b) => {
          // Sort by points descending, then races_completed descending
          if (b.total_points !== a.total_points) {
            return b.total_points - a.total_points;
          }
          return b.races_completed - a.races_completed;
        });
    },

    async getByUserAndSeason(
      userId: number,
      seasonId: number,
    ): Promise<UserSeasonStats | null> {
      return (
        store.userSeasonStats.find(
          (s) => s.user_id === userId && s.season_id === seasonId,
        ) ?? null
      );
    },

    async upsert(
      userId: number,
      seasonId: number,
      totalPoints: number,
      racesCompleted: number,
    ): Promise<UserSeasonStats> {
      const existing = store.userSeasonStats.find(
        (s) => s.user_id === userId && s.season_id === seasonId,
      );

      if (existing) {
        existing.total_points = totalPoints;
        existing.races_completed = racesCompleted;
        return existing;
      }

      const newStats: UserSeasonStats = {
        id: store.userSeasonStats.length + 1,
        user_id: userId,
        season_id: seasonId,
        total_points: totalPoints,
        races_completed: racesCompleted,
        created_at: new Date().toISOString(),
      };
      store.userSeasonStats.push(newStats);
      return newStats;
    },

    async calculateUserPoints(
      userId: number,
      seasonId: number,
    ): Promise<{ totalPoints: number; racesCompleted: number }> {
      // Get all picks for this user in completed races of this season
      const userPicks = store.picks.filter((p) => p.user_id === userId);

      let totalPoints = 0;
      const completedRaceIds = new Set<number>();

      for (const pick of userPicks) {
        const race = store.races.find((r) => r.id === pick.race_id);
        if (
          !race ||
          race.season_id !== seasonId ||
          race.status !== "completed"
        ) {
          continue;
        }

        completedRaceIds.add(race.id);

        const result = store.raceResults.find(
          (rr) =>
            rr.race_id === pick.race_id && rr.driver_id === pick.driver_id,
        );
        if (result) {
          totalPoints += result.race_points + result.sprint_points;
        }
      }

      return {
        totalPoints,
        racesCompleted: completedRaceIds.size,
      };
    },
  };
}
