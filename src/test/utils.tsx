import React from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../store/slices/authSlice";
import seasonReducer from "../store/slices/seasonSlice";
import driversReducer from "../store/slices/driversSlice";
import racesReducer from "../store/slices/racesSlice";
import picksReducer from "../store/slices/picksSlice";
import leaderboardReducer from "../store/slices/leaderboardSlice";
import { createUser } from "./fixtures";
import type { PublicUser } from "../types";

function createTestStore(
  preloadedState?: Parameters<typeof configureStore>[0]["preloadedState"],
) {
  return configureStore({
    reducer: {
      auth: authReducer,
      season: seasonReducer,
      drivers: driversReducer,
      races: racesReducer,
      picks: picksReducer,
      leaderboard: leaderboardReducer,
    },
    preloadedState,
  });
}

type Store = ReturnType<typeof createTestStore>;
type RenderAppResult = ReturnType<typeof render> & { store: Store };
type RenderAuthenticatedResult = ReturnType<typeof render> & {
  store: Store;
  user: PublicUser;
};

/**
 * Render a component with Redux store and router (unauthenticated)
 */
export function renderApp(ui: React.ReactElement): RenderAppResult {
  const store = createTestStore();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={["/"]}>{children}</MemoryRouter>
      </Provider>
    );
  }

  const result = render(ui, { wrapper: Wrapper });
  return Object.assign(result, { store });
}

/**
 * Render a component with Redux store, router, and authenticated user
 */
export function renderAppAsAuthenticated(
  ui: React.ReactElement,
  userOverrides?: Partial<PublicUser>,
): RenderAuthenticatedResult {
  const user = createUser(userOverrides);

  const store = createTestStore({
    auth: {
      user,
      token: "test-token",
      isAuthenticated: true,
      isLoading: false,
      error: null,
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={["/"]}>{children}</MemoryRouter>
      </Provider>
    );
  }

  const result = render(ui, { wrapper: Wrapper });
  return Object.assign(result, { store, user });
}

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
