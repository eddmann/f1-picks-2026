import type { Race, RaceStatus } from "../../../shared/types";
import type { RaceRepository } from "../interfaces/race.repository";
import type { Env } from "../../types";

export function createD1RaceRepository(env: Env): RaceRepository {
  return {
    async getBySeasonId(seasonId: number): Promise<Race[]> {
      const result = await env.DB.prepare(
        "SELECT * FROM races WHERE season_id = ? ORDER BY round",
      )
        .bind(seasonId)
        .all<Race>();
      return result.results;
    },

    async getById(id: number): Promise<Race | null> {
      return env.DB.prepare("SELECT * FROM races WHERE id = ?")
        .bind(id)
        .first<Race>();
    },

    async getCurrentRace(seasonId: number): Promise<Race | null> {
      // Get the next upcoming race, or the most recent in-progress race
      const upcoming = await env.DB.prepare(
        "SELECT * FROM races WHERE season_id = ? AND status IN ('upcoming', 'in_progress') ORDER BY round LIMIT 1",
      )
        .bind(seasonId)
        .first<Race>();

      if (upcoming) return upcoming;

      // If no upcoming races, get the most recently completed race
      return env.DB.prepare(
        "SELECT * FROM races WHERE season_id = ? ORDER BY round DESC LIMIT 1",
      )
        .bind(seasonId)
        .first<Race>();
    },

    async updateStatus(raceId: number, status: RaceStatus): Promise<void> {
      await env.DB.prepare("UPDATE races SET status = ? WHERE id = ?")
        .bind(status, raceId)
        .run();
    },
  };
}
