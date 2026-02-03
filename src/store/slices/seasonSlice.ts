import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Season } from "../../types";
import * as api from "../../lib/api";

interface SeasonState {
  currentSeason: Season | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SeasonState = {
  currentSeason: null,
  isLoading: false,
  error: null,
};

export const fetchCurrentSeason = createAsyncThunk(
  "season/fetchCurrentSeason",
  async (_, { rejectWithValue }) => {
    const response = await api.getCurrentSeason();
    if (response.error) {
      return rejectWithValue(response.error);
    }
    return response.data!;
  },
);

const seasonSlice = createSlice({
  name: "season",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchCurrentSeason.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchCurrentSeason.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentSeason = action.payload.season;
    });
    builder.addCase(fetchCurrentSeason.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export default seasonSlice.reducer;
