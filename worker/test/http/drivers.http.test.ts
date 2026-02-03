import { describe, test, expect } from "bun:test";
import {
  createHttpEnv,
  requestJson,
  registerAndLogin,
  insertSeason,
  insertDriver,
  insertRace,
  insertPick,
} from "./helpers";

describe("HTTP /api/drivers", () => {
  test("returns drivers for active season", async () => {
    const env = await createHttpEnv();

    const season = await insertSeason(env, {
      id: 1,
      year: 2026,
      isActive: true,
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

    const { res, body } = await requestJson<{
      data: { drivers: Array<{ id: number }> };
    }>(env, "/api/drivers");

    expect(res.status).toBe(200);
    expect(body.data.drivers.length).toBe(2);
  });

  test("returns available drivers for current user", async () => {
    const env = await createHttpEnv();
    const { token, user } = await registerAndLogin(env, {
      email: "driver@test.com",
    });

    const season = await insertSeason(env, {
      id: 1,
      year: 2026,
      isActive: true,
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
    });
    await insertPick(env, { userId: user.id, raceId: race.id, driverId: 1 });

    const { res, body } = await requestJson<{
      data: {
        drivers: Array<{ id: number; is_available: boolean }>;
        used_driver_ids: number[];
      };
    }>(env, "/api/drivers/available", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    expect(body.data.used_driver_ids).toEqual([1]);
    const driver1 = body.data.drivers.find((d) => d.id === 1);
    const driver2 = body.data.drivers.find((d) => d.id === 2);
    expect(driver1?.is_available).toBe(false);
    expect(driver2?.is_available).toBe(true);
  });
});
