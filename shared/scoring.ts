// F1 Points System
// Race: 25-18-15-12-10-8-6-4-2-1 (positions 1-10)
// Sprint: 8-7-6-5-4-3-2-1 (positions 1-8)

const RACE_POINTS: Record<number, number> = {
  1: 25,
  2: 18,
  3: 15,
  4: 12,
  5: 10,
  6: 8,
  7: 6,
  8: 4,
  9: 2,
  10: 1,
};

const SPRINT_POINTS: Record<number, number> = {
  1: 8,
  2: 7,
  3: 6,
  4: 5,
  5: 4,
  6: 3,
  7: 2,
  8: 1,
};

export function getRacePoints(position: number | null): number {
  if (position === null || position < 1 || position > 10) {
    return 0;
  }
  return RACE_POINTS[position] ?? 0;
}

export function getSprintPoints(position: number | null): number {
  if (position === null || position < 1 || position > 8) {
    return 0;
  }
  return SPRINT_POINTS[position] ?? 0;
}

export function getTotalPoints(
  racePosition: number | null,
  sprintPosition: number | null
): number {
  return getRacePoints(racePosition) + getSprintPoints(sprintPosition);
}
