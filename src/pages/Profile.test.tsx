import { describe, test, expect } from "bun:test";
import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { renderAppAsAuthenticated } from "../test/utils";
import { server } from "../test/mocks/server";
import Profile from "./Profile";
import {
  createPickWithDetails,
  createStandings,
  createTeamDrivers,
  createRace,
  createSeason,
} from "../test/fixtures";

const BASE_URL = "http://localhost:3000";

describe("Profile", () => {
  test("shows spinner while fetching profile", async () => {
    renderAppAsAuthenticated(<Profile />);

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();

    expect(await screen.findByText("Profile")).toBeInTheDocument();
  });

  test("displays user name and email", async () => {
    server.use(
      http.get(`${BASE_URL}/api/picks`, () => {
        return HttpResponse.json({ data: { picks: [] } });
      }),
      http.get(`${BASE_URL}/api/leaderboard`, () => {
        return HttpResponse.json({
          data: { season: createSeason(), standings: [] },
        });
      }),
    );

    renderAppAsAuthenticated(<Profile />, {
      name: "John Doe",
      email: "john@example.com",
      created_at: "2026-01-15T00:00:00Z",
    });

    expect(await screen.findByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  test("displays rank with position number", async () => {
    const standings = createStandings(5);
    server.use(
      http.get(`${BASE_URL}/api/picks`, () => {
        return HttpResponse.json({ data: { picks: [] } });
      }),
      http.get(`${BASE_URL}/api/leaderboard`, () => {
        return HttpResponse.json({
          data: { season: createSeason(), standings },
        });
      }),
    );

    renderAppAsAuthenticated(<Profile />, { id: 1 });

    expect(await screen.findByText("Rank")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
  });

  test("displays total points in stats", async () => {
    const standings = createStandings(5);
    standings[0].total_points = 150;
    server.use(
      http.get(`${BASE_URL}/api/picks`, () => {
        return HttpResponse.json({ data: { picks: [] } });
      }),
      http.get(`${BASE_URL}/api/leaderboard`, () => {
        return HttpResponse.json({
          data: { season: createSeason(), standings },
        });
      }),
    );

    renderAppAsAuthenticated(<Profile />, { id: 1 });

    expect(await screen.findByText("Points")).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
  });

  test("displays total picks made count", async () => {
    const drivers = createTeamDrivers();
    const picks = [
      createPickWithDetails({ id: 1, driver: drivers[0] }),
      createPickWithDetails({ id: 2, driver: drivers[1] }),
      createPickWithDetails({ id: 3, driver: drivers[2] }),
    ];
    server.use(
      http.get(`${BASE_URL}/api/picks`, () => {
        return HttpResponse.json({ data: { picks } });
      }),
      http.get(`${BASE_URL}/api/leaderboard`, () => {
        return HttpResponse.json({
          data: { season: createSeason(), standings: [] },
        });
      }),
    );

    renderAppAsAuthenticated(<Profile />);

    expect(await screen.findByText("Picks")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("displays past picks with driver and race", async () => {
    const drivers = createTeamDrivers();
    const races = [
      createRace({ id: 1, name: "Bahrain Grand Prix" }),
      createRace({ id: 2, name: "Saudi Arabian Grand Prix" }),
    ];
    const picks = [
      createPickWithDetails({
        id: 1,
        driver: drivers[0],
        race: races[0],
        points: 25,
      }),
      createPickWithDetails({
        id: 2,
        driver: drivers[2],
        race: races[1],
        points: 18,
      }),
    ];
    server.use(
      http.get(`${BASE_URL}/api/picks`, () => {
        return HttpResponse.json({ data: { picks } });
      }),
      http.get(`${BASE_URL}/api/leaderboard`, () => {
        return HttpResponse.json({
          data: { season: createSeason(), standings: [] },
        });
      }),
    );

    renderAppAsAuthenticated(<Profile />);

    expect(await screen.findByText("Pick History")).toBeInTheDocument();
    expect(screen.getAllByText("Bahrain Grand Prix").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Saudi Arabian Grand Prix").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("VER")).toBeInTheDocument();
    expect(screen.getByText("HAM")).toBeInTheDocument();
  });

  test("shows No picks yet when history empty", async () => {
    server.use(
      http.get(`${BASE_URL}/api/picks`, () => {
        return HttpResponse.json({ data: { picks: [] } });
      }),
      http.get(`${BASE_URL}/api/leaderboard`, () => {
        return HttpResponse.json({
          data: { season: createSeason(), standings: [] },
        });
      }),
    );

    renderAppAsAuthenticated(<Profile />);

    expect(await screen.findByText("No picks yet")).toBeInTheDocument();
  });

  test("displays average points calculation", async () => {
    const drivers = createTeamDrivers();
    const picks = [
      createPickWithDetails({ id: 1, driver: drivers[0], points: 20 }),
      createPickWithDetails({ id: 2, driver: drivers[1], points: 30 }),
    ];
    server.use(
      http.get(`${BASE_URL}/api/picks`, () => {
        return HttpResponse.json({ data: { picks } });
      }),
      http.get(`${BASE_URL}/api/leaderboard`, () => {
        return HttpResponse.json({
          data: { season: createSeason(), standings: [] },
        });
      }),
    );

    renderAppAsAuthenticated(<Profile />);

    expect(await screen.findByText("Avg. Points")).toBeInTheDocument();
    expect(screen.getByText("25.0")).toBeInTheDocument();
    expect(screen.getByText("per race")).toBeInTheDocument();
  });

  test("displays highest scoring pick with points", async () => {
    const drivers = createTeamDrivers();
    const races = [
      createRace({ id: 1, name: "Monaco Grand Prix" }),
      createRace({ id: 2, name: "British Grand Prix" }),
    ];
    const picks = [
      createPickWithDetails({
        id: 1,
        driver: drivers[0],
        race: races[0],
        points: 25,
      }),
      createPickWithDetails({
        id: 2,
        driver: drivers[1],
        race: races[1],
        points: 10,
      }),
    ];
    server.use(
      http.get(`${BASE_URL}/api/picks`, () => {
        return HttpResponse.json({ data: { picks } });
      }),
      http.get(`${BASE_URL}/api/leaderboard`, () => {
        return HttpResponse.json({
          data: { season: createSeason(), standings: [] },
        });
      }),
    );

    renderAppAsAuthenticated(<Profile />);

    expect(await screen.findByText("Best Pick")).toBeInTheDocument();
    expect(screen.getByText("Max Verstappen")).toBeInTheDocument();
    expect(screen.getAllByText("Monaco Grand Prix").length).toBeGreaterThan(0);
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  test("labels lowest scoring pick as Needs Work", async () => {
    const drivers = createTeamDrivers();
    const races = [
      createRace({ id: 1, name: "Monaco Grand Prix" }),
      createRace({ id: 2, name: "British Grand Prix" }),
    ];
    const picks = [
      createPickWithDetails({
        id: 1,
        driver: drivers[0],
        race: races[0],
        points: 25,
      }),
      createPickWithDetails({
        id: 2,
        driver: drivers[1],
        race: races[1],
        points: 5,
      }),
    ];
    server.use(
      http.get(`${BASE_URL}/api/picks`, () => {
        return HttpResponse.json({ data: { picks } });
      }),
      http.get(`${BASE_URL}/api/leaderboard`, () => {
        return HttpResponse.json({
          data: { season: createSeason(), standings: [] },
        });
      }),
    );

    renderAppAsAuthenticated(<Profile />);

    expect(await screen.findByText("Needs Work")).toBeInTheDocument();
    expect(screen.getByText("Sergio Perez")).toBeInTheDocument();
    expect(screen.getAllByText("British Grand Prix").length).toBeGreaterThan(0);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  test("displays points for each pick in history", async () => {
    const drivers = createTeamDrivers();
    const picks = [
      createPickWithDetails({ id: 1, driver: drivers[0], points: 25 }),
    ];
    server.use(
      http.get(`${BASE_URL}/api/picks`, () => {
        return HttpResponse.json({ data: { picks } });
      }),
      http.get(`${BASE_URL}/api/leaderboard`, () => {
        return HttpResponse.json({
          data: { season: createSeason(), standings: [] },
        });
      }),
    );

    renderAppAsAuthenticated(<Profile />);
    await screen.findByText("Pick History");

    const pointsElements = screen.getAllByText(/pts/);
    expect(pointsElements.length).toBeGreaterThan(0);
  });

  test("shows dash for rank when user has no standings", async () => {
    const standings = createStandings(5);
    server.use(
      http.get(`${BASE_URL}/api/picks`, () => {
        return HttpResponse.json({ data: { picks: [] } });
      }),
      http.get(`${BASE_URL}/api/leaderboard`, () => {
        return HttpResponse.json({
          data: { season: createSeason(), standings },
        });
      }),
    );

    renderAppAsAuthenticated(<Profile />, { id: 999 });

    expect(await screen.findByText("Rank")).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();
  });
});
