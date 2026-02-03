import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Driver, DriverWithAvailability } from "../../types";
import * as api from "../../lib/api";

interface DriversState {
  drivers: Driver[];
  availableDrivers: DriverWithAvailability[];
  usedDriverIds: number[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DriversState = {
  drivers: [],
  availableDrivers: [],
  usedDriverIds: [],
  isLoading: false,
  error: null,
};

export const fetchDrivers = createAsyncThunk(
  "drivers/fetchDrivers",
  async (_, { rejectWithValue }) => {
    const response = await api.getDrivers();
    if (response.error) {
      return rejectWithValue(response.error);
    }
    return response.data!;
  },
);

export const fetchAvailableDrivers = createAsyncThunk(
  "drivers/fetchAvailableDrivers",
  async (_, { rejectWithValue }) => {
    const response = await api.getAvailableDrivers();
    if (response.error) {
      return rejectWithValue(response.error);
    }
    return response.data!;
  },
);

const driversSlice = createSlice({
  name: "drivers",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchDrivers.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchDrivers.fulfilled, (state, action) => {
      state.isLoading = false;
      state.drivers = action.payload.drivers;
    });
    builder.addCase(fetchDrivers.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(fetchAvailableDrivers.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchAvailableDrivers.fulfilled, (state, action) => {
      state.isLoading = false;
      state.availableDrivers = action.payload.drivers;
      state.usedDriverIds = action.payload.used_driver_ids;
    });
    builder.addCase(fetchAvailableDrivers.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export default driversSlice.reducer;
