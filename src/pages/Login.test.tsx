import { describe, test, expect } from "bun:test";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderApp } from "../test/utils";
import { server } from "../test/mocks/server";
import Login from "./Login";

const BASE_URL = "http://localhost:3000";

describe("Login", () => {
  test("displays email, password inputs and sign in button", () => {
    renderApp(<Login />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  test("submits with valid credentials and shows loading state", async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${BASE_URL}/api/auth/login`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({
          data: {
            user: { id: 1, email: "test@example.com", name: "Test User" },
            token: "test-token",
          },
        });
      }),
    );

    renderApp(<Login />);
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/signing in/i)).toBeInTheDocument();
  });

  test("displays error on invalid credentials", async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${BASE_URL}/api/auth/login`, () => {
        return HttpResponse.json(
          { error: "Invalid email or password" },
          { status: 401 },
        );
      }),
    );

    renderApp(<Login />);
    await user.type(screen.getByLabelText(/email/i), "wrong@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(/invalid email or password/i),
    ).toBeInTheDocument();
  });

  test("dismisses error on X click", async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${BASE_URL}/api/auth/login`, () => {
        return HttpResponse.json(
          { error: "Invalid email or password" },
          { status: 401 },
        );
      }),
    );

    renderApp(<Login />);
    await user.type(screen.getByLabelText(/email/i), "wrong@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(
      await screen.findByText(/invalid email or password/i),
    ).toBeInTheDocument();
    const dismissButton = screen.getByRole("button", { name: "" });
    await user.click(dismissButton);

    await waitFor(() => {
      expect(
        screen.queryByText(/invalid email or password/i),
      ).not.toBeInTheDocument();
    });
  });

  test("links to register page", () => {
    renderApp(<Login />);

    const registerLink = screen.getByRole("link", { name: /register/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute("href", "/register");
  });

  test("shows email and password placeholder text", () => {
    renderApp(<Login />);

    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/)).toBeInTheDocument();
  });

  test("marks email as required for submission", () => {
    renderApp(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toBeRequired();
  });

  test("marks password as required for submission", () => {
    renderApp(<Login />);

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toBeRequired();
  });

  test("shows network error on API failure", async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${BASE_URL}/api/auth/login`, () => {
        return HttpResponse.error();
      }),
    );

    renderApp(<Login />);
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      const errorElement = screen.queryByText(/network error|error/i);
      expect(errorElement).toBeInTheDocument();
    });
  });
});
