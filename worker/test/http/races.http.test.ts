import { describe, test, expect } from "bun:test";
import {
  createHttpEnv,
  requestJson,
  insertSeason,
  insertRace,
  insertUser,
  insertDriver,
  insertPick,
  insertRaceResult,
} from "./helpers";

describe("HTTP /api/races", () => {
  test("returns races for active season", async () => {
    const env = await createHttpEnv();

    const season = await insertSeason(env, {
      id: 1,
      year: 2026,
      isActive: true,
    });
    await insertRace(env, {
      id: 1,
      seasonId: season.id,
      round: 1,
      name: "Bahrain GP",
      location: "Bahrain",
      circuit: "Sakhir",
      countryCode: "BH",
      qualiTime: "2026-03-07T15:00:00Z",
      raceTime: "2026-03-08T15:00:00Z",
    });
    await insertRace(env, {
      id: 2,
      seasonId: season.id,
      round: 2,
      name: "Saudi GP",
      location: "Saudi Arabia",
      circuit: "Jeddah",
      countryCode: "SA",
      qualiTime: "2026-03-14T15:00:00Z",
      raceTime: "2026-03-15T15:00:00Z",
    });

    const { res, body } = await requestJson<{
      data: { races: Array<{ id: number }> };
    }>(env, "/api/races");

    expect(res.status).toBe(200);
    expect(body.data.races.length).toBe(2);
  });

  test("returns current race", async () => {
    const env = await createHttpEnv();

    const season = await insertSeason(env, {
      id: 1,
      year: 2026,
      isActive: true,
    });
    await insertRace(env, {
      id: 1,
      seasonId: season.id,
      round: 1,
      name: "Bahrain GP",
      location: "Bahrain",
      circuit: "Sakhir",
      countryCode: "BH",
      qualiTime: "2026-03-07T15:00:00Z",
      raceTime: "2026-03-08T15:00:00Z",
      status: "completed",
    });
    await insertRace(env, {
      id: 2,
      seasonId: season.id,
      round: 2,
      name: "Saudi GP",
      location: "Saudi Arabia",
      circuit: "Jeddah",
      countryCode: "SA",
      qualiTime: "2026-03-14T15:00:00Z",
      raceTime: "2026-03-15T15:00:00Z",
      status: "upcoming",
    });

    const { res, body } = await requestJson<{ data: { race: { id: number } } }>(
      env,
      "/api/races/current",
    );

    expect(res.status).toBe(200);
    expect(body.data.race.id).toBe(2);
  });

  test("returns race by id", async () => {
    const env = await createHttpEnv();

    const season = await insertSeason(env, {
      id: 1,
      year: 2026,
      isActive: true,
    });
    await insertRace(env, {
      id: 42,
      seasonId: season.id,
      round: 1,
      name: "Bahrain GP",
      location: "Bahrain",
      circuit: "Sakhir",
      countryCode: "BH",
      qualiTime: "2026-03-07T15:00:00Z",
      raceTime: "2026-03-08T15:00:00Z",
    });

    const { res, body } = await requestJson<{
      data: { race: { id: number; name: string } };
    }>(env, "/api/races/42");

    expect(res.status).toBe(200);
    expect(body.data.race.id).toBe(42);
    expect(body.data.race.name).toBe("Bahrain GP");
  });

  test("returns race results and picks", async () => {
    const env = await createHttpEnv();

    const season = await insertSeason(env, {
      id: 1,
      year: 2026,
      isActive: true,
    });
    const alice = await insertUser(env, {
      id: 1,
      email: "alice@test.com",
      name: "Alice",
    });
    const bob = await insertUser(env, {
      id: 2,
      email: "bob@test.com",
      name: "Bob",
    });
    await insertDriver(env, {
      id: 1,
      seasonId: season.id,
      code: "VER",
      name: "Max Verstappen",
      number: 1,
      team: "Red Bull",
      teamColor: "#1E41FF",
    });
    await insertDriver(env, {
      id: 2,
      seasonId: season.id,
      code: "LEC",
      name: "Charles Leclerc",
      number: 16,
      team: "Ferrari",
      teamColor: "#DC0000",
    });
    const race = await insertRace(env, {
      id: 1,
      seasonId: season.id,
      round: 1,
      name: "Bahrain GP",
      location: "Bahrain",
      circuit: "Sakhir",
      countryCode: "BH",
      qualiTime: "2026-03-07T15:00:00Z",
      raceTime: "2026-03-08T15:00:00Z",
      status: "completed",
    });
    await insertPick(env, { userId: alice.id, raceId: race.id, driverId: 1 });
    await insertPick(env, { userId: bob.id, raceId: race.id, driverId: 2 });
    await insertRaceResult(env, {
      raceId: race.id,
      driverId: 1,
      racePosition: 1,
      racePoints: 25,
      sprintPoints: 0,
    });
    await insertRaceResult(env, {
      raceId: race.id,
      driverId: 2,
      racePosition: 2,
      racePoints: 18,
      sprintPoints: 0,
    });

    const { res, body } = await requestJson<{
      data: {
        race: { id: number };
        results: Array<{ driver_id: number; driver: { id: number } }>;
        picks: Array<{ user_name: string; points: number }>;
      };
    }>(env, "/api/races/1/results");

    expect(res.status).toBe(200);
    expect(body.data.race.id).toBe(1);
    expect(body.data.results.length).toBe(2);
    expect(body.data.results[0].driver.id).toBeDefined();
    expect(body.data.picks.length).toBe(2);
    expect(body.data.picks[0].user_name).toBeDefined();
  });
});
