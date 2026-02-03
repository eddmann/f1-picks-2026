import type { Race } from "../../shared/types";
import type { Result } from "../utils/result";
import type { UseCaseError } from "./errors";
import type { SeasonRepository } from "../repositories/interfaces/season.repository";
import type { RaceRepository } from "../repositories/interfaces/race.repository";
import { ok, err } from "../utils/result";
import { notFound } from "./errors";

export interface GetRacesResult {
  races: Race[];
}

export interface GetRacesDeps {
  seasonRepository: SeasonRepository;
  raceRepository: RaceRepository;
}

export async function getRaces(
  deps: GetRacesDeps,
): Promise<Result<GetRacesResult, UseCaseError>> {
  const season = await deps.seasonRepository.getActiveSeason();

  if (!season) {
    return err(notFound("Season"));
  }

  const races = await deps.raceRepository.getBySeasonId(season.id);

  return ok({ races });
}
