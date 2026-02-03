export interface User {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  timezone: string;
  is_admin: boolean;
  created_at: string;
}

export interface Session {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface Season {
  id: number;
  year: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Driver {
  id: number;
  season_id: number;
  code: string;
  name: string;
  number: number;
  team: string;
  team_color: string;
  created_at: string;
}

export type RaceStatus = "upcoming" | "in_progress" | "completed";

export interface Race {
  id: number;
  season_id: number;
  round: number;
  name: string;
  location: string;
  circuit: string;
  country_code: string;
  has_sprint: boolean;
  quali_time: string;
  sprint_quali_time: string | null;
  race_time: string;
  sprint_time: string | null;
  is_wild_card: boolean;
  status: RaceStatus;
  created_at: string;
}

export interface Pick {
  id: number;
  user_id: number;
  race_id: number;
  driver_id: number;
  created_at: string;
}

export interface RaceResult {
  id: number;
  race_id: number;
  driver_id: number;
  race_position: number | null;
  sprint_position: number | null;
  race_points: number;
  sprint_points: number;
  created_at: string;
}

export interface UserSeasonStats {
  id: number;
  user_id: number;
  season_id: number;
  total_points: number;
  races_completed: number;
  created_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  name: string;
  password: string;
  timezone?: string;
}

export interface PublicUser {
  id: number;
  email: string;
  name: string;
  timezone: string;
  is_admin: boolean;
  created_at: string;
}

export interface DriverWithAvailability extends Driver {
  is_available: boolean;
  used_in_race?: string;
}

export interface PickWithDetails extends Pick {
  driver: Driver;
  race: Race;
  points?: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  user_name: string;
  total_points: number;
  races_completed: number;
}

export interface RaceWithPick extends Race {
  pick?: {
    driver: Driver;
    points?: number;
  };
}
