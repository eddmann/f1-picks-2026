import type { UserSeasonStats } from "../../../shared/types";

export interface LeaderboardEntry extends UserSeasonStats {
  user_name: string;
}

export interface UserStatsRepository {
  /**
   * Get the leaderboard for a season (all users with stats, sorted by points)
   */
  getLeaderboard(seasonId: number): Promise<LeaderboardEntry[]>;

  /**
   * Get stats for a specific user in a season
   */
  getByUserAndSeason(
    userId: number,
    seasonId: number,
  ): Promise<UserSeasonStats | null>;

  /**
   * Create or update user season stats
   */
  upsert(
    userId: number,
    seasonId: number,
    totalPoints: number,
    racesCompleted: number,
  ): Promise<UserSeasonStats>;

  /**
   * Calculate user points for a season (from picks and race results)
   */
  calculateUserPoints(
    userId: number,
    seasonId: number,
  ): Promise<{ totalPoints: number; racesCompleted: number }>;
}
