import { describe, test, expect } from "bun:test";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderApp } from "../test/utils";
import { server } from "../test/mocks/server";
import Register from "./Register";

const BASE_URL = "http://localhost:3000";

describe("Register", () => {
  test("displays name, email, password, confirm inputs", () => {
    renderApp(<Register />);

    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  test("validates password match", async () => {
    const user = userEvent.setup();

    renderApp(<Register />);
    await user.type(screen.getByLabelText(/^name$/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "differentpassword",
    );
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText(/passwords do not match/i),
    ).toBeInTheDocument();
  });

  test("validates password length", async () => {
    const user = userEvent.setup();

    renderApp(<Register />);
    await user.type(screen.getByLabelText(/^name$/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "short");
    await user.type(screen.getByLabelText(/confirm password/i), "short");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText(/at least 6 characters/i),
    ).toBeInTheDocument();
  });

  test("submits and shows loading state", async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${BASE_URL}/api/auth/register`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({
          data: {
            user: { id: 1, email: "new@example.com", name: "Test User" },
            token: "test-token",
          },
        });
      }),
    );

    renderApp(<Register />);
    await user.type(screen.getByLabelText(/^name$/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "new@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/creating account/i)).toBeInTheDocument();
  });

  test("shows API errors", async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${BASE_URL}/api/auth/register`, () => {
        return HttpResponse.json(
          { error: "Email already registered" },
          { status: 400 },
        );
      }),
    );

    renderApp(<Register />);
    await user.type(screen.getByLabelText(/^name$/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "existing@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText(/email already registered/i),
    ).toBeInTheDocument();
  });

  test("dismisses error on X click", async () => {
    const user = userEvent.setup();

    renderApp(<Register />);
    await user.type(screen.getByLabelText(/^name$/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "different");
    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(
      await screen.findByText(/passwords do not match/i),
    ).toBeInTheDocument();
    const dismissButton = screen.getByRole("button", { name: "" });
    await user.click(dismissButton);

    await waitFor(() => {
      expect(
        screen.queryByText(/passwords do not match/i),
      ).not.toBeInTheDocument();
    });
  });

  test("links to login page", () => {
    renderApp(<Register />);

    const loginLink = screen.getByRole("link", { name: /sign in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  test("shows placeholder text in all form inputs", () => {
    renderApp(<Register />);

    expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
  });

  test("marks all form fields as required", () => {
    renderApp(<Register />);

    expect(screen.getByLabelText(/^name$/i)).toBeRequired();
    expect(screen.getByLabelText(/email/i)).toBeRequired();
    expect(screen.getByLabelText(/^password$/i)).toBeRequired();
    expect(screen.getByLabelText(/confirm password/i)).toBeRequired();
  });
});
