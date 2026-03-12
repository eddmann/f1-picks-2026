import { Hono } from "hono";
import type { AppBindings } from "./types";
import auth from "./routes/auth";
import seasons from "./routes/seasons";
import drivers from "./routes/drivers";
import races from "./routes/races";
import picks from "./routes/picks";
import leaderboard from "./routes/leaderboard";
import admin from "./routes/admin";
import notifications from "./routes/notifications";
import { syncRaceResults } from "./usecases/sync-race-results.usecase";
import {
  sendRaceResultsNotification,
  checkAndSendPickNotifications,
} from "./usecases/send-notifications.usecase";
import { OpenF1ResultsFetcher } from "./services/openf1-results-fetcher";
import { createWebPushService } from "./services/web-push";
import { createD1SeasonRepository } from "./repositories/d1/season.d1";
import { createD1RaceRepository } from "./repositories/d1/race.d1";
import { createD1DriverRepository } from "./repositories/d1/driver.d1";
import { createD1RaceResultRepository } from "./repositories/d1/race-result.d1";
import { createD1PickRepository } from "./repositories/d1/pick.d1";
import { createD1UserStatsRepository } from "./repositories/d1/user-stats.d1";
import { createD1PushSubscriptionRepository } from "./repositories/d1/push-subscription.d1";
import { createD1NotificationLogRepository } from "./repositories/d1/notification-log.d1";

const app = new Hono<AppBindings>();

app.route("/api/auth", auth);
app.route("/api/seasons", seasons);
app.route("/api/drivers", drivers);
app.route("/api/races", races);
app.route("/api/picks", picks);
app.route("/api/leaderboard", leaderboard);
app.route("/api/admin", admin);
app.route("/api/notifications", notifications);

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
        const raceRepository = createD1RaceRepository(env);
        const pushSubscriptionRepository =
          createD1PushSubscriptionRepository(env);
        const notificationLogRepository =
          createD1NotificationLogRepository(env);
        const webPushService = createWebPushService(
          env.VAPID_PUBLIC_KEY,
          env.VAPID_PRIVATE_KEY,
          env.VAPID_SUBJECT,
        );

        // Sync race results
        const result = await syncRaceResults({
          seasonRepository: createD1SeasonRepository(env),
          raceRepository,
          driverRepository: createD1DriverRepository(env),
          raceResultRepository: createD1RaceResultRepository(env),
          pickRepository: createD1PickRepository(env),
          userStatsRepository: createD1UserStatsRepository(env),
          f1ResultsFetcher: OpenF1ResultsFetcher,
          clock: { now: () => new Date() },
        });

        // Send results notifications for newly completed races
        const notifDeps = {
          pushSubscriptionRepository,
          notificationLogRepository,
          raceRepository,
          webPushService,
        };
        for (const raceId of result.synced) {
          await sendRaceResultsNotification(notifDeps, raceId);
        }

        // Check pick windows → open notifications + reminders
        await checkAndSendPickNotifications({
          seasonRepository: createD1SeasonRepository(env),
          raceRepository,
          pushSubscriptionRepository,
          notificationLogRepository,
          webPushService,
          clock: { now: () => new Date() },
        });
      })(),
    );
  },
};
