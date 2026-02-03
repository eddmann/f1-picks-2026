import { describe, test, expect, mock } from "bun:test";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp } from "../test/utils";
import DriverCard from "./DriverCard";
import { createDriver, createDriverWithAvailability } from "../test/fixtures";

describe("DriverCard", () => {
  test("displays driver name, code, number, and team", () => {
    const driver = createDriver({
      name: "Max Verstappen",
      code: "VER",
      number: 1,
      team: "Red Bull Racing",
    });

    renderApp(<DriverCard driver={driver} />);

    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText("Max Verstappen")).toBeInTheDocument();
    expect(screen.getByText("VER")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Red Bull Racing")).toBeInTheDocument();
  });

  test("shows Selected label when card is selected", () => {
    const driver = createDriver();

    renderApp(<DriverCard driver={driver} selected />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(screen.getByText("Selected")).toBeInTheDocument();
  });

  test("disables button when disabled prop is true", () => {
    const driver = createDriver();

    renderApp(<DriverCard driver={driver} disabled />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  test("shows Used badge for unavailable driver", () => {
    const driver = createDriverWithAvailability({
      name: "Max Verstappen",
      is_available: false,
    });

    renderApp(<DriverCard driver={driver} showStatus />);

    expect(screen.getByText("Used")).toBeInTheDocument();
  });

  test("does not show Used badge when showStatus is false", () => {
    const driver = createDriverWithAvailability({
      is_available: false,
    });

    renderApp(<DriverCard driver={driver} showStatus={false} />);

    expect(screen.queryByText("Used")).not.toBeInTheDocument();
  });

  test("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = mock(() => {});
    const driver = createDriver();

    renderApp(<DriverCard driver={driver} onClick={handleClick} />);

    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test("does not call onClick when disabled", async () => {
    const user = userEvent.setup();
    const handleClick = mock(() => {});
    const driver = createDriver();

    renderApp(<DriverCard driver={driver} onClick={handleClick} disabled />);

    await user.click(screen.getByRole("button"));

    expect(handleClick).not.toHaveBeenCalled();
  });

  test("applies team color to card button", () => {
    const driver = createDriver({
      team_color: "#3671C6",
    });

    renderApp(<DriverCard driver={driver} />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  test("shows available driver without Used badge", () => {
    const driver = createDriverWithAvailability({
      name: "Lewis Hamilton",
      is_available: true,
    });

    renderApp(<DriverCard driver={driver} showStatus />);

    expect(screen.getByText("Lewis Hamilton")).toBeInTheDocument();
    expect(screen.queryByText("Used")).not.toBeInTheDocument();
  });
});
