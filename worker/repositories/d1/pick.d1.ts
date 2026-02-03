import type { Pick } from "../../../shared/types";
import type {
  PickRepository,
  PickWithUserName,
} from "../interfaces/pick.repository";
import type { Env } from "../../types";

export function createD1PickRepository(env: Env): PickRepository {
  return {
    async getUsedDriverIds(
      userId: number,
      seasonId: number,
    ): Promise<number[]> {
      const result = await env.DB.prepare(
        `SELECT DISTINCT p.driver_id FROM picks p
         JOIN races r ON p.race_id = r.id
         WHERE p.user_id = ? AND r.season_id = ? AND r.is_wild_card = FALSE`,
      )
        .bind(userId, seasonId)
        .all<{ driver_id: number }>();
      return result.results.map((r) => r.driver_id);
    },

    async getByUserId(userId: number, seasonId: number): Promise<Pick[]> {
      const result = await env.DB.prepare(
        `SELECT p.* FROM picks p
         JOIN races r ON p.race_id = r.id
         WHERE p.user_id = ? AND r.season_id = ?
         ORDER BY r.round`,
      )
        .bind(userId, seasonId)
        .all<Pick>();
      return result.results;
    },

    async getByUserAndRace(
      userId: number,
      raceId: number,
    ): Promise<Pick | null> {
      return env.DB.prepare(
        "SELECT * FROM picks WHERE user_id = ? AND race_id = ?",
      )
        .bind(userId, raceId)
        .first<Pick>();
    },

    async getForRace(raceId: number): Promise<PickWithUserName[]> {
      const result = await env.DB.prepare(
        `SELECT p.*, u.name as user_name FROM picks p
         JOIN users u ON p.user_id = u.id
         WHERE p.race_id = ?`,
      )
        .bind(raceId)
        .all<PickWithUserName>();
      return result.results;
    },

    async create(
      userId: number,
      raceId: number,
      driverId: number,
    ): Promise<Pick> {
      const result = await env.DB.prepare(
        "INSERT INTO picks (user_id, race_id, driver_id) VALUES (?, ?, ?) RETURNING *",
      )
        .bind(userId, raceId, driverId)
        .first<Pick>();
      return result!;
    },

    async update(pickId: number, driverId: number): Promise<Pick> {
      const result = await env.DB.prepare(
        "UPDATE picks SET driver_id = ? WHERE id = ? RETURNING *",
      )
        .bind(driverId, pickId)
        .first<Pick>();
      return result!;
    },
  };
}
