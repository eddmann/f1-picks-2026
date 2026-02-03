import { describe, test, expect } from "bun:test";
import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { renderApp } from "../test/utils";
import { server } from "../test/mocks/server";
import SeasonCalendar from "./SeasonCalendar";
import {
  createRace,
  createPickWithDetails,
  createTeamDrivers,
} from "../test/fixtures";

const BASE_URL = "http://localhost:3000";

describe("SeasonCalendar", () => {
  test("shows spinner while fetching races", async () => {
    renderApp(<SeasonCalendar />);

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();

    expect(await screen.findByText("2026 Season Calendar")).toBeInTheDocument();
  });

  test("displays all race names after loading", async () => {
    const races = [
      createRace({
        id: 1,
        round: 1,
        name: "Bahrain Grand Prix",
        country_code: "BH",
      }),
      createRace({
        id: 2,
        round: 2,
        name: "Saudi Arabian Grand Prix",
        country_code: "SA",
      }),
    ];
    server.use(
      http.get(`${BASE_URL}/api/races`, () => {
        return HttpResponse.json({ data: { races } });
      }),
      http.get(`${BASE_URL}/api/picks`, () => {
        return HttpResponse.json({ data: { picks: [] } });
      }),
    );

    renderApp(<SeasonCalendar />);

    expect(await screen.findByText("Bahrain Grand Prix")).toBeInTheDocument();
    expect(screen.getByText("Saudi Arabian Grand Prix")).toBeInTheDocument();
  });

  test("shows driver code for races with picks", async () => {
    const drivers = createTeamDrivers();
    const races = [createRace({ id: 1, round: 1, name: "Bahrain Grand Prix" })];
    const picks = [
      createPickWithDetails({
        race_id: 1,
        driver: drivers[0],
      }),
    ];
    server.use(
      http.get(`${BASE_URL}/api/races`, () => {
        return HttpResponse.json({ data: { races } });
      }),
      http.get(`${BASE_URL}/api/picks`, () => {
        return HttpResponse.json({ data: { picks } });
      }),
    );

    renderApp(<SeasonCalendar />);
    await screen.findByText("Bahrain Grand Prix");

    expect(screen.getByText("VER")).toBeInTheDocument();
  });

  test("displays round number next to each race", async () => {
    const races = [
      createRace({ id: 1, round: 1, name: "Bahrain Grand Prix" }),
      createRace({ id: 2, round: 2, name: "Saudi Arabian Grand Prix" }),
    ];
    server.use(
      http.get(`${BASE_URL}/api/races`, () => {
        return HttpResponse.json({ data: { races } });
      }),
      http.get(`${BASE_URL}/api/picks`, () => {
        return HttpResponse.json({ data: { picks: [] } });
      }),
    );

    renderApp(<SeasonCalendar />);
    await screen.findByText("Bahrain Grand Prix");

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  test("displays 2026 Season Calendar heading", async () => {
    server.use(
      http.get(`${BASE_URL}/api/races`, () => {
        return HttpResponse.json({ data: { races: [] } });
      }),
      http.get(`${BASE_URL}/api/picks`, () => {
        return HttpResponse.json({ data: { picks: [] } });
      }),
    );

    renderApp(<SeasonCalendar />);

    expect(await screen.findByText("2026 Season Calendar")).toBeInTheDocument();
  });
});
