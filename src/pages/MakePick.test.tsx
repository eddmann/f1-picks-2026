import { describe, test, expect } from "bun:test";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderApp } from "../test/utils";
import { server } from "../test/mocks/server";
import MakePick from "./MakePick";
import {
  createRace,
  createTeamDrivers,
  createPickWithDetails,
} from "../test/fixtures";

const BASE_URL = "http://localhost:3000";

function setupRaceHandlers(
  race: ReturnType<typeof createRace> | null,
  options?: {
    drivers?: ReturnType<typeof createTeamDrivers>;
    picks?: ReturnType<typeof createPickWithDetails>[];
  },
) {
  const drivers = options?.drivers || createTeamDrivers();
  const picks = options?.picks || [];

  server.use(
    http.get(`${BASE_URL}/api/races/current`, () => {
      return HttpResponse.json({ data: { race } });
    }),
    http.get(`${BASE_URL}/api/drivers/available`, () => {
      return HttpResponse.json({
        data: { drivers, used_driver_ids: [] },
      });
    }),
    http.get(`${BASE_URL}/api/picks`, () => {
      return HttpResponse.json({ data: { picks } });
    }),
  );

  return { drivers, picks };
}

describe("MakePick", () => {
  test("shows spinner while fetching race data", async () => {
    renderApp(<MakePick />);

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();

    expect(await screen.findByText("Make Your Pick")).toBeInTheDocument();
  });

  test("displays race name after loading", async () => {
    const race = createRace({ name: "Bahrain Grand Prix" });
    setupRaceHandlers(race);

    renderApp(<MakePick />);

    expect(await screen.findByText("Bahrain Grand Prix")).toBeInTheDocument();
  });

  test("organizes drivers into team sections", async () => {
    const race = createRace();
    setupRaceHandlers(race);

    renderApp(<MakePick />);
    await screen.findByText("Lewis Hamilton");

    expect(screen.getAllByText("Red Bull Racing").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ferrari").length).toBeGreaterThan(0);
    expect(screen.getAllByText("McLaren").length).toBeGreaterThan(0);
  });

  test("marks driver as selected on click", async () => {
    const user = userEvent.setup();
    const race = createRace();
    setupRaceHandlers(race);

    renderApp(<MakePick />);
    await screen.findByText("Lewis Hamilton");
    const hamiltonButton = screen.getByRole("button", { name: /hamilton/i });
    await user.click(hamiltonButton);

    expect(screen.getByText("Selected")).toBeInTheDocument();
  });

  test("shows submit button when driver is selected", async () => {
    const user = userEvent.setup();
    const race = createRace();
    setupRaceHandlers(race);

    renderApp(<MakePick />);
    await screen.findByText("Lando Norris");
    const norrisButton = screen.getByRole("button", { name: /norris/i });
    await user.click(norrisButton);

    expect(
      screen.getByRole("button", { name: /confirm pick/i }),
    ).toBeInTheDocument();
  });

  test("shows pick window locked message when past deadline", async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);
    const race = createRace({
      quali_time: pastDate.toISOString(),
      race_time: pastDate.toISOString(),
    });
    setupRaceHandlers(race);

    renderApp(<MakePick />);

    expect(await screen.findByText(/picks are locked/i)).toBeInTheDocument();
  });

  test("shows pick window too early message for future races", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const race = createRace({
      quali_time: futureDate.toISOString(),
      race_time: futureDate.toISOString(),
    });
    setupRaceHandlers(race);

    renderApp(<MakePick />);

    expect(await screen.findByText(/pick window opens/i)).toBeInTheDocument();
  });

  test("shows error on submit failure", async () => {
    const user = userEvent.setup();
    const race = createRace();
    const drivers = createTeamDrivers();
    server.use(
      http.get(`${BASE_URL}/api/races/current`, () => {
        return HttpResponse.json({ data: { race } });
      }),
      http.get(`${BASE_URL}/api/drivers/available`, () => {
        return HttpResponse.json({
          data: { drivers, used_driver_ids: [] },
        });
      }),
      http.get(`${BASE_URL}/api/picks`, () => {
        return HttpResponse.json({ data: { picks: [] } });
      }),
      http.post(`${BASE_URL}/api/picks`, () => {
        return HttpResponse.json(
          { error: "Pick submission failed" },
          { status: 400 },
        );
      }),
    );

    renderApp(<MakePick />);
    await screen.findByText("Oscar Piastri");
    const piastriButton = screen.getByRole("button", { name: /piastri/i });
    await user.click(piastriButton);
    const submitButton = screen.getByRole("button", { name: /confirm pick/i });
    await user.click(submitButton);

    expect(
      await screen.findByText(/pick submission failed/i),
    ).toBeInTheDocument();
  });

  test("displays no race found message when race is null", async () => {
    setupRaceHandlers(null);

    renderApp(<MakePick />);

    expect(await screen.findByText(/no race found/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to dashboard/i }),
    ).toBeInTheDocument();
  });

  test("shows time remaining until pick deadline", async () => {
    const race = createRace();
    setupRaceHandlers(race);

    renderApp(<MakePick />);

    await waitFor(() => {
      const timeLabels = screen.queryAllByText(/hrs|min|sec/);
      expect(timeLabels.length).toBeGreaterThan(0);
    });
  });

  test("shows current pick for existing pick", async () => {
    const drivers = createTeamDrivers();
    const race = createRace();
    const existingPick = createPickWithDetails({
      race_id: race.id,
      driver_id: 1,
      driver: drivers[0],
      race,
    });
    setupRaceHandlers(race, { drivers, picks: [existingPick] });

    renderApp(<MakePick />);
    await screen.findByText("Max Verstappen");

    expect(screen.getByText("Selected")).toBeInTheDocument();
  });
});
