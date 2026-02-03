export interface F1RaceInput {
  name: string;
  country_code: string;
}

export interface F1DriverResult {
  driver_number: number;
  race_position: number | null;
  sprint_position: number | null;
}

export type F1ResultsResponse =
  | { ok: true; results: F1DriverResult[] }
  | { ok: false; message: string };

export interface F1ResultsFetcher {
  fetchResults(
    seasonYear: number,
    race: F1RaceInput,
  ): Promise<F1ResultsResponse>;
}
