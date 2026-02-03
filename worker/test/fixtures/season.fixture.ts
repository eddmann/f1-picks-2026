/**
 * Season test fixtures
 */

import type { Season } from "../../../shared/types";

let seasonIdCounter = 1;

export interface CreateSeasonOptions {
  id?: number;
  year?: number;
  name?: string;
  isActive?: boolean;
  createdAt?: string;
}

export function createSeason(options: CreateSeasonOptions = {}): Season {
  const id = options.id ?? seasonIdCounter++;
  const year = options.year ?? 2026;
  return {
    id,
    year,
    name: options.name ?? `${year} Season`,
    is_active: options.isActive ?? true,
    created_at: options.createdAt ?? new Date().toISOString(),
  };
}

export function createInactiveSeason(
  options: CreateSeasonOptions = {},
): Season {
  return createSeason({ ...options, isActive: false });
}

export function resetSeasonIdCounter(): void {
  seasonIdCounter = 1;
}
