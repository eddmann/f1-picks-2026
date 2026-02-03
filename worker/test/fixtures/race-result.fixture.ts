/**
 * RaceResult test fixtures
 */

import type { RaceResult } from "../../../shared/types";
import { getRacePoints, getSprintPoints } from "../../../shared/scoring";

let raceResultIdCounter = 1;

export interface CreateRaceResultOptions {
  id?: number;
  raceId?: number;
  driverId?: number;
  racePosition?: number | null;
  sprintPosition?: number | null;
  racePoints?: number;
  sprintPoints?: number;
  createdAt?: string;
}

export function createRaceResult(
  options: CreateRaceResultOptions = {},
): RaceResult {
  const id = options.id ?? raceResultIdCounter++;
  const racePosition = options.racePosition ?? null;
  const sprintPosition = options.sprintPosition ?? null;

  return {
    id,
    race_id: options.raceId ?? 1,
    driver_id: options.driverId ?? 1,
    race_position: racePosition,
    sprint_position: sprintPosition,
    race_points: options.racePoints ?? getRacePoints(racePosition),
    sprint_points: options.sprintPoints ?? getSprintPoints(sprintPosition),
    created_at: options.createdAt ?? new Date().toISOString(),
  };
}

/**
 * Create race results for a complete grid
 * Optionally include sprint positions
 */
export function createRaceResults(
  raceId: number,
  driverIds: number[],
  options?: { includeSprint?: boolean },
): RaceResult[] {
  return driverIds.map((driverId, index) => {
    const position = index + 1;
    return createRaceResult({
      raceId,
      driverId,
      racePosition: position,
      sprintPosition: options?.includeSprint ? position : null,
    });
  });
}

export function resetRaceResultIdCounter(): void {
  raceResultIdCounter = 1;
}
