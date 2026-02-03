import type { SeasonRepository } from "../repositories/interfaces/season.repository";
import type { RaceRepository } from "../repositories/interfaces/race.repository";
import type { DriverRepository } from "../repositories/interfaces/driver.repository";
import type { RaceResultRepository } from "../repositories/interfaces/race-result.repository";
import type { PickRepository } from "../repositories/interfaces/pick.repository";
import type { UserStatsRepository } from "../repositories/interfaces/user-stats.repository";
import type { F1ResultsFetcher } from "../services/f1-results-fetcher";
import { getRacePoints, getSprintPoints } from "../../shared/scoring";

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;

function pickEarliestDate(
  values: Array<string | null | undefined>,
): Date | null {
  const dates = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()));

  if (dates.length === 0) {
    return null;
  }

  return dates.reduce((earliest, current) =>
    current.getTime() < earliest.getTime() ? current : earliest,
  );
}

export interface SyncRaceResultsDeps {
  seasonRepository: SeasonRepository;
  raceRepository: RaceRepository;
  driverRepository: DriverRepository;
  raceResultRepository: RaceResultRepository;
  pickRepository: PickRepository;
  userStatsRepository: UserStatsRepository;
  f1ResultsFetcher: F1ResultsFetcher;
  clock: { now(): Date };
}

export interface SyncRaceResultsResult {
  started: number;
  synced: number[];
  failed: number[];
}

export async function syncRaceResults(
  deps: SyncRaceResultsDeps,
): Promise<SyncRaceResultsResult> {
  const season = await deps.seasonRepository.getActiveSeason();
  if (!season) {
    return { started: 0, synced: [], failed: [] };
  }

  const [races, drivers] = await Promise.all([
    deps.raceRepository.getBySeasonId(season.id),
    deps.driverRepository.getBySeasonId(season.id),
  ]);

  const now = deps.clock.now();
  const fetcher = deps.f1ResultsFetcher;

  let started = 0;
  for (const race of races) {
    if (race.status !== "upcoming") continue;

    const startTime = pickEarliestDate([
      race.sprint_quali_time,
      race.quali_time,
      race.sprint_time,
      race.race_time,
    ]);

    if (startTime && now >= startTime) {
      await deps.raceRepository.updateStatus(race.id, "in_progress");
      started++;
    }
  }

  const synced: number[] = [];
  const failed: number[] = [];
  const validDriverIds = new Set(drivers.map((driver) => driver.id));

  for (const race of races) {
    if (race.status === "completed") continue;

    const raceTime = new Date(race.race_time);
    if (Number.isNaN(raceTime.getTime())) {
      failed.push(race.id);
      continue;
    }

    const syncTime = new Date(raceTime.getTime() + FIVE_HOURS_MS);
    if (now < syncTime) continue;

    const f1Result = await fetcher.fetchResults(season.year, {
      name: race.name,
      country_code: race.country_code,
    });

    if (!f1Result.ok || f1Result.results.length === 0) {
      failed.push(race.id);
      continue;
    }

    const driverIdByNumber = new Map(
      drivers.map((driver) => [driver.number, driver.id]),
    );
    const unknownDriverNumbers = new Set<number>();
    const results: Array<{
      driver_id: number;
      race_position: number | null;
      sprint_position: number | null;
    }> = [];

    for (const result of f1Result.results) {
      const driverId = driverIdByNumber.get(result.driver_number);
      if (!driverId) {
        unknownDriverNumbers.add(result.driver_number);
        continue;
      }
      if (!validDriverIds.has(driverId)) {
        unknownDriverNumbers.add(result.driver_number);
        continue;
      }
      results.push({
        driver_id: driverId,
        race_position: result.race_position,
        sprint_position: result.sprint_position,
      });
    }

    if (unknownDriverNumbers.size > 0) {
      failed.push(race.id);
      continue;
    }

    if (results.length === 0) {
      failed.push(race.id);
      continue;
    }

    if (!race.has_sprint) {
      const hasSprintData = results.some(
        (result) =>
          result.sprint_position !== undefined &&
          result.sprint_position !== null,
      );
      if (hasSprintData) {
        failed.push(race.id);
        continue;
      }
    }

    for (const result of results) {
      const racePoints = getRacePoints(result.race_position);
      const sprintPoints = getSprintPoints(result.sprint_position ?? null);

      await deps.raceResultRepository.upsert(
        race.id,
        result.driver_id,
        result.race_position,
        result.sprint_position ?? null,
        racePoints,
        sprintPoints,
      );
    }

    await deps.raceRepository.updateStatus(race.id, "completed");

    const picks = await deps.pickRepository.getForRace(race.id);
    const userIds = new Set(picks.map((p) => p.user_id));

    for (const userId of userIds) {
      const stats = await deps.userStatsRepository.calculateUserPoints(
        userId,
        season.id,
      );
      await deps.userStatsRepository.upsert(
        userId,
        season.id,
        stats.totalPoints,
        stats.racesCompleted,
      );
    }

    synced.push(race.id);
  }

  return { started, synced, failed };
}
