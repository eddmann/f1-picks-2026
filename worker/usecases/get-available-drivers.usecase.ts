import type { Driver } from "../../shared/types";
import type { Result } from "../utils/result";
import type { UseCaseError } from "./errors";
import type { SeasonRepository } from "../repositories/interfaces/season.repository";
import type { DriverRepository } from "../repositories/interfaces/driver.repository";
import type { PickRepository } from "../repositories/interfaces/pick.repository";
import { ok, err } from "../utils/result";
import { notFound } from "./errors";

export interface DriverWithAvailability extends Driver {
  is_available: boolean;
}

export interface GetAvailableDriversResult {
  drivers: DriverWithAvailability[];
  used_driver_ids: number[];
}

export interface GetAvailableDriversDeps {
  seasonRepository: SeasonRepository;
  driverRepository: DriverRepository;
  pickRepository: PickRepository;
}

export interface GetAvailableDriversInput {
  userId: number;
}

export async function getAvailableDrivers(
  deps: GetAvailableDriversDeps,
  input: GetAvailableDriversInput,
): Promise<Result<GetAvailableDriversResult, UseCaseError>> {
  const season = await deps.seasonRepository.getActiveSeason();

  if (!season) {
    return err(notFound("Season"));
  }

  const [drivers, usedDriverIds] = await Promise.all([
    deps.driverRepository.getBySeasonId(season.id),
    deps.pickRepository.getUsedDriverIds(input.userId, season.id),
  ]);

  const usedSet = new Set(usedDriverIds);

  const driversWithAvailability: DriverWithAvailability[] = drivers.map(
    (driver) => ({
      ...driver,
      is_available: !usedSet.has(driver.id),
    }),
  );

  return ok({
    drivers: driversWithAvailability,
    used_driver_ids: usedDriverIds,
  });
}
