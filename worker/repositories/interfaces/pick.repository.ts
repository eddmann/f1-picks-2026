import type { Pick } from "../../../shared/types";

export interface PickWithUserName extends Pick {
  user_name: string;
}

export interface PickRepository {
  /**
   * Get driver IDs already used by a user in non-wild-card races
   */
  getUsedDriverIds(userId: number, seasonId: number): Promise<number[]>;

  /**
   * Get all picks for a user in a season
   */
  getByUserId(userId: number, seasonId: number): Promise<Pick[]>;

  /**
   * Get a pick by user and race
   */
  getByUserAndRace(userId: number, raceId: number): Promise<Pick | null>;

  /**
   * Get all picks for a race (with user names)
   */
  getForRace(raceId: number): Promise<PickWithUserName[]>;

  /**
   * Create a new pick
   */
  create(userId: number, raceId: number, driverId: number): Promise<Pick>;

  /**
   * Update an existing pick
   */
  update(pickId: number, driverId: number): Promise<Pick>;
}
