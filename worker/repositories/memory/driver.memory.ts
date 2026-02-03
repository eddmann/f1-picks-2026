import type { Driver } from "../../../shared/types";
import type { DriverRepository } from "../interfaces/driver.repository";
import type { TestStore } from "../../test/setup";

export function createMemoryDriverRepository(
  store: TestStore,
): DriverRepository {
  return {
    async getBySeasonId(seasonId: number): Promise<Driver[]> {
      return store.drivers
        .filter((d) => d.season_id === seasonId)
        .sort((a, b) => {
          // Sort by team, then number
          if (a.team !== b.team) return a.team.localeCompare(b.team);
          return a.number - b.number;
        });
    },

    async getById(id: number): Promise<Driver | null> {
      return store.drivers.find((d) => d.id === id) ?? null;
    },
  };
}
