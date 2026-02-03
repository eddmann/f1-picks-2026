import { describe, test, expect } from "bun:test";
import {
  createHttpEnv,
  requestJson,
  insertSeason,
  insertUser,
  insertUserSeasonStats,
} from "./helpers";

describe("HTTP /api/leaderboard", () => {
  test("returns leaderboard for active season", async () => {
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
    await insertUserSeasonStats(env, {
      userId: alice.id,
      seasonId: season.id,
      totalPoints: 50,
      racesCompleted: 3,
    });
    await insertUserSeasonStats(env, {
      userId: bob.id,
      seasonId: season.id,
      totalPoints: 25,
      racesCompleted: 2,
    });

    const { res, body } = await requestJson<{
      data: {
        season: { year: number };
        standings: Array<{ user_id: number; total_points: number }>;
      };
    }>(env, "/api/leaderboard");

    expect(res.status).toBe(200);
    expect(body.data.season.year).toBe(2026);
    expect(body.data.standings.length).toBe(2);
    expect(body.data.standings[0].total_points).toBe(50);
  });
});
