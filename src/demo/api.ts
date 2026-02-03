import type {
  ApiResponse,
  PublicUser,
  Season,
  Driver,
  DriverWithAvailability,
  Race,
  PickWithDetails,
  LeaderboardEntry,
  RaceResult,
  LoginForm,
  RegisterForm,
} from "../types";
import { getDemoData, updateDemoData } from "./store";

const ok = <T>(data: T): ApiResponse<T> => ({ data });

const findById = <T extends { id: number }>(items: T[], id: number) =>
  items.find((item) => item.id === id) ?? null;

const getUsedDriverIds = (picks: PickWithDetails[], currentRaceId: number) => {
  const used = new Set<number>();
  picks.forEach((pick) => {
    if (pick.race_id === currentRaceId) return;
    if (!pick.race?.is_wild_card) {
      used.add(pick.driver_id);
    }
  });
  return Array.from(used);
};

const buildAvailableDrivers = (
  drivers: Driver[],
  picks: PickWithDetails[],
  currentRaceId: number,
): { drivers: DriverWithAvailability[]; used_driver_ids: number[] } => {
  const usedDriverIds = getUsedDriverIds(picks, currentRaceId);
  return {
    drivers: drivers.map((driver) => ({
      ...driver,
      is_available: !usedDriverIds.includes(driver.id),
    })),
    used_driver_ids: usedDriverIds,
  };
};

export async function login(
  credentials: LoginForm,
): Promise<ApiResponse<{ user: PublicUser; token: string }>> {
  void credentials;
  const data = getDemoData();
  return ok({ user: data.user, token: data.token });
}

export async function register(
  form: RegisterForm,
): Promise<ApiResponse<{ user: PublicUser; token: string }>> {
  const updated = updateDemoData((current) => ({
    ...current,
    user: {
      ...current.user,
      name: form.name,
      email: form.email,
      timezone: form.timezone ?? current.user.timezone,
    },
  }));
  return ok({ user: updated.user, token: updated.token });
}

export async function logout(): Promise<ApiResponse<{ success: boolean }>> {
  return ok({ success: true });
}

export async function getCurrentUser(): Promise<
  ApiResponse<{ user: PublicUser }>
> {
  const data = getDemoData();
  return ok({ user: data.user });
}

export async function getCurrentSeason(): Promise<
  ApiResponse<{ season: Season }>
> {
  const data = getDemoData();
  return ok({ season: data.season });
}

export async function getDrivers(): Promise<
  ApiResponse<{ drivers: Driver[] }>
> {
  const data = getDemoData();
  return ok({ drivers: data.drivers });
}

export async function getAvailableDrivers(): Promise<
  ApiResponse<{ drivers: DriverWithAvailability[]; used_driver_ids: number[] }>
> {
  const data = getDemoData();
  return ok(
    buildAvailableDrivers(data.drivers, data.picks, data.currentRaceId),
  );
}

export async function getRaces(): Promise<ApiResponse<{ races: Race[] }>> {
  const data = getDemoData();
  return ok({ races: data.races });
}

export async function getCurrentRace(): Promise<ApiResponse<{ race: Race }>> {
  const data = getDemoData();
  const race = findById(data.races, data.currentRaceId) ?? data.races[0];
  return ok({ race });
}

export async function getRace(
  id: number,
): Promise<ApiResponse<{ race: Race }>> {
  const data = getDemoData();
  const race = findById(data.races, id);
  if (!race) return { error: "Race not found" };
  return ok({ race });
}

export async function getRaceResults(id: number): Promise<
  ApiResponse<{
    race: Race;
    results: (RaceResult & { driver: Driver })[];
    picks: (PickWithDetails & { user_name: string; points: number })[];
  }>
> {
  const data = getDemoData();
  const race = findById(data.races, id);
  if (!race) return { error: "Race not found" };

  const payload = data.raceResults[id];
  if (payload) {
    return ok(payload);
  }

  return ok({ race, results: [], picks: [] });
}

export async function getPicks(): Promise<
  ApiResponse<{ picks: PickWithDetails[] }>
> {
  const data = getDemoData();
  return ok({ picks: data.picks });
}

export async function createPick(
  raceId: number,
  driverId: number,
): Promise<ApiResponse<{ pick: PickWithDetails }>> {
  const updated = updateDemoData((current) => {
    const race = findById(current.races, raceId);
    const driver = findById(current.drivers, driverId);

    if (!race || !driver) return current;

    const nextPick: PickWithDetails = {
      id: Date.now(),
      user_id: current.user.id,
      race_id: race.id,
      driver_id: driver.id,
      created_at: new Date().toISOString(),
      race,
      driver,
    };

    const nextPicks = current.picks.filter((pick) => pick.race_id !== raceId);
    nextPicks.push(nextPick);

    return { ...current, picks: nextPicks };
  });

  const pick = updated.picks.find((p) => p.race_id === raceId);
  if (!pick) return { error: "Unable to create pick" };
  return ok({ pick });
}

export async function getLeaderboard(): Promise<
  ApiResponse<{
    season: Season;
    standings: (LeaderboardEntry & { user_name: string })[];
  }>
> {
  const data = getDemoData();
  return ok({ season: data.season, standings: data.leaderboard });
}

export async function submitRaceResults(
  raceId: number,
  results: {
    driver_id: number;
    race_position: number | null;
    sprint_position?: number | null;
  }[],
): Promise<ApiResponse<{ results: RaceResult[]; race_status: string }>> {
  const data = getDemoData();
  const race = findById(data.races, raceId);
  if (!race) return { error: "Race not found" };

  const mapped: RaceResult[] = results.map((result, index) => ({
    id: raceId * 1000 + index,
    race_id: raceId,
    driver_id: result.driver_id,
    race_position: result.race_position ?? null,
    sprint_position: result.sprint_position ?? null,
    race_points: 0,
    sprint_points: 0,
    created_at: new Date().toISOString(),
  }));

  return ok({ results: mapped, race_status: race.status });
}

export async function triggerSync(): Promise<
  ApiResponse<{
    status: string;
    races_started: number;
    races_synced: number[];
    races_failed: number[];
  }>
> {
  return ok({
    status: "ok",
    races_started: 1,
    races_synced: [1, 2],
    races_failed: [],
  });
}
