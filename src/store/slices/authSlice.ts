import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { PublicUser, LoginForm, RegisterForm } from "../../types";
import * as api from "../../lib/api";
import { AUTH_TOKEN_STORAGE_KEY } from "../../../shared/constants";

interface AuthState {
  user: PublicUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem(AUTH_TOKEN_STORAGE_KEY),
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginForm, { rejectWithValue }) => {
    const response = await api.login(credentials);
    if (response.error) {
      return rejectWithValue(response.error);
    }
    return response.data!;
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (data: RegisterForm, { rejectWithValue }) => {
    const response = await api.register(data);
    if (response.error) {
      return rejectWithValue(response.error);
    }
    return response.data!;
  },
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    const response = await api.getCurrentUser();
    if (response.error) {
      return rejectWithValue(response.error);
    }
    return response.data!;
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  await api.logout();
  return null;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
      if (action.payload) {
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, action.payload);
      } else {
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, action.payload.token);
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(register.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, action.payload.token);
    });
    builder.addCase(register.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(fetchCurrentUser.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
    });
    builder.addCase(fetchCurrentUser.rejected, (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    });

    builder.addCase(logout.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    });
  },
});

export const { clearError, setToken } = authSlice.actions;
export default authSlice.reducer;
