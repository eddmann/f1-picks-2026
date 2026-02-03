import type { Pick, Driver, Race } from "../../shared/types";
import type { Result } from "../utils/result";
import type { UseCaseError } from "./errors";
import type { SeasonRepository } from "../repositories/interfaces/season.repository";
import type { PickRepository } from "../repositories/interfaces/pick.repository";
import type { RaceRepository } from "../repositories/interfaces/race.repository";
import type { DriverRepository } from "../repositories/interfaces/driver.repository";
import type { RaceResultRepository } from "../repositories/interfaces/race-result.repository";
import { ok, err } from "../utils/result";
import { notFound } from "./errors";

export interface EnrichedPick extends Pick {
  driver: Driver | null;
  race: Race | null;
  points?: number;
}

export interface GetUserPicksResult {
  picks: EnrichedPick[];
}

export interface GetUserPicksDeps {
  seasonRepository: SeasonRepository;
  pickRepository: PickRepository;
  raceRepository: RaceRepository;
  driverRepository: DriverRepository;
  raceResultRepository: RaceResultRepository;
}

export interface GetUserPicksInput {
  userId: number;
}

export async function getUserPicks(
  deps: GetUserPicksDeps,
  input: GetUserPicksInput,
): Promise<Result<GetUserPicksResult, UseCaseError>> {
  const season = await deps.seasonRepository.getActiveSeason();

  if (!season) {
    return err(notFound("Season"));
  }

  const userPicks = await deps.pickRepository.getByUserId(
    input.userId,
    season.id,
  );

  const enrichedPicks: EnrichedPick[] = await Promise.all(
    userPicks.map(async (pick) => {
      const [driver, race, results] = await Promise.all([
        deps.driverRepository.getById(pick.driver_id),
        deps.raceRepository.getById(pick.race_id),
        deps.raceResultRepository.getByRaceId(pick.race_id),
      ]);

      const driverResult = results.find((r) => r.driver_id === pick.driver_id);

      return {
        ...pick,
        driver,
        race,
        points: driverResult
          ? driverResult.race_points + driverResult.sprint_points
          : undefined,
      };
    }),
  );

  return ok({ picks: enrichedPicks });
}
