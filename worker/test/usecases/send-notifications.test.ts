import { describe, test, expect, beforeEach } from "bun:test";
import {
  sendRaceResultsNotification,
  checkAndSendPickNotifications,
} from "../../usecases/send-notifications.usecase";
import { createMemorySeasonRepository } from "../../repositories/memory/season.memory";
import { createMemoryRaceRepository } from "../../repositories/memory/race.memory";
import { createMemoryPushSubscriptionRepository } from "../../repositories/memory/push-subscription.memory";
import { createMemoryNotificationLogRepository } from "../../repositories/memory/notification-log.memory";
import { createTestStore, seedTestStore } from "../setup";
import type { WebPushService, WebPushResult } from "../../services/web-push";
import {
  createSeason,
  createRace,
  createUser,
  createPick,
  createPushSubscription,
  createNotificationLog,
  resetAllFixtureCounters,
} from "../fixtures";

function createSuccessWebPush(): WebPushService & { calls: number } {
  const service = {
    calls: 0,
    async sendNotification(): Promise<WebPushResult> {
      service.calls++;
      return { success: true, statusCode: 201, gone: false };
    },
  };
  return service;
}

function createGoneWebPush(): WebPushService {
  return {
    async sendNotification(): Promise<WebPushResult> {
      return { success: false, statusCode: 410, gone: true };
    },
  };
}

describe("sendRaceResultsNotification", () => {
  beforeEach(() => {
    resetAllFixtureCounters();
  });

  function createDeps(store: ReturnType<typeof createTestStore>) {
    return {
      pushSubscriptionRepository: createMemoryPushSubscriptionRepository(store),
      notificationLogRepository: createMemoryNotificationLogRepository(store),
      raceRepository: createMemoryRaceRepository(store),
    };
  }

  test("sends to all active subscriptions and logs", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, isActive: true });
    const race = createRace({ id: 1, seasonId: 1, status: "completed" });
    const sub1 = createPushSubscription({ userId: 1 });
    const sub2 = createPushSubscription({ userId: 2 });

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      pushSubscriptions: [sub1, sub2],
    });

    const webPush = createSuccessWebPush();
    const result = await sendRaceResultsNotification(
      { ...createDeps(store), webPushService: webPush },
      race.id,
    );

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.skipped).toBe(false);
    expect(webPush.calls).toBe(2);
    expect(store.notificationLogs).toHaveLength(1);
    expect(store.notificationLogs[0].key).toBe(`race_results:${race.id}`);
  });

  test("skips if already sent (idempotent)", async () => {
    const store = createTestStore();
    const race = createRace({ id: 1, seasonId: 1 });
    const sub = createPushSubscription({ userId: 1 });
    const log = createNotificationLog({
      key: "race_results:1",
    });

    seedTestStore(store, {
      races: [race],
      pushSubscriptions: [sub],
      notificationLogs: [log],
    });

    const webPush = createSuccessWebPush();
    const result = await sendRaceResultsNotification(
      { ...createDeps(store), webPushService: webPush },
      race.id,
    );

    expect(result.skipped).toBe(true);
    expect(result.sent).toBe(0);
    expect(webPush.calls).toBe(0);
    expect(store.notificationLogs).toHaveLength(1);
  });

  test("removes gone subscriptions on 410", async () => {
    const store = createTestStore();
    const race = createRace({ id: 1, seasonId: 1 });
    const sub = createPushSubscription({ userId: 1 });

    seedTestStore(store, {
      races: [race],
      pushSubscriptions: [sub],
    });

    const result = await sendRaceResultsNotification(
      { ...createDeps(store), webPushService: createGoneWebPush() },
      race.id,
    );

    expect(result.removed).toBe(1);
    expect(result.sent).toBe(0);
    expect(result.failed).toBe(1);
    expect(store.pushSubscriptions).toHaveLength(0);
  });

  test("skips when race not found", async () => {
    const store = createTestStore();
    const webPush = createSuccessWebPush();

    const result = await sendRaceResultsNotification(
      { ...createDeps(store), webPushService: webPush },
      999,
    );

    expect(result.skipped).toBe(true);
    expect(webPush.calls).toBe(0);
  });

  test("returns zero sent when no subscriptions exist", async () => {
    const store = createTestStore();
    const race = createRace({ id: 1, seasonId: 1 });

    seedTestStore(store, { races: [race] });

    const webPush = createSuccessWebPush();
    const result = await sendRaceResultsNotification(
      { ...createDeps(store), webPushService: webPush },
      race.id,
    );

    expect(result.sent).toBe(0);
    expect(result.skipped).toBe(false);
    expect(webPush.calls).toBe(0);
  });
});

