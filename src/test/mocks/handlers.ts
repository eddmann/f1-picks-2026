import { http, HttpResponse } from "msw";
import {
  createUser,
  createSeason,
  createTeamDrivers,
  createRace,
  createStandings,
} from "../fixtures";

const BASE_URL = "http://localhost:3000";

// Default fixture data
const defaultUser = createUser({ id: 1 });
const defaultSeason = createSeason();
const defaultDrivers = createTeamDrivers();
const defaultRace = createRace();
const defaultStandings = createStandings();

export const handlers = [
  // Auth endpoints
  http.post(`${BASE_URL}/api/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    // Simulate invalid credentials
    if (body.password === "invalid") {
      return HttpResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      data: {
        user: { ...defaultUser, email: body.email },
        token: "test-token-123",
      },
    });
  }),

  http.post(`${BASE_URL}/api/auth/register`, async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      name: string;
      password: string;
      timezone?: string;
    };

    // Simulate email already exists
    if (body.email === "existing@example.com") {
      return HttpResponse.json(
        { error: "Email already registered" },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      data: {
        user: {
          ...defaultUser,
          email: body.email,
          name: body.name,
          timezone: body.timezone || "UTC",
        },
        token: "test-token-123",
      },
    });
  }),

  http.get(`${BASE_URL}/api/auth/me`, () => {
    return HttpResponse.json({
      data: { user: defaultUser },
    });
  }),

  http.post(`${BASE_URL}/api/auth/logout`, () => {
    return HttpResponse.json({
      data: { success: true },
    });
  }),

  // Season endpoints
  http.get(`${BASE_URL}/api/seasons/current`, () => {
    return HttpResponse.json({
      data: { season: defaultSeason },
    });
  }),

  // Driver endpoints
  http.get(`${BASE_URL}/api/drivers`, () => {
    return HttpResponse.json({
      data: { drivers: defaultDrivers },
    });
  }),

  http.get(`${BASE_URL}/api/drivers/available`, () => {
    return HttpResponse.json({
      data: {
        drivers: defaultDrivers,
        used_driver_ids: [],
      },
    });
  }),

  // Race endpoints
  http.get(`${BASE_URL}/api/races`, () => {
    return HttpResponse.json({
      data: {
        races: [
          defaultRace,
          createRace({
            id: 2,
            round: 2,
            name: "Saudi Arabian Grand Prix",
            country_code: "SA",
          }),
          createRace({
            id: 3,
            round: 3,
            name: "Australian Grand Prix",
            country_code: "AU",
          }),
        ],
      },
    });
  }),

  http.get(`${BASE_URL}/api/races/current`, () => {
    return HttpResponse.json({
      data: { race: defaultRace },
    });
  }),

  http.get(`${BASE_URL}/api/races/:id`, ({ params }) => {
    const id = Number(params.id);
    return HttpResponse.json({
      data: { race: createRace({ id }) },
    });
  }),

  http.get(`${BASE_URL}/api/races/:id/results`, ({ params }) => {
    const id = Number(params.id);
    const race = createRace({ id, status: "completed" });
    return HttpResponse.json({
      data: {
        race,
        results: [],
        picks: [],
      },
    });
  }),

  // Pick endpoints
  http.get(`${BASE_URL}/api/picks`, () => {
    return HttpResponse.json({
      data: { picks: [] },
    });
  }),

  http.post(`${BASE_URL}/api/picks`, async ({ request }) => {
    const body = (await request.json()) as {
      race_id: number;
      driver_id: number;
    };
    const driver =
      defaultDrivers.find((d) => d.id === body.driver_id) || defaultDrivers[0];
    const race = createRace({ id: body.race_id });

    return HttpResponse.json({
      data: {
        pick: {
          id: 1,
          user_id: 1,
          race_id: body.race_id,
          driver_id: body.driver_id,
          created_at: new Date().toISOString(),
          driver,
          race,
        },
      },
    });
  }),

  // Leaderboard endpoints
  http.get(`${BASE_URL}/api/leaderboard`, () => {
    return HttpResponse.json({
      data: {
        season: defaultSeason,
        standings: defaultStandings,
      },
    });
  }),

  // Admin endpoints
  http.post(`${BASE_URL}/api/admin/races/:raceId/results`, () => {
    return HttpResponse.json({
      data: {
        results: [],
        race_status: "completed",
      },
    });
  }),

  http.post(`${BASE_URL}/api/admin/sync-results`, () => {
    return HttpResponse.json({
      data: {
        status: "ok",
        races_started: 0,
        races_synced: [],
        races_failed: [],
      },
    });
  }),
];
