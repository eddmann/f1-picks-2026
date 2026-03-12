import type { SeasonRepository } from "../repositories/interfaces/season.repository";
import type { PushSubscriptionRepository } from "../repositories/interfaces/push-subscription.repository";
import type { NotificationLogRepository } from "../repositories/interfaces/notification-log.repository";
import type { RaceRepository } from "../repositories/interfaces/race.repository";
import type { WebPushService, WebPushPayload } from "../services/web-push";
import { getPickWindowStatus, getPickDeadline } from "../../shared/pick-window";

export interface SendNotificationsDeps {
  pushSubscriptionRepository: PushSubscriptionRepository;
  notificationLogRepository: NotificationLogRepository;
  raceRepository: RaceRepository;
  webPushService: WebPushService;
}

export interface CheckPickNotificationsDeps extends SendNotificationsDeps {
  seasonRepository: SeasonRepository;
  clock: { now(): Date };
}

export interface SendNotificationResult {
  sent: number;
  failed: number;
  removed: number;
  skipped: boolean;
}

export interface CheckPickNotificationsResult {
  windowOpenNotifications: number;
  reminderNotifications: number;
}

async function sendToAll(
  deps: SendNotificationsDeps,
  type: string,
  raceId: number,
  getSubscriptions: () => ReturnType<
    PushSubscriptionRepository["getAllActive"]
  >,
  payload: WebPushPayload,
): Promise<SendNotificationResult> {
  const key = `${type}:${raceId}`;
  const alreadySent = await deps.notificationLogRepository.hasBeenSent(key);
  if (alreadySent) return { sent: 0, failed: 0, removed: 0, skipped: true };

  const subscriptions = await getSubscriptions();
  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, removed: 0, skipped: false };
  }

  let sent = 0;
  let failed = 0;
  let removed = 0;
  for (const sub of subscriptions) {
    const result = await deps.webPushService.sendNotification(
      { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
      payload,
    );
    if (result.gone) {
      await deps.pushSubscriptionRepository.deleteByEndpoint(sub.endpoint);
      removed++;
    }
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  await deps.notificationLogRepository.record(key);
  return { sent, failed, removed, skipped: false };
}

export async function sendRaceResultsNotification(
  deps: SendNotificationsDeps,
  raceId: number,
): Promise<SendNotificationResult> {
  const race = await deps.raceRepository.getById(raceId);
  if (!race) return { sent: 0, failed: 0, removed: 0, skipped: true };

  return sendToAll(
    deps,
    "race_results",
    raceId,
    () => deps.pushSubscriptionRepository.getAllActive(),
    {
      title: "Results are in!",
      body: `${race.name} results are ready. Check your points!`,
      url: `/race/${raceId}`,
      tag: `race-results-${raceId}`,
    },
  );
}

async function sendPickWindowOpenNotification(
  deps: SendNotificationsDeps,
  raceId: number,
): Promise<SendNotificationResult> {
  const race = await deps.raceRepository.getById(raceId);
  if (!race) return { sent: 0, failed: 0, removed: 0, skipped: true };

  return sendToAll(
    deps,
    "pick_window_open",
    raceId,
    () => deps.pushSubscriptionRepository.getAllActive(),
    {
      title: "Pick window open!",
      body: `Make your pick for ${race.name}`,
      url: "/pick",
      tag: `pick-window-${raceId}`,
    },
  );
}

async function sendPickReminderNotification(
  deps: SendNotificationsDeps,
  raceId: number,
): Promise<SendNotificationResult> {
  const race = await deps.raceRepository.getById(raceId);
  if (!race) return { sent: 0, failed: 0, removed: 0, skipped: true };

  return sendToAll(
    deps,
    "pick_reminder",
    raceId,
    () => deps.pushSubscriptionRepository.getForUsersWithoutPick(raceId),
    {
      title: "Pick closing soon!",
      body: `Pick for ${race.name} closes in ~2 hours!`,
      url: "/pick",
      tag: `pick-reminder-${raceId}`,
    },
  );
}

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export async function checkAndSendPickNotifications(
  deps: CheckPickNotificationsDeps,
): Promise<CheckPickNotificationsResult> {
  const season = await deps.seasonRepository.getActiveSeason();
  if (!season) return { windowOpenNotifications: 0, reminderNotifications: 0 };

  const races = await deps.raceRepository.getBySeasonId(season.id);
  const now = deps.clock.now();

  let windowOpenNotifications = 0;
  let reminderNotifications = 0;

  for (const race of races) {
    if (race.status === "completed") continue;

    const windowStatus = getPickWindowStatus(race, now);

    if (windowStatus.status === "open") {
      const openResult = await sendPickWindowOpenNotification(deps, race.id);
      if (!openResult.skipped) windowOpenNotifications++;

      const deadline = getPickDeadline(race);
      const timeUntilDeadline = deadline.getTime() - now.getTime();
      if (timeUntilDeadline > 0 && timeUntilDeadline <= TWO_HOURS_MS) {
        const reminderResult = await sendPickReminderNotification(
          deps,
          race.id,
        );
        if (!reminderResult.skipped) reminderNotifications++;
      }
    }
  }

  return { windowOpenNotifications, reminderNotifications };
}
