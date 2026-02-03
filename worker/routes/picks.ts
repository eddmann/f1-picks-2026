import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppBindings } from "../types";
import { authMiddleware } from "../middleware/auth";
import { getUserPicks } from "../usecases/get-user-picks.usecase";
import { createPick } from "../usecases/create-pick.usecase";
import { createD1SeasonRepository } from "../repositories/d1/season.d1";
import { createD1RaceRepository } from "../repositories/d1/race.d1";
import { createD1DriverRepository } from "../repositories/d1/driver.d1";
import { createD1PickRepository } from "../repositories/d1/pick.d1";
import { createD1RaceResultRepository } from "../repositories/d1/race-result.d1";
import { errorToHttpStatus, errorToMessage } from "../usecases/errors";
import { convertRace } from "../utils/transforms";

const picks = new Hono<AppBindings>();

picks.use("*", authMiddleware);

const pickSchema = z.object({
  race_id: z.number().int().positive(),
  driver_id: z.number().int().positive(),
});

picks.get("/", async (c) => {
  const user = c.get("user");

  const result = await getUserPicks(
    {
      seasonRepository: createD1SeasonRepository(c.env),
      pickRepository: createD1PickRepository(c.env),
      raceRepository: createD1RaceRepository(c.env),
      driverRepository: createD1DriverRepository(c.env),
      raceResultRepository: createD1RaceResultRepository(c.env),
    },
    { userId: user.id },
  );

  if (!result.ok) {
    return c.json(
      { error: errorToMessage(result.error) },
      errorToHttpStatus(result.error),
    );
  }

  const picks = result.value.picks.map((pick) => ({
    ...pick,
    race: pick.race ? convertRace(pick.race) : null,
  }));

  return c.json({
    data: { picks },
  });
});

picks.post("/", zValidator("json", pickSchema), async (c) => {
  const user = c.get("user");
  const body = c.req.valid("json");

  const result = await createPick(
    {
      seasonRepository: createD1SeasonRepository(c.env),
      raceRepository: createD1RaceRepository(c.env),
      driverRepository: createD1DriverRepository(c.env),
      pickRepository: createD1PickRepository(c.env),
    },
    {
      userId: user.id,
      raceId: body.race_id,
      driverId: body.driver_id,
    },
  );

  if (!result.ok) {
    if (result.error.code === "PICK_WINDOW_CLOSED") {
      if (result.error.reason === "too_early") {
        return c.json(
          {
            error: "Pick window not yet open. Opens Monday of race week.",
            opens_at: result.error.opensAt?.toISOString(),
          },
          400,
        );
      }
      return c.json({ error: "Picks are locked for this race" }, 400);
    }
    if (result.error.code === "DRIVER_UNAVAILABLE") {
      return c.json({ error: "Driver already used in another race" }, 400);
    }
    return c.json(
      { error: errorToMessage(result.error) },
      errorToHttpStatus(result.error),
    );
  }

  return c.json({
    data: {
      pick: {
        ...result.value.pick,
        driver: result.value.driver,
        race: convertRace(result.value.race),
      },
    },
  });
});

export default picks;
