import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppBindings } from "../types";
import { adminMiddleware } from "../middleware/auth";
import { submitRaceResultsManual } from "../usecases/submit-race-results-manual.usecase";
import { createD1SeasonRepository } from "../repositories/d1/season.d1";
import { createD1RaceRepository } from "../repositories/d1/race.d1";
import { createD1DriverRepository } from "../repositories/d1/driver.d1";
import { createD1RaceResultRepository } from "../repositories/d1/race-result.d1";
import { createD1PickRepository } from "../repositories/d1/pick.d1";
import { createD1UserStatsRepository } from "../repositories/d1/user-stats.d1";
import { errorToHttpStatus, errorToMessage } from "../usecases/errors";
import { syncRaceResults } from "../usecases/sync-race-results.usecase";
import { OpenF1ResultsFetcher } from "../services/openf1-results-fetcher";

const admin = new Hono<AppBindings>();

admin.use("*", adminMiddleware);

const resultSchema = z.object({
  driver_id: z.number().int().positive(),
  race_position: z.number().int().min(1).max(20).nullable(),
  sprint_position: z.number().int().min(1).max(20).nullable().optional(),
});

const resultsSchema = z.object({
  results: z.array(resultSchema),
});

admin.post(
  "/races/:id/results",
  zValidator("json", resultsSchema),
  async (c) => {
    const raceId = parseInt(c.req.param("id"), 10);
    const { results } = c.req.valid("json");

    const result = await submitRaceResultsManual(
      {
        seasonRepository: createD1SeasonRepository(c.env),
        raceRepository: createD1RaceRepository(c.env),
        driverRepository: createD1DriverRepository(c.env),
        raceResultRepository: createD1RaceResultRepository(c.env),
        pickRepository: createD1PickRepository(c.env),
        userStatsRepository: createD1UserStatsRepository(c.env),
      },
      {
        raceId,
        results,
      },
    );

    if (!result.ok) {
      return c.json(
        { error: errorToMessage(result.error) },
        errorToHttpStatus(result.error),
      );
    }

    return c.json({
      data: {
        results: result.value.results,
        race_status: result.value.raceStatus,
      },
    });
  },
);

admin.post("/sync-results", async (c) => {
  const syncResult = await syncRaceResults({
    seasonRepository: createD1SeasonRepository(c.env),
    raceRepository: createD1RaceRepository(c.env),
    driverRepository: createD1DriverRepository(c.env),
    raceResultRepository: createD1RaceResultRepository(c.env),
    pickRepository: createD1PickRepository(c.env),
    userStatsRepository: createD1UserStatsRepository(c.env),
    f1ResultsFetcher: OpenF1ResultsFetcher,
    clock: { now: () => new Date() },
  });

  return c.json({
    data: {
      status: "ok",
      races_started: syncResult.started,
      races_synced: syncResult.synced,
      races_failed: syncResult.failed,
    },
  });
});

export default admin;
