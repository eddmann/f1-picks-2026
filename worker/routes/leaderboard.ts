import { Hono } from "hono";
import type { AppBindings } from "../types";
import { getLeaderboard } from "../usecases/get-leaderboard.usecase";
import { createD1SeasonRepository } from "../repositories/d1/season.d1";
import { createD1UserStatsRepository } from "../repositories/d1/user-stats.d1";
import { errorToHttpStatus, errorToMessage } from "../usecases/errors";
import { convertSeason } from "../utils/transforms";

const leaderboard = new Hono<AppBindings>();

leaderboard.get("/", async (c) => {
  const seasonRepository = createD1SeasonRepository(c.env);
  const userStatsRepository = createD1UserStatsRepository(c.env);

  const result = await getLeaderboard({
    seasonRepository,
    userStatsRepository,
  });

  if (!result.ok) {
    return c.json(
      { error: errorToMessage(result.error) },
      errorToHttpStatus(result.error),
    );
  }

  return c.json({
    data: {
      season: convertSeason(result.value.season),
      standings: result.value.standings,
    },
  });
});

export default leaderboard;
