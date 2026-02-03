import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { OpenF1ResultsFetcher } from "../../services/openf1-results-fetcher";

const fixturesDir = join(process.cwd(), "worker/test/fixtures/openf1");
const originalFetch = globalThis.fetch;

function loadFixture(name: string) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf-8"));
}

function createFetchStub(fixtures: Record<string, unknown>) {
  return async (input: RequestInfo | URL) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const body = fixtures[url];
    if (!body) {
      return new Response("Not Found", { status: 404 });
    }

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
}

describe("OpenF1ResultsFetcher", () => {
  beforeEach(() => {
    globalThis.fetch = originalFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("fetches Bahrain 2025 race results (no sprint)", async () => {
    const fixtures = {
      "https://api.openf1.org/v1/meetings?year=2025":
        loadFixture("meetings_2025.json"),
      "https://api.openf1.org/v1/sessions?year=2025&meeting_key=1257":
        loadFixture("sessions_2025_bahrain.json"),
      "https://api.openf1.org/v1/position?session_key=10014&position<=20":
        loadFixture("positions_2025_bahrain_race.json"),
    };

    globalThis.fetch = createFetchStub(fixtures);

    const result = await OpenF1ResultsFetcher.fetchResults(2025, {
      name: "Bahrain Grand Prix",
      country_code: "BRN",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.results.length).toBe(20);
    const p1 = result.results.find((r) => r.driver_number === 81);
    expect(p1?.race_position).toBe(1);
    expect(p1?.sprint_position).toBeNull();
  });

  test("fetches Chinese GP 2024 race + sprint results", async () => {
    const fixtures = {
      "https://api.openf1.org/v1/meetings?year=2024":
        loadFixture("meetings_2024.json"),
      "https://api.openf1.org/v1/sessions?year=2024&meeting_key=1233":
        loadFixture("sessions_2024_china.json"),
      "https://api.openf1.org/v1/position?session_key=9673&position<=20":
        loadFixture("positions_2024_china_race.json"),
      "https://api.openf1.org/v1/position?session_key=9672&position<=20":
        loadFixture("positions_2024_china_sprint.json"),
    };

    globalThis.fetch = createFetchStub(fixtures);

    const result = await OpenF1ResultsFetcher.fetchResults(2024, {
      name: "Chinese Grand Prix",
      country_code: "CHN",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.results.length).toBe(20);
    const winner = result.results.find((r) => r.driver_number === 1);
    expect(winner?.race_position).toBe(1);
    expect(winner?.sprint_position).toBe(1);

    const lewis = result.results.find((r) => r.driver_number === 44);
    expect(lewis?.race_position).toBe(9);
    expect(lewis?.sprint_position).toBe(2);
  });

  test("returns ok: false when meeting is not found", async () => {
    const fixtures = {
      "https://api.openf1.org/v1/meetings?year=2025":
        loadFixture("meetings_2025.json"),
    };

    globalThis.fetch = createFetchStub(fixtures);

    const result = await OpenF1ResultsFetcher.fetchResults(2025, {
      name: "Imaginary Grand Prix",
      country_code: "ZZZ",
    });

    expect(result.ok).toBe(false);
  });
});
