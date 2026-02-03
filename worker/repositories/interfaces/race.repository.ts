import type { Race, RaceStatus } from "../../../shared/types";

export interface RaceRepository {
  /**
   * Get all races for a season
   */
  getBySeasonId(seasonId: number): Promise<Race[]>;

  /**
   * Get a race by ID
   */
  getById(id: number): Promise<Race | null>;

  /**
   * Get the current/next race for a season
   * Returns the next upcoming race, or the most recent if none upcoming
   */
  getCurrentRace(seasonId: number): Promise<Race | null>;

  /**
   * Update race status
   */
  updateStatus(raceId: number, status: RaceStatus): Promise<void>;
}
