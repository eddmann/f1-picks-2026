import { describe, test, expect } from "bun:test";
import { createHttpEnv, requestJson, insertSeason } from "./helpers";

describe("HTTP /api/seasons", () => {
  test("returns active season", async () => {
    const env = await createHttpEnv();

    await insertSeason(env, {
      id: 1,
      year: 2026,
      isActive: true,
      name: "2026",
    });

    const { res, body } = await requestJson<{
      data: { season: { year: number; is_active: boolean } };
    }>(env, "/api/seasons/current");

    expect(res.status).toBe(200);
    expect(body.data.season.year).toBe(2026);
    expect(body.data.season.is_active).toBe(true);
  });
});
