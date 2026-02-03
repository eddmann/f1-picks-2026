import type { UserSeasonStats } from "../../../shared/types";
import type {
  UserStatsRepository,
  LeaderboardEntry,
} from "../interfaces/user-stats.repository";
import type { Env } from "../../types";

export function createD1UserStatsRepository(env: Env): UserStatsRepository {
  return {
    async getLeaderboard(seasonId: number): Promise<LeaderboardEntry[]> {
      const result = await env.DB.prepare(
        `SELECT uss.*, u.name as user_name FROM user_season_stats uss
         JOIN users u ON uss.user_id = u.id
         WHERE uss.season_id = ?
         ORDER BY uss.total_points DESC, uss.races_completed DESC`,
      )
        .bind(seasonId)
        .all<LeaderboardEntry>();
      return result.results;
    },

    async getByUserAndSeason(
      userId: number,
      seasonId: number,
    ): Promise<UserSeasonStats | null> {
      return env.DB.prepare(
        "SELECT * FROM user_season_stats WHERE user_id = ? AND season_id = ?",
      )
        .bind(userId, seasonId)
        .first<UserSeasonStats>();
    },

    async upsert(
      userId: number,
      seasonId: number,
      totalPoints: number,
      racesCompleted: number,
    ): Promise<UserSeasonStats> {
      const result = await env.DB.prepare(
        `INSERT INTO user_season_stats (user_id, season_id, total_points, races_completed)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, season_id) DO UPDATE SET
           total_points = excluded.total_points,
           races_completed = excluded.races_completed
         RETURNING *`,
      )
        .bind(userId, seasonId, totalPoints, racesCompleted)
        .first<UserSeasonStats>();
      return result!;
    },

    async calculateUserPoints(
      userId: number,
      seasonId: number,
    ): Promise<{ totalPoints: number; racesCompleted: number }> {
      const result = await env.DB.prepare(
        `SELECT
           COALESCE(SUM(rr.race_points + rr.sprint_points), 0) as total_points,
           COUNT(DISTINCT r.id) as races_completed
         FROM picks p
         JOIN races r ON p.race_id = r.id
         LEFT JOIN race_results rr ON rr.race_id = r.id AND rr.driver_id = p.driver_id
         WHERE p.user_id = ? AND r.season_id = ? AND r.status = 'completed'`,
      )
        .bind(userId, seasonId)
        .first<{ total_points: number; races_completed: number }>();

      return {
        totalPoints: result?.total_points ?? 0,
        racesCompleted: result?.races_completed ?? 0,
      };
    },
  };
}
