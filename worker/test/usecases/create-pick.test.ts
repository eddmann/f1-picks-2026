import { describe, test, expect, beforeEach } from "bun:test";
import { createPick } from "../../usecases/create-pick.usecase";
import { createMemorySeasonRepository } from "../../repositories/memory/season.memory";
import { createMemoryRaceRepository } from "../../repositories/memory/race.memory";
import { createMemoryDriverRepository } from "../../repositories/memory/driver.memory";
import { createMemoryPickRepository } from "../../repositories/memory/pick.memory";
import { createTestStore, seedTestStore } from "../setup";
import {
  createSeason,
  createRace,
  createWildCardRace,
  createDriver,
  createUser,
  createPick as createPickFixture,
  resetAllFixtureCounters,
} from "../fixtures";

describe("createPick", () => {
  beforeEach(() => {
    resetAllFixtureCounters();
  });

  function createDeps(
    store: ReturnType<typeof createTestStore>,
    clock?: { now(): Date },
  ) {
    return {
      seasonRepository: createMemorySeasonRepository(store),
      raceRepository: createMemoryRaceRepository(store),
      driverRepository: createMemoryDriverRepository(store),
      pickRepository: createMemoryPickRepository(store),
      clock,
    };
  }

  test("creates pick successfully when all validations pass", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const user = createUser({ id: 1 });
    // Race on Saturday 2026-03-21 at 15:00
    const race = createRace({
      id: 1,
      seasonId: 1,
      qualiTime: "2026-03-21T15:00:00Z",
    });
    const driver = createDriver({ id: 1, seasonId: 1 });

    seedTestStore(store, {
      seasons: [season],
      users: [user],
      races: [race],
      drivers: [driver],
    });

    // Stub clock: Wednesday of race week
    const stubClock = { now: () => new Date("2026-03-18T12:00:00Z") };

    const result = await createPick(createDeps(store, stubClock), {
      userId: 1,
      raceId: 1,
      driverId: 1,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.pick.user_id).toBe(1);
      expect(result.value.pick.race_id).toBe(1);
      expect(result.value.pick.driver_id).toBe(1);
      expect(result.value.driver.id).toBe(1);
      expect(result.value.race.id).toBe(1);
    }
  });

  test("returns NOT_FOUND when no active season", async () => {
    const store = createTestStore();
    const stubClock = { now: () => new Date("2026-03-18T12:00:00Z") };

    const result = await createPick(createDeps(store, stubClock), {
      userId: 1,
      raceId: 1,
      driverId: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  test("returns NOT_FOUND when race not found", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    seedTestStore(store, { seasons: [season] });

    const stubClock = { now: () => new Date("2026-03-18T12:00:00Z") };

    const result = await createPick(createDeps(store, stubClock), {
      userId: 1,
      raceId: 999,
      driverId: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  test("returns VALIDATION_ERROR when race not in active season", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({
      id: 1,
      seasonId: 2,
      qualiTime: "2026-03-21T15:00:00Z",
    }); // Wrong season

    seedTestStore(store, { seasons: [season], races: [race] });

    const stubClock = { now: () => new Date("2026-03-18T12:00:00Z") };

    const result = await createPick(createDeps(store, stubClock), {
      userId: 1,
      raceId: 1,
      driverId: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  test("returns PICK_WINDOW_CLOSED (too_early) before race week", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    // Race on Saturday 2026-03-21 (week starting Monday 2026-03-16)
    const race = createRace({
      id: 1,
      seasonId: 1,
      qualiTime: "2026-03-21T15:00:00Z",
    });
    const driver = createDriver({ id: 1, seasonId: 1 });

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      drivers: [driver],
    });

    // Stub clock: Sunday before race week (2026-03-15)
    const stubClock = { now: () => new Date("2026-03-15T12:00:00Z") };

    const result = await createPick(createDeps(store, stubClock), {
      userId: 1,
      raceId: 1,
      driverId: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("PICK_WINDOW_CLOSED");
      if (result.error.code === "PICK_WINDOW_CLOSED") {
        expect(result.error.reason).toBe("too_early");
      }
    }
  });

  test("returns PICK_WINDOW_CLOSED (too_late) after qualifying starts", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({
      id: 1,
      seasonId: 1,
      qualiTime: "2026-03-21T15:00:00Z",
    });
    const driver = createDriver({ id: 1, seasonId: 1 });

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      drivers: [driver],
    });

    // Stub clock: 5 minutes before quali (should be closed since window closes 10 mins before)
    const stubClock = { now: () => new Date("2026-03-21T14:55:00Z") };

    const result = await createPick(createDeps(store, stubClock), {
      userId: 1,
      raceId: 1,
      driverId: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("PICK_WINDOW_CLOSED");
      if (result.error.code === "PICK_WINDOW_CLOSED") {
        expect(result.error.reason).toBe("too_late");
      }
    }
  });

  test("uses sprint qualifying time for deadline on sprint weekends", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    // Sprint weekend: sprint quali Friday 10:30, regular quali Saturday 15:00
    const race = createRace({
      id: 1,
      seasonId: 1,
      hasSprint: true,
      qualiTime: "2026-03-21T15:00:00Z",
      sprintQualiTime: "2026-03-20T10:30:00Z",
    });
    const driver = createDriver({ id: 1, seasonId: 1 });

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      drivers: [driver],
    });

    // Stub clock: After sprint quali starts (should be closed)
    const stubClock = { now: () => new Date("2026-03-20T10:25:00Z") };

    const result = await createPick(createDeps(store, stubClock), {
      userId: 1,
      raceId: 1,
      driverId: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("PICK_WINDOW_CLOSED");
    }
  });

  test("returns NOT_FOUND when driver not found", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({
      id: 1,
      seasonId: 1,
      qualiTime: "2026-03-21T15:00:00Z",
    });

    seedTestStore(store, { seasons: [season], races: [race] });

    const stubClock = { now: () => new Date("2026-03-18T12:00:00Z") };

    const result = await createPick(createDeps(store, stubClock), {
      userId: 1,
      raceId: 1,
      driverId: 999,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  test("returns VALIDATION_ERROR when driver not in active season", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({
      id: 1,
      seasonId: 1,
      qualiTime: "2026-03-21T15:00:00Z",
    });
    const driver = createDriver({ id: 1, seasonId: 2 }); // Wrong season

    seedTestStore(store, {
      seasons: [season],
      races: [race],
      drivers: [driver],
    });

    const stubClock = { now: () => new Date("2026-03-18T12:00:00Z") };

    const result = await createPick(createDeps(store, stubClock), {
      userId: 1,
      raceId: 1,
      driverId: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  test("returns DRIVER_UNAVAILABLE when already used in non-wild-card race", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const user = createUser({ id: 1 });
    const race1 = createRace({
      id: 1,
      seasonId: 1,
      round: 1,
      qualiTime: "2026-03-14T15:00:00Z",
    });
    const race2 = createRace({
      id: 2,
      seasonId: 1,
      round: 2,
      qualiTime: "2026-03-21T15:00:00Z",
    });
    const driver = createDriver({ id: 1, seasonId: 1 });
    // User already picked this driver in race 1
    const existingPick = createPickFixture({
      userId: 1,
      raceId: 1,
      driverId: 1,
    });

    seedTestStore(store, {
      seasons: [season],
      users: [user],
      races: [race1, race2],
      drivers: [driver],
      picks: [existingPick],
    });

    // Try to pick same driver for race 2
    const stubClock = { now: () => new Date("2026-03-18T12:00:00Z") };

    const result = await createPick(createDeps(store, stubClock), {
      userId: 1,
      raceId: 2,
      driverId: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DRIVER_UNAVAILABLE");
    }
  });

  test("returns DRIVER_UNAVAILABLE when switching to driver used in another race", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const user = createUser({ id: 1 });
    const race1 = createRace({
      id: 1,
      seasonId: 1,
      round: 1,
      qualiTime: "2026-03-14T15:00:00Z",
    });
    const race2 = createRace({
      id: 2,
      seasonId: 1,
      round: 2,
      qualiTime: "2026-03-21T15:00:00Z",
    });
    const driver1 = createDriver({ id: 1, seasonId: 1 });
    const driver2 = createDriver({ id: 2, seasonId: 1 });
    const pick1 = createPickFixture({
      id: 1,
      userId: 1,
      raceId: 1,
      driverId: 1,
    });
    const pick2 = createPickFixture({
      id: 2,
      userId: 1,
      raceId: 2,
      driverId: 2,
    });

    seedTestStore(store, {
      seasons: [season],
      users: [user],
      races: [race1, race2],
      drivers: [driver1, driver2],
      picks: [pick1, pick2],
    });

    const stubClock = { now: () => new Date("2026-03-10T12:00:00Z") };

    const result = await createPick(createDeps(store, stubClock), {
      userId: 1,
      raceId: 1,
      driverId: 2,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DRIVER_UNAVAILABLE");
    }
  });

  test("allows same driver in wild-card race (round 23+)", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const user = createUser({ id: 1 });
    const race1 = createRace({
      id: 1,
      seasonId: 1,
      round: 1,
      qualiTime: "2026-03-14T15:00:00Z",
    });
    const wildCardRace = createWildCardRace({
      id: 2,
      seasonId: 1,
      round: 23,
      qualiTime: "2026-11-21T15:00:00Z",
    });
    const driver = createDriver({ id: 1, seasonId: 1 });
    const existingPick = createPickFixture({
      userId: 1,
      raceId: 1,
      driverId: 1,
    });

    seedTestStore(store, {
      seasons: [season],
      users: [user],
      races: [race1, wildCardRace],
      drivers: [driver],
      picks: [existingPick],
    });

    // Pick same driver for wild-card race
    const stubClock = { now: () => new Date("2026-11-17T12:00:00Z") };

    const result = await createPick(createDeps(store, stubClock), {
      userId: 1,
      raceId: 2,
      driverId: 1,
    });

    expect(result.ok).toBe(true);
  });

  test("round 22 is NOT a wild-card race (driver reuse blocked)", async () => {
    // README: "First 22 races" have driver restrictions, "Last 2 races" are wild cards
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const user = createUser({ id: 1 });
    const race1 = createRace({
      id: 1,
      seasonId: 1,
      round: 1,
      qualiTime: "2026-03-14T15:00:00Z",
    });
    // Round 22 is the last restricted race (not a wild card)
    const race22 = createRace({
      id: 22,
      seasonId: 1,
      round: 22,
      qualiTime: "2026-11-14T15:00:00Z",
      isWildCard: false,
    });
    const driver = createDriver({ id: 1, seasonId: 1 });
    const existingPick = createPickFixture({
      userId: 1,
      raceId: 1,
      driverId: 1,
    });

    seedTestStore(store, {
      seasons: [season],
      users: [user],
      races: [race1, race22],
      drivers: [driver],
      picks: [existingPick],
    });

    const stubClock = { now: () => new Date("2026-11-10T12:00:00Z") };

    const result = await createPick(createDeps(store, stubClock), {
      userId: 1,
      raceId: 22,
      driverId: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DRIVER_UNAVAILABLE");
    }
  });

  test("round 24 is also a wild-card race (last 2 races)", async () => {
    // README: Qatar (round 23) and Abu Dhabi (round 24) are both wild cards
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const user = createUser({ id: 1 });
    const race1 = createRace({
      id: 1,
      seasonId: 1,
      round: 1,
      qualiTime: "2026-03-14T15:00:00Z",
    });
    // Abu Dhabi - Sunday Dec 6th race, qualifying Dec 5th at 13:00
    const wildCardRace24 = createWildCardRace({
      id: 24,
      seasonId: 1,
      round: 24,
      qualiTime: "2026-12-05T13:00:00Z",
    });
    const driver = createDriver({ id: 1, seasonId: 1 });
    const existingPick = createPickFixture({
      userId: 1,
      raceId: 1,
      driverId: 1,
    });

    seedTestStore(store, {
      seasons: [season],
      users: [user],
      races: [race1, wildCardRace24],
      drivers: [driver],
      picks: [existingPick],
    });

    // Pick window: Monday Nov 30 00:00 UTC to 10 mins before quali Dec 5 13:00 UTC
    // Wednesday Dec 2nd should be within the window
    const stubClock = { now: () => new Date("2026-12-02T12:00:00Z") };

    const result = await createPick(createDeps(store, stubClock), {
      userId: 1,
      raceId: 24,
      driverId: 1,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.race.is_wild_card).toBe(true);
    }
  });

  test("updates existing pick when changing driver", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const user = createUser({ id: 1 });
    const race = createRace({
      id: 1,
      seasonId: 1,
      qualiTime: "2026-03-21T15:00:00Z",
    });
    const driver1 = createDriver({ id: 1, seasonId: 1 });
    const driver2 = createDriver({ id: 2, seasonId: 1 });
    const existingPick = createPickFixture({
      id: 1,
      userId: 1,
      raceId: 1,
      driverId: 1,
    });

    seedTestStore(store, {
      seasons: [season],
      users: [user],
      races: [race],
      drivers: [driver1, driver2],
      picks: [existingPick],
    });

    const stubClock = { now: () => new Date("2026-03-18T12:00:00Z") };

    const result = await createPick(createDeps(store, stubClock), {
      userId: 1,
      raceId: 1,
      driverId: 2,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.pick.id).toBe(1); // Same pick ID
      expect(result.value.pick.driver_id).toBe(2); // New driver
    }

    // Should still only have 1 pick
    expect(store.picks.length).toBe(1);
  });

  test("allows changing to currently picked driver (no-op)", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const user = createUser({ id: 1 });
    const race = createRace({
      id: 1,
      seasonId: 1,
      qualiTime: "2026-03-21T15:00:00Z",
    });
    const driver = createDriver({ id: 1, seasonId: 1 });
    const existingPick = createPickFixture({
      userId: 1,
      raceId: 1,
      driverId: 1,
    });

    seedTestStore(store, {
      seasons: [season],
      users: [user],
      races: [race],
      drivers: [driver],
      picks: [existingPick],
    });

    const stubClock = { now: () => new Date("2026-03-18T12:00:00Z") };

    // Pick same driver again
    const result = await createPick(createDeps(store, stubClock), {
      userId: 1,
      raceId: 1,
      driverId: 1,
    });

    expect(result.ok).toBe(true);
  });

  test("returns VALIDATION_ERROR for invalid race ID", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    seedTestStore(store, { seasons: [season] });

    const result = await createPick(createDeps(store), {
      userId: 1,
      raceId: -1,
      driverId: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  test("returns VALIDATION_ERROR for invalid driver ID", async () => {
    const store = createTestStore();
    const season = createSeason({ id: 1 });
    const race = createRace({
      id: 1,
      seasonId: 1,
      qualiTime: "2026-03-21T15:00:00Z",
    });
    seedTestStore(store, { seasons: [season], races: [race] });

    const stubClock = { now: () => new Date("2026-03-18T12:00:00Z") };

    const result = await createPick(createDeps(store, stubClock), {
      userId: 1,
      raceId: 1,
      driverId: 0,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });
});
