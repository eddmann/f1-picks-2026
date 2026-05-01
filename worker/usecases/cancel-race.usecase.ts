import type { Race } from "../../shared/types";
import type { Result } from "../utils/result";
import type { UseCaseError } from "./errors";
import type { SeasonRepository } from "../repositories/interfaces/season.repository";
import type { RaceRepository } from "../repositories/interfaces/race.repository";
import type { RaceResultRepository } from "../repositories/interfaces/race-result.repository";
import type { PickRepository } from "../repositories/interfaces/pick.repository";
import type { UserStatsRepository } from "../repositories/interfaces/user-stats.repository";
import { ok, err } from "../utils/result";
import { notFound, validationError } from "./errors";

export interface CancelRaceResult {
  race: Race;
}

export interface CancelRaceDeps {
  seasonRepository: SeasonRepository;
  raceRepository: RaceRepository;
  raceResultRepository: RaceResultRepository;
  pickRepository: PickRepository;
  userStatsRepository: UserStatsRepository;
}

export interface CancelRaceInput {
  raceId: number;
}

export async function cancelRace(
  deps: CancelRaceDeps,
  input: CancelRaceInput,
): Promise<Result<CancelRaceResult, UseCaseError>> {
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

  const picks = await deps.pickRepository.getForRace(input.raceId);
  await deps.raceResultRepository.deleteByRaceId(input.raceId);
  await deps.raceRepository.updateStatus(input.raceId, "cancelled");

  const userIds = new Set(picks.map((pick) => pick.user_id));
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
    race: {
      ...race,
      status: "cancelled",
    },
  });
}
