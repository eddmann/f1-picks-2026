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

describe("HTTP /api/picks", () => {
  test("returns 401 when not authenticated", async () => {
    const env = await createHttpEnv();

    const { res, body } = await requestJson<{ error: string }>(
      env,
      "/api/picks",
    );

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  test("returns picks for current user", async () => {
    const env = await createHttpEnv();
    const { token, user } = await registerAndLogin(env, {
      email: "picks@test.com",
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
      data: { picks: Array<{ race_id: number }> };
    }>(env, "/api/picks", { headers: { Authorization: `Bearer ${token}` } });

    expect(res.status).toBe(200);
    expect(body.data.picks.length).toBe(1);
    expect(body.data.picks[0].race_id).toBe(1);
  });

  test("creates a pick for current user", async () => {
    const env = await createHttpEnv();
    const { token, user } = await registerAndLogin(env, {
      email: "createpick@test.com",
    });

    const now = new Date();
    const qualiTime = new Date(
      now.getTime() + 2 * 60 * 60 * 1000,
    ).toISOString();
    const raceTime = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();

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
    await insertRace(env, {
      id: 1,
      seasonId: season.id,
      round: 1,
      name: "Bahrain GP",
      location: "Bahrain",
      circuit: "Sakhir",
      countryCode: "BH",
      qualiTime,
      raceTime,
    });

    const { res, body } = await requestJson<{
      data: { pick: { user_id: number; driver_id: number; race_id: number } };
    }>(env, "/api/picks", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ race_id: 1, driver_id: 1 }),
    });

    expect(res.status).toBe(200);
    expect(body.data.pick.user_id).toBe(user.id);
    expect(body.data.pick.driver_id).toBe(1);
    expect(body.data.pick.race_id).toBe(1);
  });
});
