import type {
  PublicUser,
  Driver,
  DriverWithAvailability,
  Race,
  Pick,
  PickWithDetails,
  LeaderboardEntry,
  Season,
} from "../types";

// Counter for unique IDs
let idCounter = 1;
const nextId = () => idCounter++;

function nextIdWithOverride(overrideId?: number) {
  if (overrideId !== undefined) {
    if (overrideId >= idCounter) {
      idCounter = overrideId + 1;
    }
    return overrideId;
  }
  return nextId();
}

// Reset counter between tests
export function resetIdCounter() {
  idCounter = 1;
}

export function createUser(overrides?: Partial<PublicUser>): PublicUser {
  return {
    id: nextIdWithOverride(overrides?.id),
    email: "test@example.com",
    name: "Test User",
    timezone: "America/New_York",
    is_admin: false,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function createDriver(overrides?: Partial<Driver>): Driver {
  const id = nextIdWithOverride(overrides?.id);
  return {
    id,
    season_id: 1,
    code: "VER",
    name: "Max Verstappen",
    number: 1,
    team: "Red Bull Racing",
    team_color: "#3671C6",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function createDriverWithAvailability(
  overrides?: Partial<DriverWithAvailability>,
): DriverWithAvailability {
  return {
    ...createDriver(overrides),
    is_available: true,
    ...overrides,
  };
}

export function createRace(overrides?: Partial<Race>): Race {
  const id = nextIdWithOverride(overrides?.id);
  // Default to a race with an open pick window (this week)
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1);
  monday.setHours(0, 0, 0, 0);

  const qualiTime = new Date(monday);
  qualiTime.setDate(qualiTime.getDate() + 5); // Saturday
  qualiTime.setHours(15, 0, 0, 0);

  const raceTime = new Date(monday);
  raceTime.setDate(raceTime.getDate() + 6); // Sunday
  raceTime.setHours(14, 0, 0, 0);

  return {
    id,
    season_id: 1,
    round: 1,
    name: "Bahrain Grand Prix",
    location: "Sakhir",
    circuit: "Bahrain International Circuit",
    country_code: "BH",
    has_sprint: false,
    quali_time: qualiTime.toISOString(),
    sprint_quali_time: null,
    race_time: raceTime.toISOString(),
    sprint_time: null,
    is_wild_card: false,
    status: "upcoming",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function createPick(overrides?: Partial<Pick>): Pick {
  return {
    id: nextIdWithOverride(overrides?.id),
    user_id: 1,
    race_id: 1,
    driver_id: 1,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function createPickWithDetails(
  overrides?: Partial<PickWithDetails>,
): PickWithDetails {
  const pickOverrides = overrides ?? {};
  const pick = createPick(pickOverrides);
  const driver = pickOverrides.driver ?? createDriver({ id: pick.driver_id });
  const race = pickOverrides.race ?? createRace({ id: pick.race_id });

  if (pickOverrides.driver && pickOverrides.driver_id === undefined) {
    pick.driver_id = driver.id;
  }
  if (pickOverrides.race && pickOverrides.race_id === undefined) {
    pick.race_id = race.id;
  }

  return {
    ...pick,
    driver,
    race,
    points: pickOverrides.points,
  };
}

export function createLeaderboardEntry(
  overrides?: Partial<LeaderboardEntry & { user_name: string }>,
): LeaderboardEntry & { user_name: string } {
  const userId = nextIdWithOverride(overrides?.user_id);
  return {
    rank: 1,
    user_id: userId,
    user_name: "Test User",
    total_points: 100,
    races_completed: 5,
    ...overrides,
  };
}

export function createSeason(overrides?: Partial<Season>): Season {
  return {
    id: nextIdWithOverride(overrides?.id),
    year: 2026,
    name: "2026 Season",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// Factory for multiple drivers with teams
export function createTeamDrivers(): DriverWithAvailability[] {
  return [
    createDriverWithAvailability({
      id: 1,
      code: "VER",
      name: "Max Verstappen",
      number: 1,
      team: "Red Bull Racing",
      team_color: "#3671C6",
    }),
    createDriverWithAvailability({
      id: 2,
      code: "PER",
      name: "Sergio Perez",
      number: 11,
      team: "Red Bull Racing",
      team_color: "#3671C6",
    }),
    createDriverWithAvailability({
      id: 3,
      code: "HAM",
      name: "Lewis Hamilton",
      number: 44,
      team: "Ferrari",
      team_color: "#E8002D",
    }),
    createDriverWithAvailability({
      id: 4,
      code: "LEC",
      name: "Charles Leclerc",
      number: 16,
      team: "Ferrari",
      team_color: "#E8002D",
    }),
    createDriverWithAvailability({
      id: 5,
      code: "NOR",
      name: "Lando Norris",
      number: 4,
      team: "McLaren",
      team_color: "#FF8000",
    }),
    createDriverWithAvailability({
      id: 6,
      code: "PIA",
      name: "Oscar Piastri",
      number: 81,
      team: "McLaren",
      team_color: "#FF8000",
    }),
  ];
}

// Create standings for leaderboard tests
export function createStandings(
  count = 5,
): (LeaderboardEntry & { user_name: string })[] {
  return Array.from({ length: count }, (_, i) => ({
    rank: i + 1,
    user_id: i + 1,
    user_name: `Player ${i + 1}`,
    total_points: 100 - i * 10,
    races_completed: 5,
  }));
}
