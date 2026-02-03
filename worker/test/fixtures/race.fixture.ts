import type { Race, RaceStatus } from "../../../shared/types";

let raceIdCounter = 1;

// Real F1 2026 race calendar template
const F1_RACES = [
  {
    round: 1,
    name: "Bahrain Grand Prix",
    location: "Sakhir",
    circuit: "Bahrain International Circuit",
    countryCode: "BH",
  },
  {
    round: 2,
    name: "Saudi Arabian Grand Prix",
    location: "Jeddah",
    circuit: "Jeddah Corniche Circuit",
    countryCode: "SA",
  },
  {
    round: 3,
    name: "Australian Grand Prix",
    location: "Melbourne",
    circuit: "Albert Park Circuit",
    countryCode: "AU",
  },
  {
    round: 4,
    name: "Japanese Grand Prix",
    location: "Suzuka",
    circuit: "Suzuka International Racing Course",
    countryCode: "JP",
  },
  {
    round: 5,
    name: "Chinese Grand Prix",
    location: "Shanghai",
    circuit: "Shanghai International Circuit",
    countryCode: "CN",
    hasSprint: true,
  },
  {
    round: 6,
    name: "Miami Grand Prix",
    location: "Miami",
    circuit: "Miami International Autodrome",
    countryCode: "US",
    hasSprint: true,
  },
  {
    round: 7,
    name: "Monaco Grand Prix",
    location: "Monte Carlo",
    circuit: "Circuit de Monaco",
    countryCode: "MC",
  },
  {
    round: 8,
    name: "Canadian Grand Prix",
    location: "Montreal",
    circuit: "Circuit Gilles Villeneuve",
    countryCode: "CA",
  },
];

export interface CreateRaceOptions {
  id?: number;
  seasonId?: number;
  round?: number;
  name?: string;
  location?: string;
  circuit?: string;
  countryCode?: string;
  hasSprint?: boolean;
  qualiTime?: string | Date;
  sprintQualiTime?: string | Date | null;
  raceTime?: string | Date;
  sprintTime?: string | Date | null;
  isWildCard?: boolean;
  status?: RaceStatus;
  createdAt?: string;
}

/**
 * Get a default qualifying time for a race
 * Typically Saturday at 15:00 UTC
 */
function getDefaultQualiTime(round: number): Date {
  const baseDate = new Date("2026-03-14T15:00:00Z"); // First race weekend
  baseDate.setDate(baseDate.getDate() + (round - 1) * 7);
  return baseDate;
}

/**
 * Get a default race time (1 day after quali)
 */
function getDefaultRaceTime(qualiTime: Date): Date {
  const raceTime = new Date(qualiTime);
  raceTime.setDate(raceTime.getDate() + 1);
  raceTime.setHours(14, 0, 0, 0); // Race typically at 14:00 UTC
  return raceTime;
}

export function createRace(options: CreateRaceOptions = {}): Race {
  const id = options.id ?? raceIdCounter++;
  const round = options.round ?? id;
  const templateIndex = (round - 1) % F1_RACES.length;
  const template = F1_RACES[templateIndex];

  const qualiTime =
    options.qualiTime instanceof Date
      ? options.qualiTime
      : options.qualiTime
        ? new Date(options.qualiTime)
        : getDefaultQualiTime(round);

  const raceTime =
    options.raceTime instanceof Date
      ? options.raceTime
      : options.raceTime
        ? new Date(options.raceTime)
        : getDefaultRaceTime(qualiTime);

  const hasSprint = options.hasSprint ?? template.hasSprint ?? false;

  // Sprint quali is 1 day before regular quali at 10:30
  const sprintQualiTime = hasSprint
    ? options.sprintQualiTime instanceof Date
      ? options.sprintQualiTime
      : options.sprintQualiTime
        ? new Date(options.sprintQualiTime)
        : (() => {
            const sqt = new Date(qualiTime);
            sqt.setDate(sqt.getDate() - 1);
            sqt.setHours(10, 30, 0, 0);
            return sqt;
          })()
    : null;

  // Sprint is 1 day before race at 15:00
  const sprintTime = hasSprint
    ? options.sprintTime instanceof Date
      ? options.sprintTime
      : options.sprintTime
        ? new Date(options.sprintTime)
        : (() => {
            const st = new Date(raceTime);
            st.setDate(st.getDate() - 1);
            st.setHours(15, 0, 0, 0);
            return st;
          })()
    : null;

  // Wild card races are rounds 23 and 24
  const isWildCard = options.isWildCard ?? round >= 23;

  return {
    id,
    season_id: options.seasonId ?? 1,
    round,
    name: options.name ?? template.name,
    location: options.location ?? template.location,
    circuit: options.circuit ?? template.circuit,
    country_code: options.countryCode ?? template.countryCode,
    has_sprint: hasSprint,
    quali_time: qualiTime.toISOString(),
    sprint_quali_time: sprintQualiTime?.toISOString() ?? null,
    race_time: raceTime.toISOString(),
    sprint_time: sprintTime?.toISOString() ?? null,
    is_wild_card: isWildCard,
    status: options.status ?? "upcoming",
    created_at: options.createdAt ?? new Date().toISOString(),
  };
}

export function createSprintRace(options: CreateRaceOptions = {}): Race {
  return createRace({ ...options, hasSprint: true });
}

export function createWildCardRace(options: CreateRaceOptions = {}): Race {
  return createRace({
    ...options,
    round: options.round ?? 23,
    isWildCard: true,
  });
}

export function createCompletedRace(options: CreateRaceOptions = {}): Race {
  return createRace({ ...options, status: "completed" });
}

export function createRaces(
  count: number,
  options: CreateRaceOptions = {},
): Race[] {
  return Array.from({ length: count }, (_, i) =>
    createRace({ ...options, round: (options.round ?? 1) + i }),
  );
}

export function resetRaceIdCounter(): void {
  raceIdCounter = 1;
}
