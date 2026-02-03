import type { RaceResult } from "../../../shared/types";
import type { RaceResultRepository } from "../interfaces/race-result.repository";
import type { TestStore } from "../../test/setup";

export function createMemoryRaceResultRepository(
  store: TestStore,
): RaceResultRepository {
  return {
    async getByRaceId(raceId: number): Promise<RaceResult[]> {
      return store.raceResults
        .filter((r) => r.race_id === raceId)
        .sort((a, b) => (a.race_position ?? 999) - (b.race_position ?? 999));
    },

    async getByRaceAndDriver(
      raceId: number,
      driverId: number,
    ): Promise<RaceResult | null> {
      return (
        store.raceResults.find(
          (r) => r.race_id === raceId && r.driver_id === driverId,
        ) ?? null
      );
    },

    async upsert(
      raceId: number,
      driverId: number,
      racePosition: number | null,
      sprintPosition: number | null,
      racePoints: number,
      sprintPoints: number,
    ): Promise<RaceResult> {
      const existing = store.raceResults.find(
        (r) => r.race_id === raceId && r.driver_id === driverId,
      );

      if (existing) {
        existing.race_position = racePosition;
        existing.sprint_position = sprintPosition;
        existing.race_points = racePoints;
        existing.sprint_points = sprintPoints;
        return existing;
      }

      const newResult: RaceResult = {
        id: store.raceResults.length + 1,
        race_id: raceId,
        driver_id: driverId,
        race_position: racePosition,
        sprint_position: sprintPosition,
        race_points: racePoints,
        sprint_points: sprintPoints,
        created_at: new Date().toISOString(),
      };
      store.raceResults.push(newResult);
      return newResult;
    },
  };
}
