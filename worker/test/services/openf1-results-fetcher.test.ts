import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import {
  createOpenF1ResultsFetcher,
  type OpenF1HttpClient,
} from "../../services/openf1-results-fetcher";

const fixturesDir = join(process.cwd(), "worker/test/fixtures/openf1");

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

function createTestFetcher(
  fetch: OpenF1HttpClient["fetch"],
  sleep: OpenF1HttpClient["sleep"] = async () => {},
) {
  return createOpenF1ResultsFetcher({ fetch, sleep });
}

describe("OpenF1ResultsFetcher", () => {
  test("fetches Bahrain 2025 race results (no sprint)", async () => {
    const fixtures = {
      "https://api.openf1.org/v1/meetings?year=2025":
        loadFixture("meetings_2025.json"),
      "https://api.openf1.org/v1/sessions?year=2025&meeting_key=1257":
        loadFixture("sessions_2025_bahrain.json"),
      "https://api.openf1.org/v1/position?session_key=10014&position<=20":
        loadFixture("positions_2025_bahrain_race.json"),
    };

    const fetcher = createTestFetcher(createFetchStub(fixtures));

    const result = await fetcher.fetchResults(2025, {
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

    const delays: number[] = [];
    const fetcher = createTestFetcher(createFetchStub(fixtures), async (ms) => {
      delays.push(ms);
    });

    const result = await fetcher.fetchResults(2024, {
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
    expect(delays).toEqual([400, 400, 400]);
  });

  test("returns ok: false when meeting is not found", async () => {
    const fixtures = {
      "https://api.openf1.org/v1/meetings?year=2025":
        loadFixture("meetings_2025.json"),
    };

    const fetcher = createTestFetcher(createFetchStub(fixtures));

    const result = await fetcher.fetchResults(2025, {
      name: "Imaginary Grand Prix",
      country_code: "ZZZ",
    });

    expect(result.ok).toBe(false);
  });

  test("retries a rate-limited request using Retry-After", async () => {
    const meetingsUrl = "https://api.openf1.org/v1/meetings?year=2025";
    const fixtures = {
      [meetingsUrl]: loadFixture("meetings_2025.json"),
      "https://api.openf1.org/v1/sessions?year=2025&meeting_key=1257":
        loadFixture("sessions_2025_bahrain.json"),
      "https://api.openf1.org/v1/position?session_key=10014&position<=20":
        loadFixture("positions_2025_bahrain_race.json"),
    };
    const calls = new Map<string, number>();
    const delays: number[] = [];
    const fetch = async (input: RequestInfo | URL) => {
      const url = input.toString();
      calls.set(url, (calls.get(url) ?? 0) + 1);

      if (url === meetingsUrl && calls.get(url) === 1) {
        return new Response("Rate limited", {
          status: 429,
          headers: { "Retry-After": "2" },
        });
      }

      const body = fixtures[url];
      if (!body) return new Response("Not Found", { status: 404 });
      return Response.json(body);
    };
    const fetcher = createTestFetcher(fetch, async (ms) => {
      delays.push(ms);
    });

    const result = await fetcher.fetchResults(2025, {
      name: "Bahrain Grand Prix",
      country_code: "BRN",
    });

    expect(result.ok).toBe(true);
    expect(calls.get(meetingsUrl)).toBe(2);
    expect(delays).toContain(2_000);
  });

  test("returns an error after exhausting rate-limit retries", async () => {
    let calls = 0;
    const delays: number[] = [];
    const fetcher = createTestFetcher(
      async () => {
        calls++;
        return new Response("Rate limited", { status: 429 });
      },
      async (ms) => {
        delays.push(ms);
      },
    );

    const result = await fetcher.fetchResults(2025, {
      name: "Bahrain Grand Prix",
      country_code: "BRN",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain("OpenF1 API error: 429");
    expect(calls).toBe(4);
    expect(delays.filter((delay) => delay >= 1_000)).toEqual([
      1_000, 2_000, 4_000,
    ]);
  });
});
