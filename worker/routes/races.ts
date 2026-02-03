import { Hono } from "hono";
import type { AppBindings } from "../types";
import { getRaces } from "../usecases/get-races.usecase";
import { getCurrentRace } from "../usecases/get-current-race.usecase";
import { getRace } from "../usecases/get-race.usecase";
import { getRaceResults } from "../usecases/get-race-results.usecase";
import { createD1SeasonRepository } from "../repositories/d1/season.d1";
import { createD1RaceRepository } from "../repositories/d1/race.d1";
import { createD1RaceResultRepository } from "../repositories/d1/race-result.d1";
import { createD1DriverRepository } from "../repositories/d1/driver.d1";
import { createD1PickRepository } from "../repositories/d1/pick.d1";
import { errorToHttpStatus, errorToMessage } from "../usecases/errors";
import { convertRace } from "../utils/transforms";

const races = new Hono<AppBindings>();

races.get("/", async (c) => {
  const seasonRepository = createD1SeasonRepository(c.env);
  const raceRepository = createD1RaceRepository(c.env);

  const result = await getRaces({ seasonRepository, raceRepository });

  if (!result.ok) {
    return c.json(
      { error: errorToMessage(result.error) },
      errorToHttpStatus(result.error),
    );
  }

  return c.json({
    data: { races: result.value.races.map(convertRace) },
  });
});

races.get("/current", async (c) => {
  const seasonRepository = createD1SeasonRepository(c.env);
  const raceRepository = createD1RaceRepository(c.env);

  const result = await getCurrentRace({ seasonRepository, raceRepository });

  if (!result.ok) {
    return c.json(
      { error: errorToMessage(result.error) },
      errorToHttpStatus(result.error),
    );
  }

  return c.json({
    data: { race: convertRace(result.value.race) },
  });
});

races.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const raceRepository = createD1RaceRepository(c.env);

  const result = await getRace({ raceRepository }, { raceId: id });

  if (!result.ok) {
    return c.json(
      { error: errorToMessage(result.error) },
      errorToHttpStatus(result.error),
    );
  }

  return c.json({
    data: { race: convertRace(result.value.race) },
  });
});

races.get("/:id/results", async (c) => {
  const id = parseInt(c.req.param("id"), 10);

  const raceRepository = createD1RaceRepository(c.env);
  const raceResultRepository = createD1RaceResultRepository(c.env);
  const driverRepository = createD1DriverRepository(c.env);
  const pickRepository = createD1PickRepository(c.env);

  const result = await getRaceResults(
    { raceRepository, raceResultRepository, driverRepository, pickRepository },
    { raceId: id },
  );

  if (!result.ok) {
    return c.json(
      { error: errorToMessage(result.error) },
      errorToHttpStatus(result.error),
    );
  }

  return c.json({
    data: {
      race: convertRace(result.value.race),
      results: result.value.results,
      picks: result.value.picks,
    },
  });
});

export default races;
