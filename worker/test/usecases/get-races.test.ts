import { describe, test, expect, beforeEach } from "bun:test";
import { getRaces } from "../../usecases/get-races.usecase";
import { getCurrentRace } from "../../usecases/get-current-race.usecase";
import { getRace } from "../../usecases/get-race.usecase";
import { createMemorySeasonRepository } from "../../repositories/memory/season.memory";
import { createMemoryRaceRepository } from "../../repositories/memory/race.memory";
import { createTestStore, seedTestStore } from "../setup";
import {
  createSeason,
  createRace,
  createRaces,
  createCompletedRace,
  resetAllFixtureCounters,
} from "../fixtures";

describe("getRaces", () => {
  beforeEach(() => {
    resetAllFixtureCounters();
  });

  test("returns races for the active season", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, year: 2026 });
    const races = createRaces(5, { seasonId: 1 });

    seedTestStore(store, { seasons: [season], races });

    const seasonRepository = createMemorySeasonRepository(store);
    const raceRepository = createMemoryRaceRepository(store);

    const result = await getRaces({ seasonRepository, raceRepository });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.races.length).toBe(5);
    }
  });

  test("returns NOT_FOUND when no active season", async () => {
    const store = createTestStore();
    const seasonRepository = createMemorySeasonRepository(store);
    const raceRepository = createMemoryRaceRepository(store);

    const result = await getRaces({ seasonRepository, raceRepository });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  test("races are sorted by round", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, year: 2026 });
    const races = [
      createRace({ id: 3, seasonId: 1, round: 3 }),
      createRace({ id: 1, seasonId: 1, round: 1 }),
      createRace({ id: 2, seasonId: 1, round: 2 }),
    ];

    seedTestStore(store, { seasons: [season], races });

    const seasonRepository = createMemorySeasonRepository(store);
    const raceRepository = createMemoryRaceRepository(store);

    const result = await getRaces({ seasonRepository, raceRepository });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.races[0].round).toBe(1);
      expect(result.value.races[1].round).toBe(2);
      expect(result.value.races[2].round).toBe(3);
    }
  });
});

describe("getCurrentRace", () => {
  beforeEach(() => {
    resetAllFixtureCounters();
  });

  test("returns first upcoming race", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, year: 2026 });
    const races = [
      createCompletedRace({ id: 1, seasonId: 1, round: 1 }),
      createRace({ id: 2, seasonId: 1, round: 2, status: "upcoming" }),
      createRace({ id: 3, seasonId: 1, round: 3, status: "upcoming" }),
    ];

    seedTestStore(store, { seasons: [season], races });

    const seasonRepository = createMemorySeasonRepository(store);
    const raceRepository = createMemoryRaceRepository(store);

    const result = await getCurrentRace({ seasonRepository, raceRepository });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.race.id).toBe(2);
      expect(result.value.race.round).toBe(2);
    }
  });

  test("returns in_progress race over upcoming", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, year: 2026 });
    const races = [
      createCompletedRace({ id: 1, seasonId: 1, round: 1 }),
      createRace({ id: 2, seasonId: 1, round: 2, status: "in_progress" }),
      createRace({ id: 3, seasonId: 1, round: 3, status: "upcoming" }),
    ];

    seedTestStore(store, { seasons: [season], races });

    const seasonRepository = createMemorySeasonRepository(store);
    const raceRepository = createMemoryRaceRepository(store);

    const result = await getCurrentRace({ seasonRepository, raceRepository });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.race.id).toBe(2);
      expect(result.value.race.status).toBe("in_progress");
    }
  });

  test("returns last race when all completed", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, year: 2026 });
    const races = [
      createCompletedRace({ id: 1, seasonId: 1, round: 1 }),
      createCompletedRace({ id: 2, seasonId: 1, round: 2 }),
      createCompletedRace({ id: 3, seasonId: 1, round: 3 }),
    ];

    seedTestStore(store, { seasons: [season], races });

    const seasonRepository = createMemorySeasonRepository(store);
    const raceRepository = createMemoryRaceRepository(store);

    const result = await getCurrentRace({ seasonRepository, raceRepository });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.race.id).toBe(3);
      expect(result.value.race.round).toBe(3);
    }
  });

  test("returns NOT_FOUND when no active season exists", async () => {
    const store = createTestStore();
    const seasonRepository = createMemorySeasonRepository(store);
    const raceRepository = createMemoryRaceRepository(store);

    const result = await getCurrentRace({ seasonRepository, raceRepository });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
      expect(result.error.entity).toBe("Season");
    }
  });

  test("returns NOT_FOUND when no races exist", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1, year: 2026 });
    seedTestStore(store, { seasons: [season] });

    const seasonRepository = createMemorySeasonRepository(store);
    const raceRepository = createMemoryRaceRepository(store);

    const result = await getCurrentRace({ seasonRepository, raceRepository });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });
});

describe("getRace", () => {
  beforeEach(() => {
    resetAllFixtureCounters();
  });

  test("returns race by ID", async () => {
    const store = createTestStore();
    const race = createRace({ id: 1, round: 1, name: "Bahrain GP" });
    seedTestStore(store, { races: [race] });

    const raceRepository = createMemoryRaceRepository(store);

    const result = await getRace({ raceRepository }, { raceId: 1 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.race.id).toBe(1);
      expect(result.value.race.name).toBe("Bahrain GP");
    }
  });

  test("returns NOT_FOUND for nonexistent race", async () => {
    const store = createTestStore();
    const raceRepository = createMemoryRaceRepository(store);

    const result = await getRace({ raceRepository }, { raceId: 999 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  test("returns VALIDATION_ERROR for invalid race ID", async () => {
    const store = createTestStore();
    const raceRepository = createMemoryRaceRepository(store);

    const result = await getRace({ raceRepository }, { raceId: -1 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });
});
