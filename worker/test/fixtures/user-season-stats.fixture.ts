import type { UserSeasonStats } from "../../../shared/types";

let statsIdCounter = 1;

export interface CreateUserSeasonStatsOptions {
  id?: number;
  userId?: number;
  seasonId?: number;
  totalPoints?: number;
  racesCompleted?: number;
  createdAt?: string;
}

export function createUserSeasonStats(
  options: CreateUserSeasonStatsOptions = {},
): UserSeasonStats {
  const id = options.id ?? statsIdCounter++;
  return {
    id,
    user_id: options.userId ?? 1,
    season_id: options.seasonId ?? 1,
    total_points: options.totalPoints ?? 0,
    races_completed: options.racesCompleted ?? 0,
    created_at: options.createdAt ?? new Date().toISOString(),
  };
}

export function resetUserSeasonStatsIdCounter(): void {
  statsIdCounter = 1;
}
