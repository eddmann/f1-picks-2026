import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Race } from "../../types";
import * as api from "../../lib/api";

interface RacesState {
  races: Race[];
  currentRace: Race | null;
  selectedRace: Race | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: RacesState = {
  races: [],
  currentRace: null,
  selectedRace: null,
  isLoading: false,
  error: null,
};

export const fetchRaces = createAsyncThunk(
  "races/fetchRaces",
  async (_, { rejectWithValue }) => {
    const response = await api.getRaces();
    if (response.error) {
      return rejectWithValue(response.error);
    }
    return response.data!;
  },
);

export const fetchCurrentRace = createAsyncThunk(
  "races/fetchCurrentRace",
  async (_, { rejectWithValue }) => {
    const response = await api.getCurrentRace();
    if (response.error) {
      return rejectWithValue(response.error);
    }
    return response.data!;
  },
);

export const fetchRace = createAsyncThunk(
  "races/fetchRace",
  async (id: number, { rejectWithValue }) => {
    const response = await api.getRace(id);
    if (response.error) {
      return rejectWithValue(response.error);
    }
    return response.data!;
  },
);

const racesSlice = createSlice({
  name: "races",
  initialState,
  reducers: {
    clearSelectedRace: (state) => {
      state.selectedRace = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchRaces.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchRaces.fulfilled, (state, action) => {
      state.isLoading = false;
      state.races = action.payload.races;
    });
    builder.addCase(fetchRaces.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(fetchCurrentRace.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchCurrentRace.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentRace = action.payload.race;
    });
    builder.addCase(fetchCurrentRace.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(fetchRace.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchRace.fulfilled, (state, action) => {
      state.isLoading = false;
      state.selectedRace = action.payload.race;
    });
    builder.addCase(fetchRace.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearSelectedRace } = racesSlice.actions;
export default racesSlice.reducer;
