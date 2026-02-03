import type {
  ApiResponse,
  PublicUser,
  Season,
  Driver,
  Race,
  PickWithDetails,
  DriverWithAvailability,
  LeaderboardEntry,
  RaceResult,
  LoginForm,
  RegisterForm,
} from "../types";
import { AUTH_TOKEN_STORAGE_KEY } from "../../shared/constants";

// Get base URL - use origin if available (works in browser and jsdom), fallback for Node
const getApiBase = () => {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api`;
  }
  return "http://localhost:3000/api";
};

const API_BASE = getApiBase();
const DEMO_MODE = import.meta.env?.VITE_DEMO_MODE === "true";
let demoApiPromise: Promise<typeof import("../demo/api")> | null = null;

const getDemoApi = () => {
  if (!demoApiPromise) {
    demoApiPromise = import("../demo/api");
  }
  return demoApiPromise;
};

function getToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = (await response.json()) as ApiResponse<T> & { error?: string };

    if (!response.ok) {
      return { error: data.error || "An error occurred" };
    }

    return data as ApiResponse<T>;
  } catch {
    return { error: "Network error. Please try again." };
  }
}

export async function login(
  credentials: LoginForm,
): Promise<ApiResponse<{ user: PublicUser; token: string }>> {
  if (DEMO_MODE) {
    const demoApi = await getDemoApi();
    return demoApi.login(credentials);
  }
  return fetchApi("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function register(
  data: RegisterForm,
): Promise<ApiResponse<{ user: PublicUser; token: string }>> {
  if (DEMO_MODE) {
    const demoApi = await getDemoApi();
    return demoApi.register(data);
  }
  return fetchApi("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function logout(): Promise<ApiResponse<{ success: boolean }>> {
  if (DEMO_MODE) {
    const demoApi = await getDemoApi();
    return demoApi.logout();
  }
  return fetchApi("/auth/logout", { method: "POST" });
}

export async function getCurrentUser(): Promise<
  ApiResponse<{ user: PublicUser }>
> {
  if (DEMO_MODE) {
    const demoApi = await getDemoApi();
    return demoApi.getCurrentUser();
  }
  return fetchApi("/auth/me");
}

export async function getCurrentSeason(): Promise<
  ApiResponse<{ season: Season }>
> {
  if (DEMO_MODE) {
    const demoApi = await getDemoApi();
    return demoApi.getCurrentSeason();
  }
  return fetchApi("/seasons/current");
}

export async function getDrivers(): Promise<
  ApiResponse<{ drivers: Driver[] }>
> {
  if (DEMO_MODE) {
    const demoApi = await getDemoApi();
    return demoApi.getDrivers();
  }
  return fetchApi("/drivers");
}

export async function getAvailableDrivers(): Promise<
  ApiResponse<{ drivers: DriverWithAvailability[]; used_driver_ids: number[] }>
> {
  if (DEMO_MODE) {
    const demoApi = await getDemoApi();
    return demoApi.getAvailableDrivers();
  }
  return fetchApi("/drivers/available");
}

export async function getRaces(): Promise<ApiResponse<{ races: Race[] }>> {
  if (DEMO_MODE) {
    const demoApi = await getDemoApi();
    return demoApi.getRaces();
  }
  return fetchApi("/races");
}

export async function getCurrentRace(): Promise<ApiResponse<{ race: Race }>> {
  if (DEMO_MODE) {
    const demoApi = await getDemoApi();
    return demoApi.getCurrentRace();
  }
  return fetchApi("/races/current");
}

export async function getRace(
  id: number,
): Promise<ApiResponse<{ race: Race }>> {
  if (DEMO_MODE) {
    const demoApi = await getDemoApi();
    return demoApi.getRace(id);
  }
  return fetchApi(`/races/${id}`);
}

export async function getRaceResults(id: number): Promise<
  ApiResponse<{
    race: Race;
    results: (RaceResult & { driver: Driver })[];
    picks: (PickWithDetails & { user_name: string; points: number })[];
  }>
> {
  if (DEMO_MODE) {
    const demoApi = await getDemoApi();
    return demoApi.getRaceResults(id);
  }
  return fetchApi(`/races/${id}/results`);
}

export async function getPicks(): Promise<
  ApiResponse<{ picks: PickWithDetails[] }>
> {
  if (DEMO_MODE) {
    const demoApi = await getDemoApi();
    return demoApi.getPicks();
  }
  return fetchApi("/picks");
}

export async function createPick(
  raceId: number,
  driverId: number,
): Promise<ApiResponse<{ pick: PickWithDetails }>> {
  if (DEMO_MODE) {
    const demoApi = await getDemoApi();
    return demoApi.createPick(raceId, driverId);
  }
  return fetchApi("/picks", {
    method: "POST",
    body: JSON.stringify({ race_id: raceId, driver_id: driverId }),
  });
}

export async function getLeaderboard(): Promise<
  ApiResponse<{
    season: Season;
    standings: (LeaderboardEntry & { user_name: string })[];
  }>
> {
  if (DEMO_MODE) {
    const demoApi = await getDemoApi();
    return demoApi.getLeaderboard();
  }
  return fetchApi("/leaderboard");
}

export async function submitRaceResults(
  raceId: number,
  results: {
    driver_id: number;
    race_position: number | null;
    sprint_position?: number | null;
  }[],
): Promise<ApiResponse<{ results: RaceResult[]; race_status: string }>> {
  if (DEMO_MODE) {
    const demoApi = await getDemoApi();
    return demoApi.submitRaceResults(raceId, results);
  }
  return fetchApi(`/admin/races/${raceId}/results`, {
    method: "POST",
    body: JSON.stringify({ results }),
  });
}

export async function triggerSync(): Promise<
  ApiResponse<{
    status: string;
    races_started: number;
    races_synced: number[];
    races_failed: number[];
  }>
> {
  if (DEMO_MODE) {
    const demoApi = await getDemoApi();
    return demoApi.triggerSync();
  }
  return fetchApi("/admin/sync-results", { method: "POST" });
}
