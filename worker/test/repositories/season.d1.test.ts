import { describe, test, expect, beforeEach } from "bun:test";
import { createTestD1Env, clearD1Tables, execSQL } from "../d1-setup";
import { createD1SeasonRepository } from "../../repositories/d1/season.d1";
import type { Env } from "../../types";
import type { SeasonRepository } from "../../repositories/interfaces/season.repository";

describe("D1 SeasonRepository", () => {
  let env: Env;
  let repo: SeasonRepository;

  beforeEach(async () => {
    env = await createTestD1Env();
    await clearD1Tables(env);
    repo = createD1SeasonRepository(env);
  });

  describe("getActiveSeason()", () => {
    test("returns null when no seasons exist", async () => {
      const season = await repo.getActiveSeason();

      expect(season).toBeNull();
    });

    test("returns null when no active season exists", async () => {
      await execSQL(
        env,
        `
        INSERT INTO seasons (id, year, name, is_active) VALUES (1, 2025, '2025', FALSE);
      `,
      );

      const season = await repo.getActiveSeason();

      expect(season).toBeNull();
    });

    test("returns the active season", async () => {
      await execSQL(
        env,
        `
        INSERT INTO seasons (id, year, name, is_active) VALUES (1, 2025, '2025', FALSE);
        INSERT INTO seasons (id, year, name, is_active) VALUES (2, 2026, '2026', TRUE);
      `,
      );

      const season = await repo.getActiveSeason();

      expect(season).not.toBeNull();
      expect(season!.year).toBe(2026);
      expect(season!.is_active).toBe(1); // SQLite returns 1 for TRUE
    });
  });

  describe("getByYear()", () => {
    test("returns null when year does not exist", async () => {
      const season = await repo.getByYear(2026);

      expect(season).toBeNull();
    });

    test("returns season by year", async () => {
      await execSQL(
        env,
        `
        INSERT INTO seasons (id, year, name, is_active) VALUES (1, 2026, '2026 Season', TRUE);
      `,
      );

      const season = await repo.getByYear(2026);

      expect(season).not.toBeNull();
      expect(season!.year).toBe(2026);
      expect(season!.name).toBe("2026 Season");
    });
  });

  describe("getById()", () => {
    test("returns null when id does not exist", async () => {
      const season = await repo.getById(999);

      expect(season).toBeNull();
    });

    test("returns season by id", async () => {
      await execSQL(
        env,
        `
        INSERT INTO seasons (id, year, name, is_active) VALUES (42, 2026, '2026', TRUE);
      `,
      );

      const season = await repo.getById(42);

      expect(season).not.toBeNull();
      expect(season!.id).toBe(42);
      expect(season!.year).toBe(2026);
    });
  });
});
