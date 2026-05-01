import { describe, test, expect } from "bun:test";
import {
  createHttpEnv,
  requestJson,
  registerAndLogin,
  insertSeason,
  insertDriver,
  insertRace,
  insertPick,
  insertRaceResult,
  insertUserSeasonStats,
  setUserAdmin,
} from "./helpers";

describe("HTTP /api/admin", () => {
  test("returns 401 when not authenticated", async () => {
    const env = await createHttpEnv();

    const { res, body } = await requestJson<{ error: string }>(
      env,
      "/api/admin/races/1/results",
      {
        method: "POST",
        body: JSON.stringify({ results: [] }),
      },
    );

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  test("returns 403 when not admin", async () => {
    const env = await createHttpEnv();
    const { token } = await registerAndLogin(env, { email: "user@test.com" });

    const { res, body } = await requestJson<{ error: string }>(
      env,
      "/api/admin/races/1/results",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ results: [] }),
      },
    );

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  test("submits race results as admin", async () => {
    const env = await createHttpEnv();
    const { token, user } = await registerAndLogin(env, {
      email: "admin@test.com",
    });

    await setUserAdmin(env, user.id, true);
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
      qualiTime: "2026-03-07T15:00:00Z",
      raceTime: "2026-03-08T15:00:00Z",
    });

    const { res, body } = await requestJson<{
      data: {
        results: Array<{ driver_id: number; race_points: number }>;
        race_status: string;
      };
    }>(env, "/api/admin/races/1/results", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        results: [{ driver_id: 1, race_position: 1 }],
      }),
    });

    expect(res.status).toBe(200);
    expect(body.data.race_status).toBe("completed");
    expect(body.data.results.length).toBe(1);
    expect(body.data.results[0].driver_id).toBe(1);
  });

  test("cancels race as admin", async () => {
    const env = await createHttpEnv();
    const { token, user } = await registerAndLogin(env, {
      email: "cancel-admin@test.com",
    });

    await setUserAdmin(env, user.id, true);
    const season = await insertSeason(env, {
      id: 1,
      year: 2026,
      isActive: true,
    });
    await insertDriver(env, { id: 1, seasonId: season.id });
    await insertRace(env, {
      id: 1,
      seasonId: season.id,
      status: "completed",
    });
    await insertPick(env, { userId: user.id, raceId: 1, driverId: 1 });
    await insertRaceResult(env, {
      raceId: 1,
      driverId: 1,
      racePosition: 1,
    });
    await insertUserSeasonStats(env, {
      userId: user.id,
      seasonId: season.id,
      totalPoints: 25,
      racesCompleted: 1,
    });

    const { res, body } = await requestJson<{
      data: { race: { id: number; status: string } };
    }>(env, "/api/admin/races/1/cancel", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    expect(body.data.race.status).toBe("cancelled");

    const race = await env.DB.prepare(
      "SELECT status FROM races WHERE id = 1",
    ).first<{ status: string }>();
    const results = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM race_results WHERE race_id = 1",
    ).first<{ count: number }>();
    const stats = await env.DB.prepare(
      "SELECT total_points, races_completed FROM user_season_stats WHERE user_id = ? AND season_id = ?",
    )
      .bind(user.id, season.id)
      .first<{ total_points: number; races_completed: number }>();

    expect(race?.status).toBe("cancelled");
    expect(results?.count).toBe(0);
    expect(stats?.total_points).toBe(0);
    expect(stats?.races_completed).toBe(0);
  });

  test("sync-results returns ok status", async () => {
    const env = await createHttpEnv();
    const { token, user } = await registerAndLogin(env, {
      email: "admin2@test.com",
    });

    await setUserAdmin(env, user.id, true);

    const { res, body } = await requestJson<{
      data: {
        status: string;
        races_started: number;
        races_synced: number[];
        races_failed: number[];
      };
    }>(env, "/api/admin/sync-results", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    expect(body.data.status).toBe("ok");
    expect(Array.isArray(body.data.races_synced)).toBe(true);
    expect(Array.isArray(body.data.races_failed)).toBe(true);
  });
});
