import { Hono } from "hono";
import type { AppBindings } from "../types";
import { getCurrentSeason } from "../usecases/get-current-season.usecase";
import { createD1SeasonRepository } from "../repositories/d1/season.d1";
import { errorToHttpStatus, errorToMessage } from "../usecases/errors";
import { convertSeason } from "../utils/transforms";

const seasons = new Hono<AppBindings>();

seasons.get("/current", async (c) => {
  const seasonRepository = createD1SeasonRepository(c.env);
  const result = await getCurrentSeason({ seasonRepository });

  if (!result.ok) {
    return c.json(
      { error: errorToMessage(result.error) },
      errorToHttpStatus(result.error),
    );
  }

  return c.json({
    data: { season: convertSeason(result.value) },
  });
});

export default seasons;
