import type {
  PublicUser,
  Season,
  Driver,
  Race,
  PickWithDetails,
  LeaderboardEntry,
  RaceResult,
} from "../types";
import type { DemoScenarioId } from "./scenarios";

export type RaceResultsPayload = {
  race: Race;
  results: (RaceResult & { driver: Driver })[];
  picks: (PickWithDetails & { user_name: string; points: number })[];
};

export type DemoData = {
  scenario: DemoScenarioId;
  season: Season;
  user: PublicUser;
  token: string;
  drivers: Driver[];
  races: Race[];
  picks: PickWithDetails[];
  leaderboard: (LeaderboardEntry & { user_name: string })[];
  currentRaceId: number;
  raceResults: Record<number, RaceResultsPayload>;
};

const CREATED_AT = "2026-01-01T00:00:00Z";
const SEASON_ID = 1;

const now = () => new Date();

const isoFromNow = (offset: {
  days?: number;
  hours?: number;
  minutes?: number;
}) => {
  const base = now().getTime();
  const days = offset.days ?? 0;
  const hours = offset.hours ?? 0;
  const minutes = offset.minutes ?? 0;
  const ms = ((days * 24 + hours) * 60 + minutes) * 60 * 1000;
  return new Date(base + ms).toISOString();
};

const buildSeason = (): Season => ({
  id: SEASON_ID,
  year: 2026,
  name: "2026 Season",
  is_active: true,
  created_at: CREATED_AT,
});

const buildDrivers = (): Driver[] => [
  {
    id: 1,
    season_id: SEASON_ID,
    code: "VER",
    name: "Max Verstappen",
    number: 1,
    team: "Red Bull Racing",
    team_color: "#3671C6",
    created_at: CREATED_AT,
  },
  {
    id: 2,
    season_id: SEASON_ID,
    code: "PER",
    name: "Sergio Perez",
    number: 11,
    team: "Red Bull Racing",
    team_color: "#3671C6",
    created_at: CREATED_AT,
  },
  {
    id: 3,
    season_id: SEASON_ID,
    code: "HAM",
    name: "Lewis Hamilton",
    number: 44,
    team: "Ferrari",
    team_color: "#E8002D",
    created_at: CREATED_AT,
  },
  {
    id: 4,
    season_id: SEASON_ID,
    code: "LEC",
    name: "Charles Leclerc",
    number: 16,
    team: "Ferrari",
    team_color: "#E8002D",
    created_at: CREATED_AT,
  },
  {
    id: 5,
    season_id: SEASON_ID,
    code: "NOR",
    name: "Lando Norris",
    number: 4,
    team: "McLaren",
    team_color: "#FF8000",
    created_at: CREATED_AT,
  },
  {
    id: 6,
    season_id: SEASON_ID,
    code: "PIA",
    name: "Oscar Piastri",
    number: 81,
    team: "McLaren",
    team_color: "#FF8000",
    created_at: CREATED_AT,
  },
  {
    id: 7,
    season_id: SEASON_ID,
    code: "RUS",
    name: "George Russell",
    number: 63,
    team: "Mercedes",
    team_color: "#6CD3BF",
    created_at: CREATED_AT,
  },
  {
    id: 8,
    season_id: SEASON_ID,
    code: "ALO",
    name: "Fernando Alonso",
    number: 14,
    team: "Aston Martin",
    team_color: "#229971",
    created_at: CREATED_AT,
  },
  {
    id: 9,
    season_id: SEASON_ID,
    code: "SAI",
    name: "Carlos Sainz",
    number: 55,
    team: "Williams",
    team_color: "#005AFF",
    created_at: CREATED_AT,
  },
  {
    id: 10,
    season_id: SEASON_ID,
    code: "GAS",
    name: "Pierre Gasly",
    number: 10,
    team: "Alpine",
    team_color: "#0090FF",
    created_at: CREATED_AT,
  },
];

