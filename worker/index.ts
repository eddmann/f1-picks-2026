import { Hono } from "hono";
import type { AppBindings } from "./types";
import auth from "./routes/auth";
import seasons from "./routes/seasons";
import drivers from "./routes/drivers";
import races from "./routes/races";
import picks from "./routes/picks";
import leaderboard from "./routes/leaderboard";
import admin from "./routes/admin";
import { syncRaceResults } from "./usecases/sync-race-results.usecase";
import { OpenF1ResultsFetcher } from "./services/openf1-results-fetcher";
import { createD1SeasonRepository } from "./repositories/d1/season.d1";
import { createD1RaceRepository } from "./repositories/d1/race.d1";
import { createD1DriverRepository } from "./repositories/d1/driver.d1";
import { createD1RaceResultRepository } from "./repositories/d1/race-result.d1";
import { createD1PickRepository } from "./repositories/d1/pick.d1";
import { createD1UserStatsRepository } from "./repositories/d1/user-stats.d1";

const app = new Hono<AppBindings>();

app.route("/api/auth", auth);
app.route("/api/seasons", seasons);
app.route("/api/drivers", drivers);
app.route("/api/races", races);
app.route("/api/picks", picks);
app.route("/api/leaderboard", leaderboard);
app.route("/api/admin", admin);

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.all("*", async (c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw as Request) as unknown as Response;
  }
  return c.json({ error: "Not found" }, 404);
});

export default {
  fetch: app.fetch,
  scheduled: (
    event: ScheduledEvent,
    env: AppBindings["Bindings"],
    ctx: ExecutionContext,
  ) => {
    void event;
    ctx.waitUntil(
      (async () => {
        await syncRaceResults({
          seasonRepository: createD1SeasonRepository(env),
          raceRepository: createD1RaceRepository(env),
          driverRepository: createD1DriverRepository(env),
          raceResultRepository: createD1RaceResultRepository(env),
          pickRepository: createD1PickRepository(env),
          userStatsRepository: createD1UserStatsRepository(env),
          f1ResultsFetcher: OpenF1ResultsFetcher,
          clock: { now: () => new Date() },
        });
      })(),
    );
  },
};
