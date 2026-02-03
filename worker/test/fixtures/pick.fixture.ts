/**
 * Pick test fixtures
 */

import type { Pick } from "../../../shared/types";

let pickIdCounter = 1;

export interface CreatePickOptions {
  id?: number;
  userId?: number;
  raceId?: number;
  driverId?: number;
  createdAt?: string;
}

export function createPick(options: CreatePickOptions = {}): Pick {
  const id = options.id ?? pickIdCounter++;
  return {
    id,
    user_id: options.userId ?? 1,
    race_id: options.raceId ?? 1,
    driver_id: options.driverId ?? 1,
    created_at: options.createdAt ?? new Date().toISOString(),
  };
}

export function createPicks(
  count: number,
  options: CreatePickOptions = {},
): Pick[] {
  return Array.from({ length: count }, (_, i) =>
    createPick({
      ...options,
      raceId: (options.raceId ?? 1) + i,
      driverId: (options.driverId ?? 1) + i,
    }),
  );
}

export function resetPickIdCounter(): void {
  pickIdCounter = 1;
}
