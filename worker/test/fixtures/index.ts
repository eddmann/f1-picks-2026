export * from "./user.fixture";
export * from "./session.fixture";
export * from "./season.fixture";
export * from "./driver.fixture";
export * from "./race.fixture";
export * from "./pick.fixture";
export * from "./race-result.fixture";
export * from "./user-season-stats.fixture";

// Reset all counters for clean test isolation
import { resetUserIdCounter } from "./user.fixture";
import { resetSessionIdCounter } from "./session.fixture";
import { resetSeasonIdCounter } from "./season.fixture";
import { resetDriverIdCounter } from "./driver.fixture";
import { resetRaceIdCounter } from "./race.fixture";
import { resetPickIdCounter } from "./pick.fixture";
import { resetRaceResultIdCounter } from "./race-result.fixture";
import { resetUserSeasonStatsIdCounter } from "./user-season-stats.fixture";

export function resetAllFixtureCounters(): void {
  resetUserIdCounter();
  resetSessionIdCounter();
  resetSeasonIdCounter();
  resetDriverIdCounter();
  resetRaceIdCounter();
  resetPickIdCounter();
  resetRaceResultIdCounter();
  resetUserSeasonStatsIdCounter();
}
