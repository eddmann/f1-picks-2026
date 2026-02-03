import type { RaceResult } from "../../../shared/types";

export interface RaceResultRepository {
  /**
   * Get all results for a race
   */
  getByRaceId(raceId: number): Promise<RaceResult[]>;

  /**
   * Get a specific result by race and driver
   */
  getByRaceAndDriver(
    raceId: number,
    driverId: number,
  ): Promise<RaceResult | null>;

  /**
   * Create or update a race result
   */
  upsert(
    raceId: number,
    driverId: number,
    racePosition: number | null,
    sprintPosition: number | null,
    racePoints: number,
    sprintPoints: number,
  ): Promise<RaceResult>;
}
