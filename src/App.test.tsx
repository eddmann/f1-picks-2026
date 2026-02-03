import { describe, test, expect } from "bun:test";
import { screen, waitFor, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./store/slices/authSlice";
import seasonReducer from "./store/slices/seasonSlice";
import driversReducer from "./store/slices/driversSlice";
import racesReducer from "./store/slices/racesSlice";
import picksReducer from "./store/slices/picksSlice";
import leaderboardReducer from "./store/slices/leaderboardSlice";
import App from "./App";

function renderApp(
  route: string,
  authState?: {
    isLoading?: boolean;
    isAuthenticated?: boolean;
    token?: string | null;
  },
) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      season: seasonReducer,
      drivers: driversReducer,
      races: racesReducer,
      picks: picksReducer,
      leaderboard: leaderboardReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        token: authState?.token ?? null,
        isAuthenticated: authState?.isAuthenticated ?? false,
        isLoading: authState?.isLoading ?? false,
        error: null,
      },
    },
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>
          <App />
        </MemoryRouter>
      </Provider>,
    ),
  };
}

describe("App Route Guards", () => {
  describe("ProtectedRoute", () => {
    test("redirects to login when unauthenticated", async () => {
      const { store } = renderApp("/");

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });
      expect(
        screen.getByRole("button", { name: /sign in/i }),
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(store.getState().season.currentSeason).not.toBeNull();
      });
    });

    test("shows loading spinner while checking auth", async () => {
      const { store } = renderApp("/", {
        isLoading: true,
        token: "test-token",
      });

      const spinners = screen.getAllByTestId("loading-spinner");
      expect(spinners.length).toBeGreaterThan(0);

      await waitFor(() => {
        expect(store.getState().season.currentSeason).not.toBeNull();
        expect(store.getState().auth.user).not.toBeNull();
      });
    });
  });

  describe("Public Routes", () => {
    test("login page is accessible without authentication", async () => {
      renderApp("/login");

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /sign in/i }),
      ).toBeInTheDocument();
    });

    test("register page is accessible without authentication", async () => {
      renderApp("/register");

      await waitFor(() => {
        expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
      });
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create account/i }),
      ).toBeInTheDocument();
    });
  });
});
