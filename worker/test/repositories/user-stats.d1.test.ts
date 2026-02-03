import { describe, test, expect, beforeEach } from "bun:test";
import { createTestD1Env, clearD1Tables, execSQL } from "../d1-setup";
import { createD1UserStatsRepository } from "../../repositories/d1/user-stats.d1";
import { createD1PickRepository } from "../../repositories/d1/pick.d1";
import { createD1RaceResultRepository } from "../../repositories/d1/race-result.d1";
import type { Env } from "../../types";
import type { UserStatsRepository } from "../../repositories/interfaces/user-stats.repository";

describe("D1 UserStatsRepository", () => {
  let env: Env;
  let repo: UserStatsRepository;

  beforeEach(async () => {
    env = await createTestD1Env();
    await clearD1Tables(env);
    repo = createD1UserStatsRepository(env);

    // Seed required data
    await execSQL(
      env,
      `
      INSERT INTO users (id, email, name, password_hash, timezone) VALUES (1, 'user1@test.com', 'User One', 'hash', 'UTC');
      INSERT INTO users (id, email, name, password_hash, timezone) VALUES (2, 'user2@test.com', 'User Two', 'hash', 'UTC');
      INSERT INTO users (id, email, name, password_hash, timezone) VALUES (3, 'user3@test.com', 'User Three', 'hash', 'UTC');
      INSERT INTO seasons (id, year, name, is_active) VALUES (1, 2026, '2026', TRUE);
    `,
    );
  });

  describe("getLeaderboard()", () => {
    test("returns empty array when no stats exist", async () => {
      const leaderboard = await repo.getLeaderboard(1);

      expect(leaderboard).toEqual([]);
    });

    test("returns all users with stats", async () => {
      await repo.upsert(1, 1, 100, 5);
      await repo.upsert(2, 1, 80, 5);

      const leaderboard = await repo.getLeaderboard(1);

      expect(leaderboard).toHaveLength(2);
    });

    test("includes user names", async () => {
      await repo.upsert(1, 1, 100, 5);

      const leaderboard = await repo.getLeaderboard(1);

      expect(leaderboard[0].user_name).toBe("User One");
    });

    test("orders by total_points descending", async () => {
      await repo.upsert(1, 1, 50, 3);
      await repo.upsert(2, 1, 100, 5);
      await repo.upsert(3, 1, 75, 4);

      const leaderboard = await repo.getLeaderboard(1);

      expect(leaderboard[0].total_points).toBe(100);
      expect(leaderboard[1].total_points).toBe(75);
      expect(leaderboard[2].total_points).toBe(50);
    });

    test("uses races_completed as tiebreaker", async () => {
      await repo.upsert(1, 1, 100, 3); // Same points, fewer races
      await repo.upsert(2, 1, 100, 5); // Same points, more races

      const leaderboard = await repo.getLeaderboard(1);

      // User 2 should be first (more races completed with same points)
      expect(leaderboard[0].user_id).toBe(2);
      expect(leaderboard[1].user_id).toBe(1);
    });
  });

  describe("getByUserAndSeason()", () => {
    test("returns null when no stats exist", async () => {
      const stats = await repo.getByUserAndSeason(1, 1);

      expect(stats).toBeNull();
    });

    test("returns stats when they exist", async () => {
      await repo.upsert(1, 1, 150, 7);

      const stats = await repo.getByUserAndSeason(1, 1);

      expect(stats).not.toBeNull();
      expect(stats!.total_points).toBe(150);
      expect(stats!.races_completed).toBe(7);
    });
  });

  describe("upsert()", () => {
    test("inserts new stats", async () => {
      const stats = await repo.upsert(1, 1, 100, 5);

      expect(stats.user_id).toBe(1);
      expect(stats.season_id).toBe(1);
      expect(stats.total_points).toBe(100);
      expect(stats.races_completed).toBe(5);
      expect(stats.id).toBeDefined();
    });

    test("updates existing stats", async () => {
      await repo.upsert(1, 1, 100, 5);

      const updated = await repo.upsert(1, 1, 150, 7);

      expect(updated.total_points).toBe(150);
      expect(updated.races_completed).toBe(7);
    });

    test("maintains unique constraint on user_id + season_id", async () => {
      await repo.upsert(1, 1, 100, 5);
      await repo.upsert(1, 1, 120, 6);

      const stats = await repo.getByUserAndSeason(1, 1);
      expect(stats!.total_points).toBe(120);

      const leaderboard = await repo.getLeaderboard(1);
      expect(leaderboard).toHaveLength(1);
    });
  });

  describe("calculateUserPoints()", () => {
    test("returns zero when no picks exist", async () => {
      const result = await repo.calculateUserPoints(1, 1);

      expect(result.totalPoints).toBe(0);
      expect(result.racesCompleted).toBe(0);
    });

    test("returns zero when no completed races", async () => {
      await execSQL(
        env,
        `
        INSERT INTO drivers (id, season_id, code, name, number, team, team_color) VALUES (1, 1, 'VER', 'Verstappen', 1, 'Red Bull', '#1E41FF');
        INSERT INTO races (id, season_id, round, name, location, circuit, country_code, quali_time, race_time, status)
          VALUES (1, 1, 1, 'Bahrain GP', 'Bahrain', 'Sakhir', 'BH', '2026-03-07T15:00:00Z', '2026-03-08T15:00:00Z', 'upcoming');
      `,
      );
      const pickRepo = createD1PickRepository(env);
      await pickRepo.create(1, 1, 1);

      const result = await repo.calculateUserPoints(1, 1);

      expect(result.totalPoints).toBe(0);
      expect(result.racesCompleted).toBe(0);
    });

    test("calculates points from completed races", async () => {
      await execSQL(
        env,
        `
        INSERT INTO drivers (id, season_id, code, name, number, team, team_color) VALUES (1, 1, 'VER', 'Verstappen', 1, 'Red Bull', '#1E41FF');
        INSERT INTO races (id, season_id, round, name, location, circuit, country_code, quali_time, race_time, status)
          VALUES (1, 1, 1, 'Bahrain GP', 'Bahrain', 'Sakhir', 'BH', '2026-03-07T15:00:00Z', '2026-03-08T15:00:00Z', 'completed');
      `,
      );
      const pickRepo = createD1PickRepository(env);
      const resultRepo = createD1RaceResultRepository(env);

      await pickRepo.create(1, 1, 1); // User picks driver 1
      await resultRepo.upsert(1, 1, 1, null, 25, 0); // Driver 1 wins

      const result = await repo.calculateUserPoints(1, 1);

      expect(result.totalPoints).toBe(25);
      expect(result.racesCompleted).toBe(1);
    });

    test("sums points from multiple races", async () => {
      await execSQL(
        env,
        `
        INSERT INTO drivers (id, season_id, code, name, number, team, team_color) VALUES (1, 1, 'VER', 'Verstappen', 1, 'Red Bull', '#1E41FF');
        INSERT INTO races (id, season_id, round, name, location, circuit, country_code, quali_time, race_time, status)
          VALUES (1, 1, 1, 'Bahrain GP', 'Bahrain', 'Sakhir', 'BH', '2026-03-07T15:00:00Z', '2026-03-08T15:00:00Z', 'completed');
        INSERT INTO races (id, season_id, round, name, location, circuit, country_code, quali_time, race_time, status)
          VALUES (2, 1, 2, 'Saudi GP', 'Saudi Arabia', 'Jeddah', 'SA', '2026-03-14T15:00:00Z', '2026-03-15T15:00:00Z', 'completed');
      `,
      );
      const pickRepo = createD1PickRepository(env);
      const resultRepo = createD1RaceResultRepository(env);

      await pickRepo.create(1, 1, 1);
      await pickRepo.create(1, 2, 1);
      await resultRepo.upsert(1, 1, 1, null, 25, 0);
      await resultRepo.upsert(2, 1, 2, null, 18, 0);

      const result = await repo.calculateUserPoints(1, 1);

      expect(result.totalPoints).toBe(43); // 25 + 18
      expect(result.racesCompleted).toBe(2);
    });

    test("includes sprint points", async () => {
      await execSQL(
        env,
        `
        INSERT INTO drivers (id, season_id, code, name, number, team, team_color) VALUES (1, 1, 'VER', 'Verstappen', 1, 'Red Bull', '#1E41FF');
        INSERT INTO races (id, season_id, round, name, location, circuit, country_code, quali_time, race_time, status, has_sprint)
          VALUES (1, 1, 1, 'Sprint GP', 'Test', 'Test', 'TE', '2026-03-07T15:00:00Z', '2026-03-08T15:00:00Z', 'completed', TRUE);
      `,
      );
      const pickRepo = createD1PickRepository(env);
      const resultRepo = createD1RaceResultRepository(env);

      await pickRepo.create(1, 1, 1);
      await resultRepo.upsert(1, 1, 1, 1, 25, 8);

      const result = await repo.calculateUserPoints(1, 1);

      expect(result.totalPoints).toBe(33); // 25 + 8
    });
  });
});