const buildRace = (
  race: Partial<Race> &
    Pick<
      Race,
      "id" | "round" | "name" | "location" | "circuit" | "country_code"
    >,
): Race => ({
  id: race.id,
  season_id: SEASON_ID,
  round: race.round,
  name: race.name,
  location: race.location,
  circuit: race.circuit,
  country_code: race.country_code,
  has_sprint: race.has_sprint ?? false,
  quali_time: race.quali_time ?? isoFromNow({ days: 2, hours: 14 }),
  sprint_quali_time: race.sprint_quali_time ?? null,
  race_time: race.race_time ?? isoFromNow({ days: 3, hours: 14 }),
  sprint_time: race.sprint_time ?? null,
  is_wild_card: race.is_wild_card ?? false,
  status: race.status ?? "upcoming",
  created_at: CREATED_AT,
});

const buildRaces = (): Race[] => [
  buildRace({
    id: 5,
    round: 1,
    name: "Japanese Grand Prix",
    location: "Suzuka",
    circuit: "Suzuka Circuit",
    country_code: "JP",
    has_sprint: false,
    quali_time: isoFromNow({ days: -15, hours: 6 }),
    race_time: isoFromNow({ days: -14, hours: 6 }),
    status: "completed",
  }),
  buildRace({
    id: 4,
    round: 2,
    name: "Chinese Grand Prix",
    location: "Shanghai",
    circuit: "Shanghai International Circuit",
    country_code: "CN",
    has_sprint: true,
    sprint_quali_time: isoFromNow({ days: -9, hours: 8 }),
    quali_time: isoFromNow({ days: -8, hours: 10 }),
    sprint_time: isoFromNow({ days: -8, hours: 6 }),
    race_time: isoFromNow({ days: -7, hours: 10 }),
    status: "completed",
  }),
  buildRace({
    id: 3,
    round: 3,
    name: "Australian Grand Prix",
    location: "Melbourne",
    circuit: "Albert Park Circuit",
    country_code: "AU",
    has_sprint: false,
    quali_time: isoFromNow({ hours: -22 }),
    race_time: isoFromNow({ hours: 4 }),
    status: "in_progress",
  }),
  buildRace({
    id: 1,
    round: 4,
    name: "Bahrain Grand Prix",
    location: "Sakhir",
    circuit: "Bahrain International Circuit",
    country_code: "BH",
    has_sprint: false,
    quali_time: isoFromNow({ days: 2, hours: 12 }),
    race_time: isoFromNow({ days: 3, hours: 12 }),
    status: "upcoming",
  }),
  buildRace({
    id: 2,
    round: 5,
    name: "Saudi Arabian Grand Prix",
    location: "Jeddah",
    circuit: "Jeddah Corniche Circuit",
    country_code: "SA",
    has_sprint: true,
    sprint_quali_time: isoFromNow({ days: 9, hours: 11 }),
    quali_time: isoFromNow({ days: 10, hours: 15 }),
    sprint_time: isoFromNow({ days: 10, hours: 10 }),
    race_time: isoFromNow({ days: 11, hours: 15 }),
    status: "upcoming",
    is_wild_card: true,
  }),
  buildRace({
    id: 6,
    round: 6,
    name: "Monaco Grand Prix",
    location: "Monte Carlo",
    circuit: "Circuit de Monaco",
    country_code: "MC",
    has_sprint: false,
    quali_time: isoFromNow({ hours: -6 }),
    race_time: isoFromNow({ hours: 18 }),
    status: "upcoming",
  }),
];

const buildUser = (scenario: DemoScenarioId): PublicUser => ({
  id: 101,
  email: scenario === "admin" ? "admin@f1picks.demo" : "demo@f1picks.demo",
  name: scenario === "admin" ? "Race Director" : "Demo Driver",
  timezone: "America/New_York",
  is_admin: scenario === "admin",
  created_at: CREATED_AT,
});

const buildToken = (scenario: DemoScenarioId) => `demo-token-${scenario}`;

const buildPick = (params: {
  id: number;
  userId: number;
  race: Race;
  driver: Driver;
  points?: number;
}): PickWithDetails => ({
  id: params.id,
  user_id: params.userId,
  race_id: params.race.id,
  driver_id: params.driver.id,
  created_at: params.race.race_time,
  driver: params.driver,
  race: params.race,
  points: params.points,
});

