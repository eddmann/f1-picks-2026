import type { Pick, Driver, Race } from "../../shared/types";
import type { Result } from "../utils/result";
import type { UseCaseError } from "./errors";
import type { SeasonRepository } from "../repositories/interfaces/season.repository";
import type { RaceRepository } from "../repositories/interfaces/race.repository";
import type { DriverRepository } from "../repositories/interfaces/driver.repository";
import type { PickRepository } from "../repositories/interfaces/pick.repository";
import { ok, err } from "../utils/result";
import {
  notFound,
  validationError,
  pickWindowClosed,
  driverUnavailable,
} from "./errors";
import type { RaceForPickWindow } from "../../shared/pick-window";
import { checkPickWindow } from "../../shared/pick-window";

export interface CreatePickResult {
  pick: Pick;
  driver: Driver;
  race: Race;
}

export interface CreatePickDeps {
  seasonRepository: SeasonRepository;
  raceRepository: RaceRepository;
  driverRepository: DriverRepository;
  pickRepository: PickRepository;
  clock?: { now(): Date };
}

export interface CreatePickInput {
  userId: number;
  raceId: number;
  driverId: number;
}

export async function createPick(
  deps: CreatePickDeps,
  input: CreatePickInput,
): Promise<Result<CreatePickResult, UseCaseError>> {
  if (!Number.isInteger(input.raceId) || input.raceId <= 0) {
    return err(validationError("Invalid race ID", "race_id"));
  }
  if (!Number.isInteger(input.driverId) || input.driverId <= 0) {
    return err(validationError("Invalid driver ID", "driver_id"));
  }

  const season = await deps.seasonRepository.getActiveSeason();
  if (!season) {
    return err(notFound("Season"));
  }

  const race = await deps.raceRepository.getById(input.raceId);
  if (!race) {
    return err(notFound("Race", input.raceId));
  }

  if (race.season_id !== season.id) {
    return err(
      validationError("Race does not belong to current season", "race_id"),
    );
  }

  const raceForWindow: RaceForPickWindow = {
    quali_time: race.quali_time,
    sprint_quali_time: race.sprint_quali_time,
    has_sprint: race.has_sprint,
  };

  const clock = deps.clock ?? { now: () => new Date() };
  const windowResult = checkPickWindow(raceForWindow, clock.now());

  if (!windowResult.isOpen) {
    return err(
      pickWindowClosed(
        windowResult.reason as "too_early" | "too_late",
        windowResult.reason === "too_early" ? windowResult.opensAt : undefined,
      ),
    );
  }

  const driver = await deps.driverRepository.getById(input.driverId);
  if (!driver) {
    return err(notFound("Driver", input.driverId));
  }

  if (driver.season_id !== season.id) {
    return err(
      validationError("Driver does not belong to current season", "driver_id"),
    );
  }

  if (!race.is_wild_card) {
    const usedDriverIds = await deps.pickRepository.getUsedDriverIds(
      input.userId,
      season.id,
    );
    const existingPick = await deps.pickRepository.getByUserAndRace(
      input.userId,
      race.id,
    );

    const usedSet = new Set(usedDriverIds);
    if (existingPick) {
      usedSet.delete(existingPick.driver_id);
    }

    if (usedSet.has(input.driverId)) {
      return err(driverUnavailable(input.driverId));
    }
  }

  const existingPick = await deps.pickRepository.getByUserAndRace(
    input.userId,
    race.id,
  );

  let pick: Pick;
  if (existingPick) {
    pick = await deps.pickRepository.update(existingPick.id, input.driverId);
  } else {
    pick = await deps.pickRepository.create(
      input.userId,
      race.id,
      input.driverId,
    );
  }

  return ok({
    pick,
    driver,
    race,
  });
}
