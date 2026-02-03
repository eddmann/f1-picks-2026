import type { Race } from "../../shared/types";
import type { Result } from "../utils/result";
import type { UseCaseError } from "./errors";
import type { RaceRepository } from "../repositories/interfaces/race.repository";
import { ok, err } from "../utils/result";
import { notFound, validationError } from "./errors";

export interface GetRaceResult {
  race: Race;
}

export interface GetRaceDeps {
  raceRepository: RaceRepository;
}

export interface GetRaceInput {
  raceId: number;
}

export async function getRace(
  deps: GetRaceDeps,
  input: GetRaceInput,
): Promise<Result<GetRaceResult, UseCaseError>> {
  if (!Number.isInteger(input.raceId) || input.raceId <= 0) {
    return err(validationError("Invalid race ID", "raceId"));
  }

  const race = await deps.raceRepository.getById(input.raceId);

  if (!race) {
    return err(notFound("Race", input.raceId));
  }

  return ok({ race });
}
