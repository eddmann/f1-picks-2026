import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import seasonReducer from "./slices/seasonSlice";
import driversReducer from "./slices/driversSlice";
import racesReducer from "./slices/racesSlice";
import picksReducer from "./slices/picksSlice";
import leaderboardReducer from "./slices/leaderboardSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    season: seasonReducer,
    drivers: driversReducer,
    races: racesReducer,
    picks: picksReducer,
    leaderboard: leaderboardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
