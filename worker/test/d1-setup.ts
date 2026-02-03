/**
 * D1 Test Environment Setup using Wrangler's getPlatformProxy
 *
 * Creates a real D1 database instance for integration testing.
 */

import { getPlatformProxy } from "wrangler";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import type { Env } from "../types";

let proxy: Awaited<ReturnType<typeof getPlatformProxy<Env>>> | null = null;
let migrationsApplied = false;

/**
 * Applies all migrations to the database.
 * Should only be called once per test run.
 */
async function applyMigrations(env: Env): Promise<void> {
  const migrationsDir = join(process.cwd(), "migrations");
  const migrations = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql") && !f.includes("seed"))
    .sort();

  for (const file of migrations) {
    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    // Split by semicolons and execute each statement
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const stmt of statements) {
      try {
        await env.DB.prepare(stmt).run();
      } catch (e) {
        // Ignore "already exists" errors for idempotent migrations
        const message = e instanceof Error ? e.message : String(e);
        if (!message.includes("already exists")) {
          throw e;
        }
      }
    }
  }
}

/**
 * Creates a test D1 environment with all migrations applied.
 * Reuses the same proxy instance for all tests, clearing tables between tests.
 */
export async function createTestD1Env(): Promise<Env> {
  if (!proxy) {
    proxy = await getPlatformProxy<Env>();
  }

  // Run migrations if not already applied
  if (!migrationsApplied) {
    await applyMigrations(proxy.env);
    migrationsApplied = true;
  }

  return proxy.env;
}

/**
 * Clear all data from D1 tables in dependency order.
 * Call this in beforeEach to isolate tests.
 */
export async function clearD1Tables(env: Env): Promise<void> {
  // Delete in dependency order (children before parents)
  const tables = [
    "user_season_stats",
    "race_results",
    "picks",
    "sessions",
    "races",
    "drivers",
    "seasons",
    "users",
  ];

  for (const table of tables) {
    await env.DB.prepare(`DELETE FROM ${table}`).run();
  }
}

/**
 * Clean up proxy instance. Call this in afterAll if needed.
 */
export async function cleanupProxy(): Promise<void> {
  if (proxy) {
    await proxy.dispose();
    proxy = null;
    migrationsApplied = false;
  }
}

/**
 * Execute multiple SQL statements safely.
 * Use this instead of env.DB.exec() in tests to avoid serialization issues.
 */
export async function execSQL(env: Env, sql: string): Promise<void> {
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await env.DB.prepare(stmt).run();
  }
}
