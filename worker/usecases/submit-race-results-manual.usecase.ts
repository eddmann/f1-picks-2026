import type { RaceResult } from "../../shared/types";
import type { Result } from "../utils/result";
import type { UseCaseError } from "./errors";
import type { SeasonRepository } from "../repositories/interfaces/season.repository";
import type { RaceRepository } from "../repositories/interfaces/race.repository";
import type { DriverRepository } from "../repositories/interfaces/driver.repository";
import type { RaceResultRepository } from "../repositories/interfaces/race-result.repository";
import type { PickRepository } from "../repositories/interfaces/pick.repository";
import type { UserStatsRepository } from "../repositories/interfaces/user-stats.repository";
import { ok, err } from "../utils/result";
import { notFound, validationError } from "./errors";
import { getRacePoints, getSprintPoints } from "../../shared/scoring";

export interface SubmitRaceResultsResult {
  results: RaceResult[];
  raceStatus: "completed";
}

export interface SubmitRaceResultsDeps {
  seasonRepository: SeasonRepository;
  raceRepository: RaceRepository;
  driverRepository: DriverRepository;
  raceResultRepository: RaceResultRepository;
  pickRepository: PickRepository;
  userStatsRepository: UserStatsRepository;
}

export interface ResultInput {
  driver_id: number;
  race_position: number | null;
  sprint_position?: number | null;
}

export interface SubmitRaceResultsInput {
  raceId: number;
  results: ResultInput[];
}

export async function submitRaceResultsManual(
  deps: SubmitRaceResultsDeps,
  input: SubmitRaceResultsInput,
): Promise<Result<SubmitRaceResultsResult, UseCaseError>> {
  if (!Number.isInteger(input.raceId) || input.raceId <= 0) {
    return err(validationError("Invalid race ID", "raceId"));
  }

  const race = await deps.raceRepository.getById(input.raceId);
  if (!race) {
    return err(notFound("Race", input.raceId));
  }

  const season = await deps.seasonRepository.getActiveSeason();
  if (!season || race.season_id !== season.id) {
    return err(validationError("Race not in active season", "raceId"));
  }

  const drivers = await deps.driverRepository.getBySeasonId(season.id);
  const validDriverIds = new Set(drivers.map((d) => d.id));

  for (const result of input.results) {
    if (!validDriverIds.has(result.driver_id)) {
      return err(
        validationError(`Invalid driver ID: ${result.driver_id}`, "driver_id"),
      );
    }
  }

  if (!race.has_sprint) {
    const hasSprintData = input.results.some(
      (result) =>
        result.sprint_position !== undefined && result.sprint_position !== null,
    );
    if (hasSprintData) {
      return err(
        validationError(
          "Sprint results provided for non-sprint race",
          "sprint_position",
        ),
      );
    }
  }

  const savedResults: RaceResult[] = [];
  for (const result of input.results) {
    const racePoints = getRacePoints(result.race_position);
    const sprintPoints = getSprintPoints(result.sprint_position ?? null);

    const saved = await deps.raceResultRepository.upsert(
      input.raceId,
      result.driver_id,
      result.race_position,
      result.sprint_position ?? null,
      racePoints,
      sprintPoints,
    );
    savedResults.push(saved);
  }

  await deps.raceRepository.updateStatus(input.raceId, "completed");

  const picks = await deps.pickRepository.getForRace(input.raceId);
  const userIds = new Set(picks.map((p) => p.user_id));

  for (const userId of userIds) {
    const stats = await deps.userStatsRepository.calculateUserPoints(
      userId,
      season.id,
    );
    await deps.userStatsRepository.upsert(
      userId,
      season.id,
      stats.totalPoints,
      stats.racesCompleted,
    );
  }

  return ok({
    results: savedResults,
    raceStatus: "completed",
  });
}
