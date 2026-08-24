import type {
  F1ResultsFetcher,
  F1RaceInput,
  F1DriverResult,
} from "./f1-results-fetcher";

const OPENF1_BASE = "https://api.openf1.org/v1";
const REQUEST_SPACING_MS = 400;
const MAX_RATE_LIMIT_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1_000;

export interface OpenF1HttpClient {
  fetch(input: RequestInfo | URL): Promise<Response>;
  sleep(ms: number): Promise<void>;
}

type OpenF1Request = <T>(url: string) => Promise<T>;

const defaultHttpClient: OpenF1HttpClient = {
  fetch: (input) => globalThis.fetch(input),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

interface OpenF1Meeting {
  meeting_key: number;
  meeting_name?: string;
  meeting_official_name?: string;
  location?: string;
  country_code?: string;
  country_name?: string;
  circuit_short_name?: string;
}

interface OpenF1Session {
  session_key: number;
  session_name: string;
  session_type: string;
  meeting_key: number;
  date_start: string;
  date_end: string;
}

interface OpenF1Position {
  driver_number: number;
  position: number;
  date: string;
}

function normalizeText(value?: string | null): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/grand prix|gp/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getRetryDelayMs(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("Retry-After");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.max(seconds * 1_000, REQUEST_SPACING_MS);
    }

    const retryAt = Date.parse(retryAfter);
    if (!Number.isNaN(retryAt)) {
      return Math.max(retryAt - Date.now(), REQUEST_SPACING_MS);
    }
  }

  return INITIAL_RETRY_DELAY_MS * 2 ** attempt;
}

function createRequest(client: OpenF1HttpClient): OpenF1Request {
  let hasMadeRequest = false;

  return async function request<T>(url: string): Promise<T> {
    for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
      if (hasMadeRequest) {
        await client.sleep(REQUEST_SPACING_MS);
      }
      hasMadeRequest = true;

      const response = await client.fetch(url);
      if (response.ok) {
        return response.json() as Promise<T>;
      }

      const canRetry =
        response.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES;
      if (!canRetry) {
        throw new Error(`OpenF1 API error: ${response.status}`);
      }

      await client.sleep(getRetryDelayMs(response, attempt));
    }

    throw new Error("OpenF1 API retry limit exceeded");
  };
}

async function fetchMeetings(
  year: number,
  request: OpenF1Request,
): Promise<OpenF1Meeting[]> {
  const url = `${OPENF1_BASE}/meetings?year=${year}`;
  return request<OpenF1Meeting[]>(url);
}

async function resolveMeetingKey(
  year: number,
  race: { name: string; country_code: string },
  request: OpenF1Request,
): Promise<number | null> {
  const meetings = await fetchMeetings(year, request);
  const raceName = normalizeText(race.name);
  const raceCountry = race.country_code?.toUpperCase();

  let bestKey: number | null = null;
  let bestScore = 0;

  for (const meeting of meetings) {
    const meetingName = normalizeText(meeting.meeting_name);
    const officialName = normalizeText(meeting.meeting_official_name);
    let score = 0;
    if (raceName && meetingName.includes(raceName)) score += 5;
    if (raceName && officialName.includes(raceName)) score += 4;
    if (raceCountry && meeting.country_code?.toUpperCase() === raceCountry)
      score += 1;

    if (score > bestScore) {
      bestScore = score;
      bestKey = meeting.meeting_key;
    }
  }

  return bestScore > 0 ? bestKey : null;
}

async function fetchSessions(
  year: number,
  meetingKey: number,
  request: OpenF1Request,
): Promise<OpenF1Session[]> {
  const url = `${OPENF1_BASE}/sessions?year=${year}&meeting_key=${meetingKey}`;
  return request<OpenF1Session[]>(url);
}

async function fetchFinalPositions(
  sessionKey: number,
  request: OpenF1Request,
): Promise<OpenF1Position[]> {
  const url = `${OPENF1_BASE}/position?session_key=${sessionKey}&position<=20`;
  const positions = await request<OpenF1Position[]>(url);
  const finalPositions = new Map<number, OpenF1Position>();
  for (const pos of positions) {
    finalPositions.set(pos.driver_number, pos);
  }

  return Array.from(finalPositions.values());
}

export async function fetchOpenF1Results(
  seasonYear: number,
  race: F1RaceInput,
  client: OpenF1HttpClient = defaultHttpClient,
): Promise<
  { ok: true; results: F1DriverResult[] } | { ok: false; message: string }
> {
  try {
    const request = createRequest(client);
    const meetingKey = await resolveMeetingKey(
      seasonYear,
      {
        name: race.name,
        country_code: race.country_code,
      },
      request,
    );

    if (!meetingKey) {
      return { ok: false, message: "OpenF1 meeting not found for race" };
    }

    const sessions = await fetchSessions(seasonYear, meetingKey, request);
    const raceSession = sessions.find(
      (s) => s.session_type === "Race" && s.session_name !== "Sprint",
    );

    if (!raceSession) {
      return { ok: false, message: "Race session not found in OpenF1" };
    }

    const racePositions = await fetchFinalPositions(
      raceSession.session_key,
      request,
    );

    let sprintPositions: OpenF1Position[] = [];
    const sprintSession = sessions.find(
      (s) => s.session_type === "Sprint" || s.session_name === "Sprint",
    );
    if (sprintSession) {
      sprintPositions = await fetchFinalPositions(
        sprintSession.session_key,
        request,
      );
    }

    const racePositionMap = new Map(
      racePositions.map((p) => [p.driver_number, p.position]),
    );
    const sprintPositionMap = new Map(
      sprintPositions.map((p) => [p.driver_number, p.position]),
    );

    const results: F1DriverResult[] = [];
    for (const [driverNumber, racePosition] of racePositionMap.entries()) {
      const sprintPosition = sprintPositionMap.get(driverNumber) ?? null;
      if (racePosition !== null || sprintPosition !== null) {
        results.push({
          driver_number: driverNumber,
          race_position: racePosition,
          sprint_position: sprintPosition,
        });
      }
    }

    for (const [driverNumber, sprintPosition] of sprintPositionMap.entries()) {
      if (racePositionMap.has(driverNumber)) continue;
      if (sprintPosition !== null) {
        results.push({
          driver_number: driverNumber,
          race_position: null,
          sprint_position: sprintPosition,
        });
      }
    }

    return { ok: true, results };
  } catch (error) {
    return {
      ok: false,
      message: `OpenF1 sync failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export function createOpenF1ResultsFetcher(
  client: OpenF1HttpClient = defaultHttpClient,
): F1ResultsFetcher {
  return {
    fetchResults: (seasonYear, race) =>
      fetchOpenF1Results(seasonYear, race, client),
  };
}

export const OpenF1ResultsFetcher = createOpenF1ResultsFetcher();
