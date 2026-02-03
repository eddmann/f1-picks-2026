import type { Race } from "../../shared/types";
import type { Result } from "../utils/result";
import type { UseCaseError } from "./errors";
import type { SeasonRepository } from "../repositories/interfaces/season.repository";
import type { RaceRepository } from "../repositories/interfaces/race.repository";
import { ok, err } from "../utils/result";
import { notFound } from "./errors";

export interface GetCurrentRaceResult {
  race: Race;
}

export interface GetCurrentRaceDeps {
  seasonRepository: SeasonRepository;
  raceRepository: RaceRepository;
}

export async function getCurrentRace(
  deps: GetCurrentRaceDeps,
): Promise<Result<GetCurrentRaceResult, UseCaseError>> {
  const season = await deps.seasonRepository.getActiveSeason();

  if (!season) {
    return err(notFound("Season"));
  }

  const race = await deps.raceRepository.getCurrentRace(season.id);

  if (!race) {
    return err(notFound("Race"));
  }

  return ok({ race });
}
