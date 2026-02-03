import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router";
import { useAppDispatch, useAppSelector } from "./lib/hooks";
import { fetchCurrentUser } from "./store/slices/authSlice";
import { fetchCurrentSeason } from "./store/slices/seasonSlice";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import MakePick from "./pages/MakePick";
import SeasonCalendar from "./pages/SeasonCalendar";
import Leaderboard from "./pages/Leaderboard";
import RaceDetail from "./pages/RaceDetail";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminResults from "./pages/AdminResults";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, token } = useAppSelector(
    (state) => state.auth,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          data-testid="loading-spinner"
          className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-f1-red"
        ></div>
      </div>
    );
  }

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, token } = useAppSelector(
    (state) => state.auth,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          data-testid="loading-spinner"
          className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-f1-red"
        ></div>
      </div>
    );
  }

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }

  if (user && !user.is_admin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(fetchCurrentUser());
    }
    dispatch(fetchCurrentSeason());
  }, [dispatch, token]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="pick" element={<MakePick />} />
        <Route path="pick/:raceId" element={<MakePick />} />
        <Route path="calendar" element={<SeasonCalendar />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="race/:id" element={<RaceDetail />} />
        <Route path="profile" element={<Profile />} />
        <Route
          path="admin/results"
          element={
            <AdminRoute>
              <AdminResults />
            </AdminRoute>
          }
        />
        <Route
          path="admin/results/:raceId"
          element={
            <AdminRoute>
              <AdminResults />
            </AdminRoute>
          }
        />
      </Route>
    </Routes>
  );
}
