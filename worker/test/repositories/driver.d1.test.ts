import { describe, test, expect, beforeEach } from "bun:test";
import { createTestD1Env, clearD1Tables, execSQL } from "../d1-setup";
import { createD1DriverRepository } from "../../repositories/d1/driver.d1";
import type { Env } from "../../types";
import type { DriverRepository } from "../../repositories/interfaces/driver.repository";

describe("D1 DriverRepository", () => {
  let env: Env;
  let repo: DriverRepository;

  beforeEach(async () => {
    env = await createTestD1Env();
    await clearD1Tables(env);
    repo = createD1DriverRepository(env);

    // Seed a season for foreign key constraint
    await execSQL(
      env,
      `
      INSERT INTO seasons (id, year, name, is_active) VALUES (1, 2026, '2026', TRUE);
    `,
    );
  });

  describe("getBySeasonId()", () => {
    test("returns empty array when no drivers exist for season", async () => {
      const drivers = await repo.getBySeasonId(1);

      expect(drivers).toEqual([]);
    });

    test("returns drivers for the specified season", async () => {
      await execSQL(
        env,
        `
        INSERT INTO drivers (id, season_id, code, name, number, team, team_color)
          VALUES (1, 1, 'VER', 'Max Verstappen', 1, 'Red Bull Racing', '#1E41FF');
        INSERT INTO drivers (id, season_id, code, name, number, team, team_color)
          VALUES (2, 1, 'PER', 'Sergio Perez', 11, 'Red Bull Racing', '#1E41FF');
      `,
      );

      const drivers = await repo.getBySeasonId(1);

      expect(drivers).toHaveLength(2);
      expect(drivers[0].code).toBe("VER");
      expect(drivers[1].code).toBe("PER");
    });

    test("only returns drivers for the specified season", async () => {
      await execSQL(
        env,
        `
        INSERT INTO seasons (id, year, name, is_active) VALUES (2, 2025, '2025', FALSE);
        INSERT INTO drivers (id, season_id, code, name, number, team, team_color)
          VALUES (1, 1, 'VER', 'Verstappen 2026', 1, 'Red Bull', '#1E41FF');
        INSERT INTO drivers (id, season_id, code, name, number, team, team_color)
          VALUES (2, 2, 'VER', 'Verstappen 2025', 1, 'Red Bull', '#1E41FF');
      `,
      );

      const drivers = await repo.getBySeasonId(1);

      expect(drivers).toHaveLength(1);
      expect(drivers[0].name).toBe("Verstappen 2026");
    });

    test("returns drivers ordered by team then number", async () => {
      await execSQL(
        env,
        `
        INSERT INTO drivers (id, season_id, code, name, number, team, team_color)
          VALUES (1, 1, 'HAM', 'Lewis Hamilton', 44, 'Ferrari', '#DC0000');
        INSERT INTO drivers (id, season_id, code, name, number, team, team_color)
          VALUES (2, 1, 'LEC', 'Charles Leclerc', 16, 'Ferrari', '#DC0000');
        INSERT INTO drivers (id, season_id, code, name, number, team, team_color)
          VALUES (3, 1, 'VER', 'Max Verstappen', 1, 'Red Bull Racing', '#1E41FF');
      `,
      );

      const drivers = await repo.getBySeasonId(1);

      // Order: Ferrari (16, 44), Red Bull (1)
      expect(drivers[0].code).toBe("LEC"); // Ferrari, 16
      expect(drivers[1].code).toBe("HAM"); // Ferrari, 44
      expect(drivers[2].code).toBe("VER"); // Red Bull, 1
    });
  });

  describe("getById()", () => {
    test("returns null when driver does not exist", async () => {
      const driver = await repo.getById(999);

      expect(driver).toBeNull();
    });

    test("returns driver by id", async () => {
      await execSQL(
        env,
        `
        INSERT INTO drivers (id, season_id, code, name, number, team, team_color)
          VALUES (42, 1, 'VER', 'Max Verstappen', 1, 'Red Bull Racing', '#1E41FF');
      `,
      );

      const driver = await repo.getById(42);

      expect(driver).not.toBeNull();
      expect(driver!.id).toBe(42);
      expect(driver!.code).toBe("VER");
      expect(driver!.name).toBe("Max Verstappen");
      expect(driver!.number).toBe(1);
      expect(driver!.team).toBe("Red Bull Racing");
      expect(driver!.team_color).toBe("#1E41FF");
    });
  });
});
