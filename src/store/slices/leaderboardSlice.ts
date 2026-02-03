import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Season, LeaderboardEntry } from "../../types";
import * as api from "../../lib/api";

interface LeaderboardState {
  season: Season | null;
  standings: (LeaderboardEntry & { user_name: string })[];
  isLoading: boolean;
  error: string | null;
}

const initialState: LeaderboardState = {
  season: null,
  standings: [],
  isLoading: false,
  error: null,
};

export const fetchLeaderboard = createAsyncThunk(
  "leaderboard/fetchLeaderboard",
  async (_, { rejectWithValue }) => {
    const response = await api.getLeaderboard();
    if (response.error) {
      return rejectWithValue(response.error);
    }
    return response.data!;
  },
);

const leaderboardSlice = createSlice({
  name: "leaderboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchLeaderboard.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchLeaderboard.fulfilled, (state, action) => {
      state.isLoading = false;
      state.season = action.payload.season;
      state.standings = action.payload.standings;
    });
    builder.addCase(fetchLeaderboard.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export default leaderboardSlice.reducer;
