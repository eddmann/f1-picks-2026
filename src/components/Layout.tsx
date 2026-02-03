import { Outlet, NavLink, useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "../lib/hooks";
import { logout } from "../store/slices/authSlice";
import {
  Home,
  Calendar,
  Trophy,
  User,
  LogOut,
  Flag,
  Settings,
} from "lucide-react";

export default function Layout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { currentSeason } = useAppSelector((state) => state.season);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      isActive
        ? "bg-f1-red text-white glow-red"
        : "text-gray-400 hover:bg-carbon-light hover:text-white"
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 min-w-[60px] ${
      isActive ? "text-f1-red" : "text-gray-500 hover:text-gray-300"
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass gradient-border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <NavLink
            to="/"
            className="flex items-center gap-2 group transition-transform duration-200 hover:scale-[1.02]"
          >
            <img src="/logo.png" alt="F1 Picks" className="h-8" />
            <span className="text-f1-red font-bold text-lg">
              {currentSeason?.year || "2026"}
            </span>
          </NavLink>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-carbon rounded-lg">
              <div className="w-2 h-2 bg-green-flag rounded-full animate-pulse-subtle" />
              <span className="text-gray-400 text-sm font-medium">
                {user?.name}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 text-gray-400 hover:text-white hover:bg-carbon-light rounded-xl transition-all duration-200 btn-press"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        <nav className="w-64 glass border-r border-white/5 p-4 hidden md:block sticky top-[61px] h-[calc(100vh-61px)] overflow-y-auto">
          <ul className="space-y-2">
            <li className="animate-slide-up stagger-1">
              <NavLink to="/" end className={navLinkClass}>
                <Home className="h-5 w-5" />
                <span className="font-medium">Dashboard</span>
              </NavLink>
            </li>
            <li className="animate-slide-up stagger-2">
              <NavLink to="/pick" className={navLinkClass}>
                <Flag className="h-5 w-5" />
                <span className="font-medium">Make Pick</span>
              </NavLink>
            </li>
            <li className="animate-slide-up stagger-3">
              <NavLink to="/calendar" className={navLinkClass}>
                <Calendar className="h-5 w-5" />
                <span className="font-medium">Calendar</span>
              </NavLink>
            </li>
            <li className="animate-slide-up stagger-4">
              <NavLink to="/leaderboard" className={navLinkClass}>
                <Trophy className="h-5 w-5" />
                <span className="font-medium">Leaderboard</span>
              </NavLink>
            </li>
            <li className="animate-slide-up stagger-5">
              <NavLink to="/profile" className={navLinkClass}>
                <User className="h-5 w-5" />
                <span className="font-medium">Profile</span>
              </NavLink>
            </li>
            {!!user?.is_admin && (
              <li className="pt-4 mt-4 border-t border-white/5">
                <NavLink to="/admin/results" className={navLinkClass}>
                  <Settings className="h-5 w-5" />
                  <span className="font-medium">Admin</span>
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        <main className="flex-1 p-4 md:p-6 pb-28 md:pb-6">
          <Outlet />
        </main>
      </div>

      <nav className="md:hidden mobile-nav-float z-50 animate-slide-up">
        <ul className="flex justify-around py-2 px-1">
          <li>
            <NavLink to="/" end className={mobileNavLinkClass}>
              {({ isActive }) => (
                <>
                  <Home
                    className={`h-5 w-5 ${isActive ? "animate-glow-pulse" : ""}`}
                  />
                  <span className="text-xs mt-1 font-medium">Home</span>
                  {isActive && (
                    <div className="absolute -bottom-0.5 w-1 h-1 bg-f1-red rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          </li>
          <li>
            <NavLink to="/pick" className={mobileNavLinkClass}>
              {({ isActive }) => (
                <>
                  <Flag
                    className={`h-5 w-5 ${isActive ? "animate-glow-pulse" : ""}`}
                  />
                  <span className="text-xs mt-1 font-medium">Pick</span>
                  {isActive && (
                    <div className="absolute -bottom-0.5 w-1 h-1 bg-f1-red rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          </li>
          <li>
            <NavLink to="/calendar" className={mobileNavLinkClass}>
              {({ isActive }) => (
                <>
                  <Calendar
                    className={`h-5 w-5 ${isActive ? "animate-glow-pulse" : ""}`}
                  />
                  <span className="text-xs mt-1 font-medium">Calendar</span>
                  {isActive && (
                    <div className="absolute -bottom-0.5 w-1 h-1 bg-f1-red rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          </li>
          <li>
            <NavLink to="/leaderboard" className={mobileNavLinkClass}>
              {({ isActive }) => (
                <>
                  <Trophy
                    className={`h-5 w-5 ${isActive ? "animate-glow-pulse" : ""}`}
                  />
                  <span className="text-xs mt-1 font-medium">Standings</span>
                  {isActive && (
                    <div className="absolute -bottom-0.5 w-1 h-1 bg-f1-red rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          </li>
          <li>
            <NavLink to="/profile" className={mobileNavLinkClass}>
              {({ isActive }) => (
                <>
                  <User
                    className={`h-5 w-5 ${isActive ? "animate-glow-pulse" : ""}`}
                  />
                  <span className="text-xs mt-1 font-medium">Profile</span>
                  {isActive && (
                    <div className="absolute -bottom-0.5 w-1 h-1 bg-f1-red rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
}
