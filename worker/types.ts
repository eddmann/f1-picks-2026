import type { User } from "../shared/types";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
}

export interface AppBindings {
  Bindings: Env;
  Variables: {
    user: User;
  };
}

export type {
  User,
  Session,
  Season,
  Driver,
  Race,
  Pick,
  RaceResult,
  UserSeasonStats,
} from "../shared/types";
