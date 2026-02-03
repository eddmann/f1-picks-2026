import type { Driver } from "../../../shared/types";
import type { DriverRepository } from "../interfaces/driver.repository";
import type { Env } from "../../types";

export function createD1DriverRepository(env: Env): DriverRepository {
  return {
    async getBySeasonId(seasonId: number): Promise<Driver[]> {
      const result = await env.DB.prepare(
        "SELECT * FROM drivers WHERE season_id = ? ORDER BY team, number",
      )
        .bind(seasonId)
        .all<Driver>();
      return result.results;
    },

    async getById(id: number): Promise<Driver | null> {
      return env.DB.prepare("SELECT * FROM drivers WHERE id = ?")
        .bind(id)
        .first<Driver>();
    },
  };
}
