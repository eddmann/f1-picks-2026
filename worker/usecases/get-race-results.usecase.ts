import type { Race, Driver, RaceResult } from "../../shared/types";
import type { Result } from "../utils/result";
import type { UseCaseError } from "./errors";
import type { RaceRepository } from "../repositories/interfaces/race.repository";
import type { RaceResultRepository } from "../repositories/interfaces/race-result.repository";
import type { DriverRepository } from "../repositories/interfaces/driver.repository";
import type {
  PickRepository,
  PickWithUserName,
} from "../repositories/interfaces/pick.repository";
import { ok, err } from "../utils/result";
import { notFound, validationError } from "./errors";

export interface EnrichedRaceResult extends RaceResult {
  driver: Driver | null;
}

export interface EnrichedPick extends PickWithUserName {
  driver: Driver | null;
  points: number;
}

export interface GetRaceResultsResult {
  race: Race;
  results: EnrichedRaceResult[];
  picks: EnrichedPick[];
}

export interface GetRaceResultsDeps {
  raceRepository: RaceRepository;
  raceResultRepository: RaceResultRepository;
  driverRepository: DriverRepository;
  pickRepository: PickRepository;
}

export interface GetRaceResultsInput {
  raceId: number;
}

export async function getRaceResults(
  deps: GetRaceResultsDeps,
  input: GetRaceResultsInput,
): Promise<Result<GetRaceResultsResult, UseCaseError>> {
  if (!Number.isInteger(input.raceId) || input.raceId <= 0) {
    return err(validationError("Invalid race ID", "raceId"));
  }

  const race = await deps.raceRepository.getById(input.raceId);

  if (!race) {
    return err(notFound("Race", input.raceId));
  }

  const [results, picks] = await Promise.all([
    deps.raceResultRepository.getByRaceId(input.raceId),
    deps.pickRepository.getForRace(input.raceId),
  ]);

  const resultsMap = new Map(results.map((r) => [r.driver_id, r]));

  const enrichedResults: EnrichedRaceResult[] = await Promise.all(
    results.map(async (result) => {
      const driver = await deps.driverRepository.getById(result.driver_id);
      return {
        ...result,
        driver,
      };
    }),
  );

  const enrichedPicks: EnrichedPick[] = await Promise.all(
    picks.map(async (pick) => {
      const driver = await deps.driverRepository.getById(pick.driver_id);
      const result = resultsMap.get(pick.driver_id);
      return {
        ...pick,
        driver,
        points: result ? result.race_points + result.sprint_points : 0,
      };
    }),
  );

  return ok({
    race,
    results: enrichedResults,
    picks: enrichedPicks,
  });
}
