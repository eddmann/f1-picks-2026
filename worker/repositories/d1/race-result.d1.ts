import type { RaceResult } from "../../../shared/types";
import type { RaceResultRepository } from "../interfaces/race-result.repository";
import type { Env } from "../../types";

export function createD1RaceResultRepository(env: Env): RaceResultRepository {
  return {
    async getByRaceId(raceId: number): Promise<RaceResult[]> {
      const result = await env.DB.prepare(
        "SELECT * FROM race_results WHERE race_id = ? ORDER BY race_position",
      )
        .bind(raceId)
        .all<RaceResult>();
      return result.results;
    },

    async getByRaceAndDriver(
      raceId: number,
      driverId: number,
    ): Promise<RaceResult | null> {
      return env.DB.prepare(
        "SELECT * FROM race_results WHERE race_id = ? AND driver_id = ?",
      )
        .bind(raceId, driverId)
        .first<RaceResult>();
    },

    async upsert(
      raceId: number,
      driverId: number,
      racePosition: number | null,
      sprintPosition: number | null,
      racePoints: number,
      sprintPoints: number,
    ): Promise<RaceResult> {
      const result = await env.DB.prepare(
        `INSERT INTO race_results (race_id, driver_id, race_position, sprint_position, race_points, sprint_points)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(race_id, driver_id) DO UPDATE SET
           race_position = excluded.race_position,
           sprint_position = excluded.sprint_position,
           race_points = excluded.race_points,
           sprint_points = excluded.sprint_points
         RETURNING *`,
      )
        .bind(
          raceId,
          driverId,
          racePosition,
          sprintPosition,
          racePoints,
          sprintPoints,
        )
        .first<RaceResult>();
      return result!;
    },
  };
}
