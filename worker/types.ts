import type { User } from "../shared/types";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
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
