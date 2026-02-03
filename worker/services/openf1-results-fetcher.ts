import type {
  F1ResultsFetcher,
  F1RaceInput,
  F1DriverResult,
} from "./f1-results-fetcher";

const OPENF1_BASE = "https://api.openf1.org/v1";

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

async function fetchMeetings(year: number): Promise<OpenF1Meeting[]> {
  const url = `${OPENF1_BASE}/meetings?year=${year}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`OpenF1 API error: ${response.status}`);
  }

  return response.json();
}

async function resolveMeetingKey(
  year: number,
  race: { name: string; country_code: string },
): Promise<number | null> {
  const meetings = await fetchMeetings(year);
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
): Promise<OpenF1Session[]> {
  const url = `${OPENF1_BASE}/sessions?year=${year}&meeting_key=${meetingKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`OpenF1 API error: ${response.status}`);
  }

  return response.json();
}

async function fetchFinalPositions(
  sessionKey: number,
): Promise<OpenF1Position[]> {
  const url = `${OPENF1_BASE}/position?session_key=${sessionKey}&position<=20`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`OpenF1 API error: ${response.status}`);
  }

  const positions: OpenF1Position[] = await response.json();
  const finalPositions = new Map<number, OpenF1Position>();
  for (const pos of positions) {
    finalPositions.set(pos.driver_number, pos);
  }

  return Array.from(finalPositions.values());
}

export async function fetchOpenF1Results(
  seasonYear: number,
  race: F1RaceInput,
): Promise<
  { ok: true; results: F1DriverResult[] } | { ok: false; message: string }
> {
  try {
    const meetingKey = await resolveMeetingKey(seasonYear, {
      name: race.name,
      country_code: race.country_code,
    });

    if (!meetingKey) {
      return { ok: false, message: "OpenF1 meeting not found for race" };
    }

    const sessions = await fetchSessions(seasonYear, meetingKey);
    const raceSession = sessions.find(
      (s) => s.session_type === "Race" && s.session_name !== "Sprint",
    );

    if (!raceSession) {
      return { ok: false, message: "Race session not found in OpenF1" };
    }

    const racePositions = await fetchFinalPositions(raceSession.session_key);

    let sprintPositions: OpenF1Position[] = [];
    const sprintSession = sessions.find(
      (s) => s.session_type === "Sprint" || s.session_name === "Sprint",
    );
    if (sprintSession) {
      sprintPositions = await fetchFinalPositions(sprintSession.session_key);
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

export const OpenF1ResultsFetcher: F1ResultsFetcher = {
  fetchResults: fetchOpenF1Results,
};
