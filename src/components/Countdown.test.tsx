import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { screen, waitFor } from "@testing-library/react";
import { renderApp } from "../test/utils";
import Countdown from "./Countdown";

describe("Countdown", () => {
  beforeEach(() => {
    mock.module("bun:test", () => ({
      useFakeTimers: true,
    }));
  });

  afterEach(() => {});

  test("displays time remaining with days", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    futureDate.setHours(futureDate.getHours() + 5);
    futureDate.setMinutes(futureDate.getMinutes() + 30);

    renderApp(<Countdown targetDate={futureDate.toISOString()} />);

    expect(screen.getByText("days")).toBeInTheDocument();
    expect(screen.getByText("hrs")).toBeInTheDocument();
    expect(screen.getByText("min")).toBeInTheDocument();
    expect(screen.getByText("sec")).toBeInTheDocument();
  });

  test("displays time remaining without days when less than 24 hours", () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 5);
    futureDate.setMinutes(futureDate.getMinutes() + 30);

    renderApp(<Countdown targetDate={futureDate.toISOString()} />);

    expect(screen.queryByText("days")).not.toBeInTheDocument();
    expect(screen.getByText("hrs")).toBeInTheDocument();
    expect(screen.getByText("min")).toBeInTheDocument();
    expect(screen.getByText("sec")).toBeInTheDocument();
  });

  test("shows LOCKED when expired", () => {
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1);

    renderApp(<Countdown targetDate={pastDate.toISOString()} />);

    expect(screen.getByText("LOCKED")).toBeInTheDocument();
  });

  test("calls onExpire callback when time expires", async () => {
    const onExpire = mock(() => {});
    const futureDate = new Date();
    futureDate.setSeconds(futureDate.getSeconds() + 1);

    renderApp(
      <Countdown targetDate={futureDate.toISOString()} onExpire={onExpire} />,
    );

    await waitFor(
      () => {
        expect(screen.getByText("LOCKED")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    expect(onExpire).toHaveBeenCalled();
  });

  test("renders days, hours, minutes, seconds labels", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    futureDate.setHours(futureDate.getHours() + 4);
    futureDate.setMinutes(futureDate.getMinutes() + 5);

    renderApp(<Countdown targetDate={futureDate.toISOString()} />);

    expect(screen.getByText("days")).toBeInTheDocument();
    expect(screen.getByText("hrs")).toBeInTheDocument();
    expect(screen.getByText("min")).toBeInTheDocument();
    expect(screen.getByText("sec")).toBeInTheDocument();
  });
});
