/**
 * Test setup utilities
 */

import type {
  User,
  Session,
  Season,
  Driver,
  Race,
  Pick,
  RaceResult,
  UserSeasonStats,
} from "../../shared/types";

/**
 * In-memory store for test data
 */
export interface TestStore {
  users: User[];
  sessions: Session[];
  seasons: Season[];
  drivers: Driver[];
  races: Race[];
  picks: Pick[];
  raceResults: RaceResult[];
  userSeasonStats: UserSeasonStats[];
}

/**
 * Create a fresh test store
 */
export function createTestStore(): TestStore {
  return {
    users: [],
    sessions: [],
    seasons: [],
    drivers: [],
    races: [],
    picks: [],
    raceResults: [],
    userSeasonStats: [],
  };
}

/**
 * Test context with store and clock
 */
export interface TestContext {
  store: TestStore;
  clock: { now(): Date };
}

/**
 * Create a test context with optional clock override
 */
export function createTestContext(options?: {
  clock?: { now(): Date };
}): TestContext {
  return {
    store: createTestStore(),
    clock: options?.clock ?? { now: () => new Date() },
  };
}

/**
 * Seed test data helper
 */
export function seedTestStore(
  store: TestStore,
  data: Partial<TestStore>,
): void {
  if (data.users) store.users.push(...data.users);
  if (data.sessions) store.sessions.push(...data.sessions);
  if (data.seasons) store.seasons.push(...data.seasons);
  if (data.drivers) store.drivers.push(...data.drivers);
  if (data.races) store.races.push(...data.races);
  if (data.picks) store.picks.push(...data.picks);
  if (data.raceResults) store.raceResults.push(...data.raceResults);
  if (data.userSeasonStats) store.userSeasonStats.push(...data.userSeasonStats);
}
