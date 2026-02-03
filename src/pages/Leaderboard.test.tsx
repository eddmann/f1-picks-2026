import { describe, test, expect } from "bun:test";
import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { renderApp, renderAppAsAuthenticated } from "../test/utils";
import { server } from "../test/mocks/server";
import Leaderboard from "./Leaderboard";
import { createStandings, createSeason } from "../test/fixtures";

const BASE_URL = "http://localhost:3000";

describe("Leaderboard", () => {
  test("shows spinner while fetching leaderboard", async () => {
    renderApp(<Leaderboard />);

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();

    expect(await screen.findByText("Leaderboard")).toBeInTheDocument();
  });

  test("displays player names and points after loading", async () => {
    const standings = createStandings(5);
    const season = createSeason({ name: "2026 Season" });

    server.use(
      http.get(`${BASE_URL}/api/leaderboard`, () => {
        return HttpResponse.json({
          data: { season, standings },
        });
      }),
    );

    renderApp(<Leaderboard />);

    expect(await screen.findByText("Leaderboard")).toBeInTheDocument();
    expect(screen.getByText("2026 Season")).toBeInTheDocument();
    expect(screen.getByText("Player 1")).toBeInTheDocument();
  });

  test("highlights current user row", async () => {
    const standings = createStandings(5);
    standings[2].user_id = 3;
    standings[2].user_name = "Current User";
    const season = createSeason();

    server.use(
      http.get(`${BASE_URL}/api/leaderboard`, () => {
        return HttpResponse.json({
          data: { season, standings },
        });
      }),
    );

    renderAppAsAuthenticated(<Leaderboard />, { id: 3, name: "Current User" });

    expect(await screen.findByText("Current User")).toBeInTheDocument();
    expect(screen.getByText("(You)")).toBeInTheDocument();
  });

  test("shows empty state when no standings", async () => {
    const season = createSeason();

    server.use(
      http.get(`${BASE_URL}/api/leaderboard`, () => {
        return HttpResponse.json({
          data: { season, standings: [] },
        });
      }),
    );

    renderApp(<Leaderboard />);

    expect(await screen.findByText("No standings yet")).toBeInTheDocument();
  });

  test("displays Pos, Player, Points column headers", async () => {
    const standings = createStandings(3);
    const season = createSeason();

    server.use(
      http.get(`${BASE_URL}/api/leaderboard`, () => {
        return HttpResponse.json({
          data: { season, standings },
        });
      }),
    );

    renderApp(<Leaderboard />);

    await screen.findByText("Player 1");

    expect(screen.getByText("Pos")).toBeInTheDocument();
    expect(screen.getByText("Player")).toBeInTheDocument();
    expect(screen.getByText("Points")).toBeInTheDocument();
  });
});
