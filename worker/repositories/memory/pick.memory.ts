import type { Pick } from "../../../shared/types";
import type {
  PickRepository,
  PickWithUserName,
} from "../interfaces/pick.repository";
import type { TestStore } from "../../test/setup";

export function createMemoryPickRepository(store: TestStore): PickRepository {
  return {
    async getUsedDriverIds(
      userId: number,
      seasonId: number,
    ): Promise<number[]> {
      const driverIds = new Set<number>();

      for (const pick of store.picks) {
        if (pick.user_id !== userId) continue;

        const race = store.races.find((r) => r.id === pick.race_id);
        if (!race || race.season_id !== seasonId || race.is_wild_card) continue;

        driverIds.add(pick.driver_id);
      }

      return Array.from(driverIds);
    },

    async getByUserId(userId: number, seasonId: number): Promise<Pick[]> {
      return store.picks
        .filter((p) => {
          if (p.user_id !== userId) return false;
          const race = store.races.find((r) => r.id === p.race_id);
          return race && race.season_id === seasonId;
        })
        .sort((a, b) => {
          const raceA = store.races.find((r) => r.id === a.race_id);
          const raceB = store.races.find((r) => r.id === b.race_id);
          return (raceA?.round ?? 0) - (raceB?.round ?? 0);
        });
    },

    async getByUserAndRace(
      userId: number,
      raceId: number,
    ): Promise<Pick | null> {
      return (
        store.picks.find((p) => p.user_id === userId && p.race_id === raceId) ??
        null
      );
    },

    async getForRace(raceId: number): Promise<PickWithUserName[]> {
      return store.picks
        .filter((p) => p.race_id === raceId)
        .map((p) => {
          const user = store.users.find((u) => u.id === p.user_id);
          return {
            ...p,
            user_name: user?.name ?? "Unknown",
          };
        });
    },

    async create(
      userId: number,
      raceId: number,
      driverId: number,
    ): Promise<Pick> {
      const newPick: Pick = {
        id: store.picks.length + 1,
        user_id: userId,
        race_id: raceId,
        driver_id: driverId,
        created_at: new Date().toISOString(),
      };
      store.picks.push(newPick);
      return newPick;
    },

    async update(pickId: number, driverId: number): Promise<Pick> {
      const pick = store.picks.find((p) => p.id === pickId);
      if (!pick) {
        throw new Error(`Pick ${pickId} not found`);
      }
      pick.driver_id = driverId;
      return pick;
    },
  };
}
