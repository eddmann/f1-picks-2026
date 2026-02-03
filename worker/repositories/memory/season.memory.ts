import type { Season } from "../../../shared/types";
import type { SeasonRepository } from "../interfaces/season.repository";
import type { TestStore } from "../../test/setup";

export function createMemorySeasonRepository(
  store: TestStore,
): SeasonRepository {
  return {
    async getActiveSeason(): Promise<Season | null> {
      return store.seasons.find((s) => s.is_active) ?? null;
    },

    async getByYear(year: number): Promise<Season | null> {
      return store.seasons.find((s) => s.year === year) ?? null;
    },

    async getById(id: number): Promise<Season | null> {
      return store.seasons.find((s) => s.id === id) ?? null;
    },
  };
}
