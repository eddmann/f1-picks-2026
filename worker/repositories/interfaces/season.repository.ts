import type { Season } from "../../../shared/types";

export interface SeasonRepository {
  /**
   * Get the currently active season
   */
  getActiveSeason(): Promise<Season | null>;

  /**
   * Get a season by year
   */
  getByYear(year: number): Promise<Season | null>;

  /**
   * Get a season by ID
   */
  getById(id: number): Promise<Season | null>;
}
