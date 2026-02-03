import type { Season } from "../../shared/types";
import type { Result } from "../utils/result";
import type { UseCaseError } from "./errors";
import type { SeasonRepository } from "../repositories/interfaces/season.repository";
import { ok, err } from "../utils/result";
import { notFound } from "./errors";

export interface GetCurrentSeasonDeps {
  seasonRepository: SeasonRepository;
}

export async function getCurrentSeason(
  deps: GetCurrentSeasonDeps,
): Promise<Result<Season, UseCaseError>> {
  const season = await deps.seasonRepository.getActiveSeason();

  if (!season) {
    return err(notFound("Season"));
  }

  return ok(season);
}
