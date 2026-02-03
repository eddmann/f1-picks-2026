import type { Driver } from "../../shared/types";
import type { Result } from "../utils/result";
import type { UseCaseError } from "./errors";
import type { SeasonRepository } from "../repositories/interfaces/season.repository";
import type { DriverRepository } from "../repositories/interfaces/driver.repository";
import { ok, err } from "../utils/result";
import { notFound } from "./errors";

export interface GetDriversResult {
  drivers: Driver[];
}

export interface GetDriversDeps {
  seasonRepository: SeasonRepository;
  driverRepository: DriverRepository;
}

export async function getDrivers(
  deps: GetDriversDeps,
): Promise<Result<GetDriversResult, UseCaseError>> {
  const season = await deps.seasonRepository.getActiveSeason();

  if (!season) {
    return err(notFound("Season"));
  }

  const drivers = await deps.driverRepository.getBySeasonId(season.id);

  return ok({ drivers });
}
