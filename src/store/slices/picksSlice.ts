import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PickWithDetails } from "../../types";
import * as api from "../../lib/api";

interface PicksState {
  picks: PickWithDetails[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

const initialState: PicksState = {
  picks: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
};

export const fetchPicks = createAsyncThunk(
  "picks/fetchPicks",
  async (_, { rejectWithValue }) => {
    const response = await api.getPicks();
    if (response.error) {
      return rejectWithValue(response.error);
    }
    return response.data!;
  },
);

export const submitPick = createAsyncThunk(
  "picks/submitPick",
  async (
    { raceId, driverId }: { raceId: number; driverId: number },
    { rejectWithValue },
  ) => {
    const response = await api.createPick(raceId, driverId);
    if (response.error) {
      return rejectWithValue(response.error);
    }
    return response.data!;
  },
);

const picksSlice = createSlice({
  name: "picks",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchPicks.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchPicks.fulfilled, (state, action) => {
      state.isLoading = false;
      state.picks = action.payload.picks;
    });
    builder.addCase(fetchPicks.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(submitPick.pending, (state) => {
      state.isSubmitting = true;
      state.error = null;
    });
    builder.addCase(submitPick.fulfilled, (state, action) => {
      state.isSubmitting = false;
      const index = state.picks.findIndex(
        (p) => p.race_id === action.payload.pick.race_id,
      );
      if (index >= 0) {
        state.picks[index] = action.payload.pick;
      } else {
        state.picks.push(action.payload.pick);
      }
    });
    builder.addCase(submitPick.rejected, (state, action) => {
      state.isSubmitting = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError } = picksSlice.actions;
export default picksSlice.reducer;
