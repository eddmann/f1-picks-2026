import worker from "../../index";
import type {
  Env,
  User,
  Season,
  Driver,
  Race,
  Pick,
  RaceResult,
  UserSeasonStats,
} from "../../types";
import { createTestD1Env, clearD1Tables } from "../d1-setup";
import {
  createUser,
  createSeason,
  createDriver,
  createRace,
  createPick,
  createRaceResult,
  createUserSeasonStats,
  resetAllFixtureCounters,
} from "../fixtures";

export async function createHttpEnv(): Promise<Env> {
  resetAllFixtureCounters();
  const env = await createTestD1Env();
  await clearD1Tables(env);

  if (!env.ASSETS) {
    env.ASSETS = {
      fetch: async () => new Response("Not found", { status: 404 }),
    };
  }

  return env;
}

export async function request(
  env: Env,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = new URL(path, "http://localhost");
  const req = new Request(url, init);
  const ctx: ExecutionContext = {
    waitUntil(_promise: Promise<unknown>) {
      void _promise;
    },
    passThroughOnException() {},
  };
  return worker.fetch(req, env, ctx);
}

export async function requestJson<T = unknown>(
  env: Env,
  path: string,
  init: RequestInit = {},
): Promise<{ res: Response; body: T }> {
  const headers = new Headers(init.headers);
  if (init.body) {
    headers.set("Content-Type", "application/json");
  }
  const res = await request(env, path, { ...init, headers });
  const body = (await res.json()) as T;
  return { res, body };
}

export async function registerAndLogin(
  env: Env,
  options: {
    email?: string;
    name?: string;
    password?: string;
    timezone?: string;
  } = {},
): Promise<{
  token: string;
  user: { id: number; email: string; name: string };
}> {
  const email = options.email ?? "user@test.com";
  const name = options.name ?? "Test User";
  const password = options.password ?? "password123";
  const timezone = options.timezone ?? "UTC";

  await requestJson(env, "/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, name, password, timezone }),
  });

  const login = await requestJson<{
    data: { user: { id: number; email: string; name: string }; token: string };
  }>(env, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return {
    token: login.body.data.token,
    user: login.body.data.user,
  };
}

export async function insertUser(
  env: Env,
  options?: Parameters<typeof createUser>[0],
): Promise<User> {
  const user = createUser(options);
  await env.DB.prepare(
    "INSERT INTO users (id, email, name, password_hash, timezone, is_admin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(
      user.id,
      user.email,
      user.name,
      user.password_hash,
      user.timezone,
      Number(user.is_admin),
      user.created_at,
    )
    .run();
  return user;
}

export async function insertSeason(
  env: Env,
  options?: Parameters<typeof createSeason>[0],
): Promise<Season> {
  const season = createSeason(options);
  await env.DB.prepare(
    "INSERT INTO seasons (id, year, name, is_active, created_at) VALUES (?, ?, ?, ?, ?)",
  )
    .bind(
      season.id,
      season.year,
      season.name,
      Number(season.is_active),
      season.created_at,
    )
    .run();
  return season;
}

export async function insertDriver(
  env: Env,
  options?: Parameters<typeof createDriver>[0],
): Promise<Driver> {
  const driver = createDriver(options);
  await env.DB.prepare(
    "INSERT INTO drivers (id, season_id, code, name, number, team, team_color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(
      driver.id,
      driver.season_id,
      driver.code,
      driver.name,
      driver.number,
      driver.team,
      driver.team_color,
      driver.created_at,
    )
    .run();
  return driver;
}

export async function insertRace(
  env: Env,
  options?: Parameters<typeof createRace>[0],
): Promise<Race> {
  const race = createRace(options);
  await env.DB.prepare(
    "INSERT INTO races (id, season_id, round, name, location, circuit, country_code, has_sprint, quali_time, sprint_quali_time, race_time, sprint_time, is_wild_card, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(
      race.id,
      race.season_id,
      race.round,
      race.name,
      race.location,
      race.circuit,
      race.country_code,
      Number(race.has_sprint),
      race.quali_time,
      race.sprint_quali_time,
      race.race_time,
      race.sprint_time,
      Number(race.is_wild_card),
      race.status,
      race.created_at,
    )
    .run();
  return race;
}

export async function insertPick(
  env: Env,
  options?: Parameters<typeof createPick>[0],
): Promise<Pick> {
  const pick = createPick(options);
  await env.DB.prepare(
    "INSERT INTO picks (id, user_id, race_id, driver_id, created_at) VALUES (?, ?, ?, ?, ?)",
  )
    .bind(pick.id, pick.user_id, pick.race_id, pick.driver_id, pick.created_at)
    .run();
  return pick;
}

export async function insertRaceResult(
  env: Env,
  options?: Parameters<typeof createRaceResult>[0],
): Promise<RaceResult> {
  const result = createRaceResult(options);
  await env.DB.prepare(
    "INSERT INTO race_results (id, race_id, driver_id, race_position, sprint_position, race_points, sprint_points, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(
      result.id,
      result.race_id,
      result.driver_id,
      result.race_position,
      result.sprint_position,
      result.race_points,
      result.sprint_points,
      result.created_at,
    )
    .run();
  return result;
}

export async function insertUserSeasonStats(
  env: Env,
  options?: Parameters<typeof createUserSeasonStats>[0],
): Promise<UserSeasonStats> {
  const stats = createUserSeasonStats(options);
  await env.DB.prepare(
    "INSERT INTO user_season_stats (id, user_id, season_id, total_points, races_completed, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(
      stats.id,
      stats.user_id,
      stats.season_id,
      stats.total_points,
      stats.races_completed,
      stats.created_at,
    )
    .run();
  return stats;
}

export async function setUserAdmin(
  env: Env,
  userId: number,
  isAdmin = true,
): Promise<void> {
  await env.DB.prepare("UPDATE users SET is_admin = ? WHERE id = ?")
    .bind(Number(isAdmin), userId)
    .run();
}
