import { describe, test, expect } from "bun:test";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { renderApp, renderAppAsAuthenticated } from "../test/utils";
import { server } from "../test/mocks/server";
import Dashboard from "./Dashboard";
import {
  createRace,
  createPickWithDetails,
  createStandings,
  createTeamDrivers,
  createSeason,
} from "../test/fixtures";

const BASE_URL = "http://localhost:3000";

function setupDashboardHandlers(options?: {
  race?: ReturnType<typeof createRace> | null;
  picks?: ReturnType<typeof createPickWithDetails>[];
  standings?: ReturnType<typeof createStandings>;
}) {
  const race = options?.race !== undefined ? options.race : createRace();
  const picks = options?.picks || [];
  const standings = options?.standings || createStandings();

  server.use(
    http.get(`${BASE_URL}/api/races/current`, () => {
      return HttpResponse.json({ data: { race } });
    }),
    http.get(`${BASE_URL}/api/picks`, () => {
      return HttpResponse.json({ data: { picks } });
    }),
    http.get(`${BASE_URL}/api/leaderboard`, () => {
      return HttpResponse.json({
        data: { season: createSeason(), standings },
      });
    }),
  );

  return { race, picks, standings };
}

describe("Dashboard", () => {
  test("shows spinner while fetching dashboard", async () => {
    renderApp(<Dashboard />);

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();

    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
  });

  test("displays current race name after loading", async () => {
    const race = createRace({ name: "Bahrain Grand Prix" });
    setupDashboardHandlers({ race });

    renderApp(<Dashboard />);

    expect(await screen.findByText("Bahrain Grand Prix")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  test("shows user's pick for current race", async () => {
    const drivers = createTeamDrivers();
    const race = createRace({ name: "Bahrain Grand Prix" });
    const pick = createPickWithDetails({
      race_id: race.id,
      driver: drivers[0],
    });
    setupDashboardHandlers({ race, picks: [pick] });

    renderApp(<Dashboard />);

    expect(await screen.findByText("Max Verstappen")).toBeInTheDocument();
  });

  test("shows Make Your Pick button when no pick made", async () => {
    const race = createRace({ name: "Bahrain Grand Prix" });
    setupDashboardHandlers({ race, picks: [] });

    renderApp(<Dashboard />);

    expect(
      await screen.findByRole("link", { name: /make your pick/i }),
    ).toBeInTheDocument();
  });

  test("displays top players with points", async () => {
    const standings = createStandings(5);
    setupDashboardHandlers({ standings });

    renderApp(<Dashboard />);

    expect(await screen.findByText("Standings")).toBeInTheDocument();
    expect(screen.getByText("Player 1")).toBeInTheDocument();
  });

  test("highlights current user in leaderboard", async () => {
    const standings = createStandings(5);
    standings[1].user_id = 2;
    standings[1].user_name = "Current User";
    setupDashboardHandlers({ standings });

    renderAppAsAuthenticated(<Dashboard />, { id: 2, name: "Current User" });

    expect(await screen.findByText("Current User")).toBeInTheDocument();
    expect(screen.getByText("(You)")).toBeInTheDocument();
  });

  test("shows countdown until pick deadline", async () => {
    const race = createRace();
    setupDashboardHandlers({ race });

    renderApp(<Dashboard />);

    await waitFor(() => {
      const timeLabels = screen.queryAllByText(/hrs|min|sec/);
      expect(timeLabels.length).toBeGreaterThan(0);
    });
  });

  test("shows picks locked message after deadline", async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);
    const race = createRace({
      quali_time: pastDate.toISOString(),
      race_time: pastDate.toISOString(),
      status: "upcoming",
    });
    setupDashboardHandlers({ race });

    renderApp(<Dashboard />);

    expect(await screen.findByText(/picks are locked/i)).toBeInTheDocument();
  });

  test("shows user rank in quick stats", async () => {
    const standings = createStandings(5);
    setupDashboardHandlers({ standings });

    renderAppAsAuthenticated(<Dashboard />, { id: 1 });

    const rankCard = await screen.findByRole("link", { name: /your rank/i });
    expect(rankCard).toHaveTextContent(/#\s*1/);
  });

  test("displays picks made count in stats", async () => {
    const drivers = createTeamDrivers();
    const picks = [
      createPickWithDetails({ id: 1, race_id: 1, driver: drivers[0] }),
      createPickWithDetails({ id: 2, race_id: 2, driver: drivers[1] }),
    ];
    setupDashboardHandlers({ picks });

    renderApp(<Dashboard />);

    expect(await screen.findByText("picks made")).toBeInTheDocument();
    const picksSection = await screen.findByRole("link", {
      name: /picks made/i,
    });
    expect(picksSection).toHaveTextContent("2");
  });
});