describe("checkAndSendPickNotifications", () => {
  beforeEach(() => {
    resetAllFixtureCounters();
  });

  function createDeps(store: ReturnType<typeof createTestStore>) {
    return {
      seasonRepository: createMemorySeasonRepository(store),
      raceRepository: createMemoryRaceRepository(store),
      pushSubscriptionRepository: createMemoryPushSubscriptionRepository(store),
      notificationLogRepository: createMemoryNotificationLogRepository(store),
    };
  }

  test("sends window-open notification when pick window is open", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, isActive: true });
    // Quali on Friday, race on Sunday
    const race = createRace({
      id: 1,
      seasonId: 1,
      status: "upcoming",
      qualiTime: "2026-03-13T15:00:00Z",
      raceTime: "2026-03-15T14:00:00Z",
    });
    const sub = createPushSubscription({ userId: 1 });

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      pushSubscriptions: [sub],
    });

    const webPush = createSuccessWebPush();
    // Wednesday of race week — window is open, deadline far away
    const now = new Date("2026-03-11T12:00:00Z");

    const result = await checkAndSendPickNotifications({
      ...createDeps(store),
      webPushService: webPush,
      clock: { now: () => now },
    });

    expect(result.windowOpenNotifications).toBe(1);
    expect(result.reminderNotifications).toBe(0);
    expect(store.notificationLogs).toHaveLength(1);
    expect(store.notificationLogs[0].key).toBe("pick_window_open:1");
  });

  test("sends reminder when deadline is within 2 hours", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, isActive: true });
    const race = createRace({
      id: 1,
      seasonId: 1,
      status: "upcoming",
      qualiTime: "2026-03-13T15:00:00Z",
      raceTime: "2026-03-15T14:00:00Z",
    });
    const sub = createPushSubscription({ userId: 1 });

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      pushSubscriptions: [sub],
    });

    const webPush = createSuccessWebPush();
    // 1 hour before deadline (quali - 10min = 14:50, now = 13:50)
    const now = new Date("2026-03-13T13:50:00Z");

    const result = await checkAndSendPickNotifications({
      ...createDeps(store),
      webPushService: webPush,
      clock: { now: () => now },
    });

    expect(result.windowOpenNotifications).toBe(1);
    expect(result.reminderNotifications).toBe(1);
    expect(store.notificationLogs).toHaveLength(2);
  });

  test("does not send for completed races", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, isActive: true });
    const race = createRace({
      id: 1,
      seasonId: 1,
      status: "completed",
      qualiTime: "2026-03-13T15:00:00Z",
      raceTime: "2026-03-15T14:00:00Z",
    });
    const sub = createPushSubscription({ userId: 1 });

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      pushSubscriptions: [sub],
    });

    const webPush = createSuccessWebPush();
    const result = await checkAndSendPickNotifications({
      ...createDeps(store),
      webPushService: webPush,
      clock: { now: () => new Date("2026-03-11T12:00:00Z") },
    });

    expect(result.windowOpenNotifications).toBe(0);
    expect(result.reminderNotifications).toBe(0);
    expect(webPush.calls).toBe(0);
  });

  test("does not send when pick window is not yet open", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, isActive: true });
    const race = createRace({
      id: 1,
      seasonId: 1,
      status: "upcoming",
      qualiTime: "2026-03-13T15:00:00Z",
      raceTime: "2026-03-15T14:00:00Z",
    });
    const sub = createPushSubscription({ userId: 1 });

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      pushSubscriptions: [sub],
    });

    const webPush = createSuccessWebPush();
    // Sunday before race week — window not open yet
    const now = new Date("2026-03-08T12:00:00Z");

    const result = await checkAndSendPickNotifications({
      ...createDeps(store),
      webPushService: webPush,
      clock: { now: () => now },
    });

    expect(result.windowOpenNotifications).toBe(0);
    expect(result.reminderNotifications).toBe(0);
    expect(webPush.calls).toBe(0);
  });

  test("reminder only sends to users without a pick", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, isActive: true });
    const race = createRace({
      id: 1,
      seasonId: 1,
      status: "upcoming",
      qualiTime: "2026-03-13T15:00:00Z",
      raceTime: "2026-03-15T14:00:00Z",
    });
    const user1 = createUser({ id: 1 });
    const user2 = createUser({ id: 2 });
    const sub1 = createPushSubscription({ userId: 1 });
    const sub2 = createPushSubscription({ userId: 2 });
    // User 1 already picked
    const pick = createPick({ userId: 1, raceId: 1 });

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      users: [user1, user2],
      pushSubscriptions: [sub1, sub2],
      picks: [pick],
    });

    const webPush = createSuccessWebPush();
    // 1 hour before deadline — triggers both window-open and reminder
    const now = new Date("2026-03-13T13:50:00Z");

    const result = await checkAndSendPickNotifications({
      ...createDeps(store),
      webPushService: webPush,
      clock: { now: () => now },
    });

    expect(result.reminderNotifications).toBe(1);
    // window-open sends to both (2), reminder only to user2 (1) = 3 total
    expect(webPush.calls).toBe(3);
  });

  test("returns zeros when no active season", async () => {
    const store = createTestStore();
    const webPush = createSuccessWebPush();

    const result = await checkAndSendPickNotifications({
      ...createDeps(store),
      webPushService: webPush,
      clock: { now: () => new Date() },
    });

    expect(result.windowOpenNotifications).toBe(0);
    expect(result.reminderNotifications).toBe(0);
  });
});
