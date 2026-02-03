import type { Season } from "../../../shared/types";
import type { SeasonRepository } from "../interfaces/season.repository";
import type { Env } from "../../types";

export function createD1SeasonRepository(env: Env): SeasonRepository {
  return {
    async getActiveSeason(): Promise<Season | null> {
      return env.DB.prepare(
        "SELECT * FROM seasons WHERE is_active = TRUE LIMIT 1",
      ).first<Season>();
    },

    async getByYear(year: number): Promise<Season | null> {
      return env.DB.prepare("SELECT * FROM seasons WHERE year = ?")
        .bind(year)
        .first<Season>();
    },

    async getById(id: number): Promise<Season | null> {
      return env.DB.prepare("SELECT * FROM seasons WHERE id = ?")
        .bind(id)
        .first<Season>();
    },
  };
}