const buildResults = (
  race: Race,
  drivers: Driver[],
): (RaceResult & { driver: Driver })[] =>
  drivers.slice(0, 6).map((driver, index) => ({
    id: race.id * 100 + driver.id,
    race_id: race.id,
    driver_id: driver.id,
    race_position: index + 1,
    sprint_position: race.has_sprint ? index + 1 : null,
    race_points: Math.max(25 - index * 5, 0),
    sprint_points: race.has_sprint ? Math.max(8 - index, 0) : 0,
    created_at: race.race_time,
    driver,
  }));

const buildRaceResults = (
  race: Race,
  drivers: Driver[],
  picks: (PickWithDetails & { user_name: string; points: number })[],
): RaceResultsPayload => ({
  race,
  results: buildResults(race, drivers),
  picks,
});

const buildLeaderboard = (
  scenario: DemoScenarioId,
  userId: number,
): (LeaderboardEntry & { user_name: string })[] => {
  if (scenario === "fresh") {
    return [
      {
        rank: 1,
        user_id: userId,
        user_name: "Demo Driver",
        total_points: 0,
        races_completed: 0,
      },
    ];
  }

  return [
    {
      rank: 1,
      user_id: 201,
      user_name: "Casey",
      total_points: 92,
      races_completed: 3,
    },
    {
      rank: 2,
      user_id: 202,
      user_name: "Jordan",
      total_points: 86,
      races_completed: 3,
    },
    {
      rank: 3,
      user_id: userId,
      user_name: scenario === "admin" ? "Race Director" : "Demo Driver",
      total_points: 79,
      races_completed: 3,
    },
    {
      rank: 4,
      user_id: 203,
      user_name: "Sam",
      total_points: 71,
      races_completed: 3,
    },
  ];
};

export const buildDemoData = (scenario: DemoScenarioId): DemoData => {
  const season = buildSeason();
  const drivers = buildDrivers();
  const races = buildRaces();
  const user = buildUser(scenario);
  const token = buildToken(scenario);

  const raceById = new Map(races.map((race) => [race.id, race]));
  const driverById = new Map(drivers.map((driver) => [driver.id, driver]));

  const basePicks: PickWithDetails[] = [];

  if (scenario !== "fresh") {
    const pickDefinitions = [
      { id: 1, raceId: 5, driverId: 1, points: 18 },
      { id: 2, raceId: 4, driverId: 3, points: 25 },
      { id: 3, raceId: 3, driverId: 7 },
      { id: 4, raceId: 1, driverId: 2 },
    ];

    pickDefinitions.forEach((pick) => {
      const race = raceById.get(pick.raceId);
      const driver = driverById.get(pick.driverId);
      if (!race || !driver) return;
      basePicks.push(
        buildPick({
          id: pick.id,
          userId: user.id,
          race,
          driver,
          points: pick.points,
        }),
      );
    });
  }

  if (scenario === "locked") {
    const lockedRace = raceById.get(6);
    const driver = driverById.get(5);
    if (lockedRace && driver) {
      basePicks.push(
        buildPick({
          id: 99,
          userId: user.id,
          race: lockedRace,
          driver,
        }),
      );
    }
  }

  const currentRaceId = scenario === "locked" ? 6 : 1;

  const leaderboard = buildLeaderboard(scenario, user.id);

  const picksForResults: (PickWithDetails & {
    user_name: string;
    points: number;
  })[] = [
    {
      ...buildPick({
        id: 301,
        userId: 201,
        race: raceById.get(4)!,
        driver: driverById.get(1)!,
        points: 26,
      }),
      user_name: "Casey",
      points: 26,
    },
    {
      ...buildPick({
        id: 302,
        userId: 202,
        race: raceById.get(4)!,
        driver: driverById.get(3)!,
        points: 24,
      }),
      user_name: "Jordan",
      points: 24,
    },
    {
      ...buildPick({
        id: 303,
        userId: user.id,
        race: raceById.get(4)!,
        driver: driverById.get(5)!,
        points: 18,
      }),
      user_name: user.name,
      points: 18,
    },
  ];

  const raceResults: Record<number, RaceResultsPayload> = {
    4: buildRaceResults(raceById.get(4)!, drivers, picksForResults),
    5: buildRaceResults(raceById.get(5)!, drivers, []),
  };

  return {
    scenario,
    season,
    user,
    token,
    drivers,
    races,
    picks: basePicks,
    leaderboard,
    currentRaceId,
    raceResults,
  };
};
