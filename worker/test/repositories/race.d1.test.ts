import { describe, test, expect, beforeEach } from "bun:test";
import { createTestD1Env, clearD1Tables, execSQL } from "../d1-setup";
import { createD1RaceRepository } from "../../repositories/d1/race.d1";
import type { Env } from "../../types";
import type { RaceRepository } from "../../repositories/interfaces/race.repository";

describe("D1 RaceRepository", () => {
  let env: Env;
  let repo: RaceRepository;

  beforeEach(async () => {
    env = await createTestD1Env();
    await clearD1Tables(env);
    repo = createD1RaceRepository(env);

    // Seed a season for foreign key constraint
    await execSQL(
      env,
      `
      INSERT INTO seasons (id, year, name, is_active) VALUES (1, 2026, '2026', TRUE);
    `,
    );
  });

  describe("getBySeasonId()", () => {
    test("returns empty array when no races exist", async () => {
      const races = await repo.getBySeasonId(1);

      expect(races).toEqual([]);
    });

    test("returns races for the specified season", async () => {
      await execSQL(
        env,
        `
        INSERT INTO races (id, season_id, round, name, location, circuit, country_code, quali_time, race_time)
          VALUES (1, 1, 1, 'Bahrain GP', 'Bahrain', 'Sakhir', 'BH', '2026-03-07T15:00:00Z', '2026-03-08T15:00:00Z');
        INSERT INTO races (id, season_id, round, name, location, circuit, country_code, quali_time, race_time)
          VALUES (2, 1, 2, 'Saudi Arabian GP', 'Saudi Arabia', 'Jeddah', 'SA', '2026-03-14T15:00:00Z', '2026-03-15T15:00:00Z');
      `,
      );

      const races = await repo.getBySeasonId(1);

      expect(races).toHaveLength(2);
      expect(races[0].round).toBe(1);
      expect(races[1].round).toBe(2);
    });

    test("returns races ordered by round", async () => {
      await execSQL(
        env,
        `
        INSERT INTO races (id, season_id, round, name, location, circuit, country_code, quali_time, race_time)
          VALUES (1, 1, 3, 'Australian GP', 'Australia', 'Melbourne', 'AU', '2026-03-21T15:00:00Z', '2026-03-22T15:00:00Z');
        INSERT INTO races (id, season_id, round, name, location, circuit, country_code, quali_time, race_time)
          VALUES (2, 1, 1, 'Bahrain GP', 'Bahrain', 'Sakhir', 'BH', '2026-03-07T15:00:00Z', '2026-03-08T15:00:00Z');
      `,
      );

      const races = await repo.getBySeasonId(1);

      expect(races[0].round).toBe(1);
      expect(races[1].round).toBe(3);
    });
  });

  describe("getById()", () => {
    test("returns null when race does not exist", async () => {
      const race = await repo.getById(999);

      expect(race).toBeNull();
    });

    test("returns race by id", async () => {
      await execSQL(
        env,
        `
        INSERT INTO races (id, season_id, round, name, location, circuit, country_code, quali_time, race_time, has_sprint)
          VALUES (42, 1, 1, 'Bahrain GP', 'Bahrain', 'Sakhir', 'BH', '2026-03-07T15:00:00Z', '2026-03-08T15:00:00Z', FALSE);
      `,
      );

      const race = await repo.getById(42);

      expect(race).not.toBeNull();
      expect(race!.id).toBe(42);
      expect(race!.name).toBe("Bahrain GP");
      expect(race!.location).toBe("Bahrain");
      expect(race!.circuit).toBe("Sakhir");
      expect(race!.country_code).toBe("BH");
    });
  });

  describe("getCurrentRace()", () => {
    test("returns null when no races exist", async () => {
      const race = await repo.getCurrentRace(1);

      expect(race).toBeNull();
    });

    test("returns first upcoming race", async () => {
      await execSQL(
        env,
        `
        INSERT INTO races (id, season_id, round, name, location, circuit, country_code, quali_time, race_time, status)
          VALUES (1, 1, 1, 'Bahrain GP', 'Bahrain', 'Sakhir', 'BH', '2026-03-07T15:00:00Z', '2026-03-08T15:00:00Z', 'upcoming');
        INSERT INTO races (id, season_id, round, name, location, circuit, country_code, quali_time, race_time, status)
          VALUES (2, 1, 2, 'Saudi Arabian GP', 'Saudi Arabia', 'Jeddah', 'SA', '2026-03-14T15:00:00Z', '2026-03-15T15:00:00Z', 'upcoming');
      `,
      );

      const race = await repo.getCurrentRace(1);

      expect(race).not.toBeNull();
      expect(race!.round).toBe(1);
      expect(race!.name).toBe("Bahrain GP");
    });

    test("returns in_progress race over upcoming", async () => {
      await execSQL(
        env,
        `
        INSERT INTO races (id, season_id, round, name, location, circuit, country_code, quali_time, race_time, status)
          VALUES (1, 1, 1, 'Bahrain GP', 'Bahrain', 'Sakhir', 'BH', '2026-03-07T15:00:00Z', '2026-03-08T15:00:00Z', 'in_progress');
        INSERT INTO races (id, season_id, round, name, location, circuit, country_code, quali_time, race_time, status)
          VALUES (2, 1, 2, 'Saudi Arabian GP', 'Saudi Arabia', 'Jeddah', 'SA', '2026-03-14T15:00:00Z', '2026-03-15T15:00:00Z', 'upcoming');
      `,
      );

      const race = await repo.getCurrentRace(1);

      expect(race).not.toBeNull();
      expect(race!.status).toBe("in_progress");
    });

    test("returns last completed race when all are completed", async () => {
      await execSQL(
        env,
        `
        INSERT INTO races (id, season_id, round, name, location, circuit, country_code, quali_time, race_time, status)
          VALUES (1, 1, 1, 'Bahrain GP', 'Bahrain', 'Sakhir', 'BH', '2026-03-07T15:00:00Z', '2026-03-08T15:00:00Z', 'completed');
        INSERT INTO races (id, season_id, round, name, location, circuit, country_code, quali_time, race_time, status)
          VALUES (2, 1, 2, 'Saudi Arabian GP', 'Saudi Arabia', 'Jeddah', 'SA', '2026-03-14T15:00:00Z', '2026-03-15T15:00:00Z', 'completed');
      `,
      );

      const race = await repo.getCurrentRace(1);

      expect(race).not.toBeNull();
      expect(race!.round).toBe(2); // Last completed
    });
  });

  describe("updateStatus()", () => {
    test("updates race status", async () => {
      await execSQL(
        env,
        `
        INSERT INTO races (id, season_id, round, name, location, circuit, country_code, quali_time, race_time, status)
          VALUES (1, 1, 1, 'Bahrain GP', 'Bahrain', 'Sakhir', 'BH', '2026-03-07T15:00:00Z', '2026-03-08T15:00:00Z', 'upcoming');
      `,
      );

      await repo.updateStatus(1, "in_progress");

      const race = await repo.getById(1);
      expect(race!.status).toBe("in_progress");
    });

    test("can update to completed", async () => {
      await execSQL(
        env,
        `
        INSERT INTO races (id, season_id, round, name, location, circuit, country_code, quali_time, race_time, status)
          VALUES (1, 1, 1, 'Bahrain GP', 'Bahrain', 'Sakhir', 'BH', '2026-03-07T15:00:00Z', '2026-03-08T15:00:00Z', 'in_progress');
      `,
      );

      await repo.updateStatus(1, "completed");

      const race = await repo.getById(1);
      expect(race!.status).toBe("completed");
    });
  });
});
