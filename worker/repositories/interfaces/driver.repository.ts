import type { Driver } from "../../../shared/types";

export interface DriverRepository {
  /**
   * Get all drivers for a season
   */
  getBySeasonId(seasonId: number): Promise<Driver[]>;

  /**
   * Get a driver by ID
   */
  getById(id: number): Promise<Driver | null>;
}
