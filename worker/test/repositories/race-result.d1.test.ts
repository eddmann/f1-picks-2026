import { describe, test, expect, beforeEach } from "bun:test";
import { createTestD1Env, clearD1Tables, execSQL } from "../d1-setup";
import { createD1RaceResultRepository } from "../../repositories/d1/race-result.d1";
import type { Env } from "../../types";
import type { RaceResultRepository } from "../../repositories/interfaces/race-result.repository";

describe("D1 RaceResultRepository", () => {
  let env: Env;
  let repo: RaceResultRepository;

  beforeEach(async () => {
    env = await createTestD1Env();
    await clearD1Tables(env);
    repo = createD1RaceResultRepository(env);

    // Seed required foreign key data
    await execSQL(
      env,
      `
      INSERT INTO seasons (id, year, name, is_active) VALUES (1, 2026, '2026', TRUE);
      INSERT INTO drivers (id, season_id, code, name, number, team, team_color) VALUES (1, 1, 'VER', 'Verstappen', 1, 'Red Bull', '#1E41FF');
      INSERT INTO drivers (id, season_id, code, name, number, team, team_color) VALUES (2, 1, 'HAM', 'Hamilton', 44, 'Ferrari', '#DC0000');
      INSERT INTO drivers (id, season_id, code, name, number, team, team_color) VALUES (3, 1, 'LEC', 'Leclerc', 16, 'Ferrari', '#DC0000');
      INSERT INTO races (id, season_id, round, name, location, circuit, country_code, quali_time, race_time)
        VALUES (1, 1, 1, 'Bahrain GP', 'Bahrain', 'Sakhir', 'BH', '2026-03-07T15:00:00Z', '2026-03-08T15:00:00Z');
    `,
    );
  });

  describe("getByRaceId()", () => {
    test("returns empty array when no results exist", async () => {
      const results = await repo.getByRaceId(1);

      expect(results).toEqual([]);
    });

    test("returns all results for race", async () => {
      await repo.upsert(1, 1, 1, null, 25, 0);
      await repo.upsert(1, 2, 2, null, 18, 0);
      await repo.upsert(1, 3, 3, null, 15, 0);

      const results = await repo.getByRaceId(1);

      expect(results).toHaveLength(3);
    });

    test("returns results ordered by race_position", async () => {
      await repo.upsert(1, 3, 3, null, 15, 0);
      await repo.upsert(1, 1, 1, null, 25, 0);
      await repo.upsert(1, 2, 2, null, 18, 0);

      const results = await repo.getByRaceId(1);

      expect(results[0].race_position).toBe(1);
      expect(results[1].race_position).toBe(2);
      expect(results[2].race_position).toBe(3);
    });
  });

  describe("getByRaceAndDriver()", () => {
    test("returns null when no result exists", async () => {
      const result = await repo.getByRaceAndDriver(1, 1);

      expect(result).toBeNull();
    });

    test("returns result when exists", async () => {
      await repo.upsert(1, 1, 1, null, 25, 0);

      const result = await repo.getByRaceAndDriver(1, 1);

      expect(result).not.toBeNull();
      expect(result!.race_position).toBe(1);
      expect(result!.race_points).toBe(25);
    });
  });

  describe("upsert()", () => {
    test("inserts new result", async () => {
      const result = await repo.upsert(1, 1, 1, null, 25, 0);

      expect(result.race_id).toBe(1);
      expect(result.driver_id).toBe(1);
      expect(result.race_position).toBe(1);
      expect(result.sprint_position).toBeNull();
      expect(result.race_points).toBe(25);
      expect(result.sprint_points).toBe(0);
      expect(result.id).toBeDefined();
    });

    test("updates existing result", async () => {
      await repo.upsert(1, 1, 1, null, 25, 0);

      // Update to P2
      const updated = await repo.upsert(1, 1, 2, null, 18, 0);

      expect(updated.race_position).toBe(2);
      expect(updated.race_points).toBe(18);
    });

    test("handles sprint race results", async () => {
      const result = await repo.upsert(1, 1, 1, 2, 25, 7);

      expect(result.race_position).toBe(1);
      expect(result.sprint_position).toBe(2);
      expect(result.race_points).toBe(25);
      expect(result.sprint_points).toBe(7);
    });

    test("can update sprint results after race results", async () => {
      await repo.upsert(1, 1, null, 1, 0, 8); // Sprint only
      const updated = await repo.upsert(1, 1, 2, 1, 18, 8); // Add race

      expect(updated.race_position).toBe(2);
      expect(updated.sprint_position).toBe(1);
      expect(updated.race_points).toBe(18);
      expect(updated.sprint_points).toBe(8);
    });

    test("handles null positions (DNF/DNS)", async () => {
      const result = await repo.upsert(1, 1, null, null, 0, 0);

      expect(result.race_position).toBeNull();
      expect(result.sprint_position).toBeNull();
      expect(result.race_points).toBe(0);
    });
  });
});
