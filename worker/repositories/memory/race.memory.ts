import type { Race, RaceStatus } from "../../../shared/types";
import type { RaceRepository } from "../interfaces/race.repository";
import type { TestStore } from "../../test/setup";

export function createMemoryRaceRepository(store: TestStore): RaceRepository {
  return {
    async getBySeasonId(seasonId: number): Promise<Race[]> {
      return store.races
        .filter((r) => r.season_id === seasonId)
        .sort((a, b) => a.round - b.round);
    },

    async getById(id: number): Promise<Race | null> {
      return store.races.find((r) => r.id === id) ?? null;
    },

    async getCurrentRace(seasonId: number): Promise<Race | null> {
      const seasonRaces = store.races
        .filter((r) => r.season_id === seasonId)
        .sort((a, b) => a.round - b.round);

      // Find next upcoming or in_progress race
      const upcoming = seasonRaces.find(
        (r) => r.status === "upcoming" || r.status === "in_progress",
      );

      if (upcoming) return upcoming;

      // If no upcoming, return the last race
      return seasonRaces.length > 0
        ? seasonRaces[seasonRaces.length - 1]
        : null;
    },

    async updateStatus(raceId: number, status: RaceStatus): Promise<void> {
      const race = store.races.find((r) => r.id === raceId);
      if (race) {
        race.status = status;
      }
    },
  };
}
