import { describe, test, expect, beforeEach } from "bun:test";
import { createTestD1Env, clearD1Tables, execSQL } from "../d1-setup";
import { createD1PickRepository } from "../../repositories/d1/pick.d1";
import type { Env } from "../../types";
import type { PickRepository } from "../../repositories/interfaces/pick.repository";

describe("D1 PickRepository", () => {
  let env: Env;
  let repo: PickRepository;

  beforeEach(async () => {
    env = await createTestD1Env();
    await clearD1Tables(env);
    repo = createD1PickRepository(env);

    // Seed required foreign key data
    await execSQL(
      env,
      `
      INSERT INTO users (id, email, name, password_hash, timezone) VALUES (1, 'test@test.com', 'Test User', 'hash', 'UTC');
      INSERT INTO users (id, email, name, password_hash, timezone) VALUES (2, 'user2@test.com', 'User Two', 'hash', 'UTC');
      INSERT INTO seasons (id, year, name, is_active) VALUES (1, 2026, '2026', TRUE);
      INSERT INTO drivers (id, season_id, code, name, number, team, team_color) VALUES (1, 1, 'VER', 'Verstappen', 1, 'Red Bull', '#1E41FF');
      INSERT INTO drivers (id, season_id, code, name, number, team, team_color) VALUES (2, 1, 'HAM', 'Hamilton', 44, 'Ferrari', '#DC0000');
      INSERT INTO races (id, season_id, round, name, location, circuit, country_code, quali_time, race_time)
        VALUES (1, 1, 1, 'Bahrain GP', 'Bahrain', 'Sakhir', 'BH', '2026-03-07T15:00:00Z', '2026-03-08T15:00:00Z');
      INSERT INTO races (id, season_id, round, name, location, circuit, country_code, quali_time, race_time)
        VALUES (2, 1, 2, 'Saudi GP', 'Saudi Arabia', 'Jeddah', 'SA', '2026-03-14T15:00:00Z', '2026-03-15T15:00:00Z');
    `,
    );
  });

  describe("create()", () => {
    test("inserts pick and returns it", async () => {
      const pick = await repo.create(1, 1, 1);

      expect(pick.user_id).toBe(1);
      expect(pick.race_id).toBe(1);
      expect(pick.driver_id).toBe(1);
      expect(pick.id).toBeDefined();
    });

    test("assigns auto-incremented id", async () => {
      const pick1 = await repo.create(1, 1, 1);
      const pick2 = await repo.create(1, 2, 2);

      expect(pick2.id).toBeGreaterThan(pick1.id);
    });
  });

  describe("getByUserAndRace()", () => {
    test("returns null when no pick exists", async () => {
      const pick = await repo.getByUserAndRace(1, 1);

      expect(pick).toBeNull();
    });

    test("returns pick when exists", async () => {
      await repo.create(1, 1, 1);

      const pick = await repo.getByUserAndRace(1, 1);

      expect(pick).not.toBeNull();
      expect(pick!.driver_id).toBe(1);
    });

    test("returns correct pick for user and race combination", async () => {
      await repo.create(1, 1, 1); // User 1, Race 1, Driver 1
      await repo.create(2, 1, 2); // User 2, Race 1, Driver 2

      const pick = await repo.getByUserAndRace(2, 1);

      expect(pick!.driver_id).toBe(2);
    });
  });

  describe("getByUserId()", () => {
    test("returns empty array when no picks exist", async () => {
      const picks = await repo.getByUserId(1, 1);

      expect(picks).toEqual([]);
    });

    test("returns all picks for user in season", async () => {
      await repo.create(1, 1, 1);
      await repo.create(1, 2, 2);

      const picks = await repo.getByUserId(1, 1);

      expect(picks).toHaveLength(2);
    });

    test("returns picks ordered by round", async () => {
      await repo.create(1, 2, 2); // Round 2 first
      await repo.create(1, 1, 1); // Round 1 second

      const picks = await repo.getByUserId(1, 1);

      expect(picks[0].race_id).toBe(1); // Round 1
      expect(picks[1].race_id).toBe(2); // Round 2
    });

    test("only returns picks for the specified user", async () => {
      await repo.create(1, 1, 1);
      await repo.create(2, 1, 2);

      const picks = await repo.getByUserId(1, 1);

      expect(picks).toHaveLength(1);
      expect(picks[0].user_id).toBe(1);
    });
  });

  describe("getForRace()", () => {
    test("returns empty array when no picks exist", async () => {
      const picks = await repo.getForRace(1);

      expect(picks).toEqual([]);
    });

    test("returns all picks for race with user names", async () => {
      await repo.create(1, 1, 1);
      await repo.create(2, 1, 2);

      const picks = await repo.getForRace(1);

      expect(picks).toHaveLength(2);
      expect(picks.some((p) => p.user_name === "Test User")).toBe(true);
      expect(picks.some((p) => p.user_name === "User Two")).toBe(true);
    });
  });

  describe("update()", () => {
    test("updates driver_id and returns updated pick", async () => {
      const original = await repo.create(1, 1, 1);

      const updated = await repo.update(original.id, 2);

      expect(updated.driver_id).toBe(2);
      expect(updated.id).toBe(original.id);
    });
  });

  describe("getUsedDriverIds()", () => {
    test("returns empty array when no picks exist", async () => {
      const usedIds = await repo.getUsedDriverIds(1, 1);

      expect(usedIds).toEqual([]);
    });

    test("returns driver ids from picks", async () => {
      await repo.create(1, 1, 1);
      await repo.create(1, 2, 2);

      const usedIds = await repo.getUsedDriverIds(1, 1);

      expect(usedIds).toContain(1);
      expect(usedIds).toContain(2);
    });

    test("excludes wild-card races", async () => {
      // Add wild-card race
      await execSQL(
        env,
        `
        INSERT INTO races (id, season_id, round, name, location, circuit, country_code, quali_time, race_time, is_wild_card)
          VALUES (3, 1, 23, 'Abu Dhabi GP', 'Abu Dhabi', 'Yas Marina', 'AE', '2026-12-05T15:00:00Z', '2026-12-06T15:00:00Z', TRUE);
      `,
      );
      await repo.create(1, 1, 1); // Regular race
      await repo.create(1, 3, 1); // Wild-card race (same driver)

      const usedIds = await repo.getUsedDriverIds(1, 1);

      // Should only include driver from non-wild-card race, and not duplicate
      expect(usedIds).toEqual([1]);
    });

    test("returns distinct driver ids", async () => {
      await repo.create(1, 1, 1);
      await repo.create(1, 2, 1); // Same driver in different race

      const usedIds = await repo.getUsedDriverIds(1, 1);

      expect(usedIds).toEqual([1]); // Should not duplicate
    });
  });
});
