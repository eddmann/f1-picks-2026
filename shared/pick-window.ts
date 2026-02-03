export interface RaceForPickWindow {
  quali_time: string;
  sprint_quali_time: string | null;
  has_sprint: boolean;
}

/**
 * Get the Monday 00:00 UTC of the week containing the given date
 */
export function getWeekStartMonday(date: string | Date): Date {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  const day = d.getUTCDay();
  const daysToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(d);
  monday.setUTCDate(monday.getUTCDate() - daysToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

/**
 * Get the pick deadline (10 minutes before qualifying session)
 * For sprint weekends: 10 mins before Sprint Qualifying
 * For normal weekends: 10 mins before Qualifying
 */
export function getPickDeadline(race: RaceForPickWindow): Date {
  const deadlineSession =
    race.has_sprint && race.sprint_quali_time
      ? new Date(race.sprint_quali_time)
      : new Date(race.quali_time);
  return new Date(deadlineSession.getTime() - 10 * 60 * 1000);
}

export type PickWindowStatus = "too_early" | "open" | "locked";

/**
 * Get the current pick window status for a race
 */
export function getPickWindowStatus(
  race: RaceForPickWindow,
  now: Date = new Date()
): {
  status: PickWindowStatus;
  opensAt: Date;
  closesAt: Date;
  deadlineSession: "qualifying" | "sprint_qualifying";
} {
  const quali = new Date(race.quali_time);
  const opensAt = getWeekStartMonday(quali);
  const closesAt = getPickDeadline(race);
  const deadlineSession =
    race.has_sprint && race.sprint_quali_time
      ? "sprint_qualifying"
      : "qualifying";

  let status: PickWindowStatus;
  if (now < opensAt) {
    status = "too_early";
  } else if (now >= closesAt) {
    status = "locked";
  } else {
    status = "open";
  }

  return { status, opensAt, closesAt, deadlineSession };
}

export type PickWindowResult = {
  isOpen: boolean;
  reason?: "too_early" | "too_late";
  opensAt?: Date;
  closesAt?: Date;
  deadlineSession?: "qualifying" | "sprint_qualifying";
};

/**
 * Check if pick window is currently open for a race
 */
export function checkPickWindow(
  race: RaceForPickWindow,
  now: Date = new Date()
): PickWindowResult {
  const qualiTime = new Date(race.quali_time);
  const windowOpens = getWeekStartMonday(qualiTime);
  const windowCloses = getPickDeadline(race);
  const deadlineSession =
    race.has_sprint && race.sprint_quali_time
      ? "sprint_qualifying"
      : "qualifying";

  if (now < windowOpens) {
    return {
      isOpen: false,
      reason: "too_early",
      opensAt: windowOpens,
      deadlineSession,
    };
  }
  if (now >= windowCloses) {
    return {
      isOpen: false,
      reason: "too_late",
      closesAt: windowCloses,
      deadlineSession,
    };
  }
  return { isOpen: true, closesAt: windowCloses, deadlineSession };
}

/**
 * Check if pick window is currently open
 */
export function isPickWindowOpen(
  race: RaceForPickWindow,
  now: Date = new Date()
): boolean {
  return getPickWindowStatus(race, now).status === "open";
}
