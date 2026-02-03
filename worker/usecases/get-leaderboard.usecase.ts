import type { Season } from "../../shared/types";
import type { Result } from "../utils/result";
import type { UseCaseError } from "./errors";
import type { SeasonRepository } from "../repositories/interfaces/season.repository";
import type {
  UserStatsRepository,
  LeaderboardEntry,
} from "../repositories/interfaces/user-stats.repository";
import { ok, err } from "../utils/result";
import { notFound } from "./errors";

export interface RankedLeaderboardEntry extends LeaderboardEntry {
  rank: number;
}

export interface GetLeaderboardResult {
  season: Season;
  standings: RankedLeaderboardEntry[];
}

export interface GetLeaderboardDeps {
  seasonRepository: SeasonRepository;
  userStatsRepository: UserStatsRepository;
}

export async function getLeaderboard(
  deps: GetLeaderboardDeps,
): Promise<Result<GetLeaderboardResult, UseCaseError>> {
  const season = await deps.seasonRepository.getActiveSeason();

  if (!season) {
    return err(notFound("Season"));
  }

  const standings = await deps.userStatsRepository.getLeaderboard(season.id);

  const rankedStandings: RankedLeaderboardEntry[] = standings.map(
    (entry, index) => ({
      ...entry,
      rank: index + 1,
    }),
  );

  return ok({
    season,
    standings: rankedStandings,
  });
}
