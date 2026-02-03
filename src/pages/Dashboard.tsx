import { useEffect } from "react";
import { Link } from "react-router";
import { useAppDispatch, useAppSelector } from "../lib/hooks";
import { fetchCurrentRace } from "../store/slices/racesSlice";
import { fetchPicks } from "../store/slices/picksSlice";
import { fetchLeaderboard } from "../store/slices/leaderboardSlice";
import Countdown from "../components/Countdown";
import {
  getCountryFlag,
  formatDate,
  formatDateTime,
  getPickWindowStatus,
} from "../lib/utils";
import { Flag, Trophy, Calendar, ChevronRight, Zap, Clock } from "lucide-react";

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { currentRace, isLoading: racesLoading } = useAppSelector(
    (state) => state.races,
  );
  const { picks, isLoading: picksLoading } = useAppSelector(
    (state) => state.picks,
  );
  const { standings, isLoading: leaderboardLoading } = useAppSelector(
    (state) => state.leaderboard,
  );
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchCurrentRace());
    dispatch(fetchPicks());
    dispatch(fetchLeaderboard());
  }, [dispatch]);

  const currentPick = currentRace
    ? picks.find((p) => p.race_id === currentRace.id)
    : null;

  const pickWindow = currentRace ? getPickWindowStatus(currentRace) : null;
  const windowStatus = pickWindow?.status ?? "locked";
  const canMakePick = windowStatus === "open";

  const userRank = standings.findIndex((s) => s.user_id === user?.id) + 1;
  const userStats = standings.find((s) => s.user_id === user?.id);

  if (racesLoading || picksLoading || leaderboardLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          data-testid="loading-spinner"
          className="animate-spin rounded-full h-10 w-10 border-2 border-carbon-light border-t-f1-red"
        ></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-xl md:text-2xl font-semibold">Dashboard</h1>

      {currentRace && (
        <div className="bg-carbon border border-asphalt rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-asphalt bg-carbon-light">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-f1-red" />
              <span className="text-sm font-medium text-gray-300">
                {currentRace.status === "completed"
                  ? "Latest Race"
                  : "Next Race"}
              </span>
            </div>
            <span className="text-xs text-gray-500 bg-carbon px-2.5 py-1 rounded-lg">
              Round {currentRace.round}
            </span>
          </div>

          <div className="p-5">
            <div className="flex items-start gap-4 mb-5">
              <div className="text-5xl drop-shadow-lg">
                {getCountryFlag(currentRace.country_code)}
              </div>
              <div className="flex-1">
                <h2 className="text-base md:text-lg font-semibold text-white">
                  {currentRace.name}
                </h2>
                <p className="text-gray-400 text-sm">{currentRace.circuit}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {currentRace.location}
                </p>
              </div>
            </div>

            {currentRace.status !== "completed" && pickWindow && (
              <div>
                {windowStatus === "locked" && (
                  <div className="flex items-center gap-2 text-f1-red text-sm">
                    <Clock className="h-4 w-4" />
                    <span>Picks are locked for this race</span>
                  </div>
                )}
                {windowStatus === "too_early" && (
                  <div className="flex items-center gap-2 text-blue-400 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>
                      Pick window opens {formatDate(pickWindow.opensAt)}
                    </span>
                  </div>
                )}
                {windowStatus === "open" && (
                  <>
                    <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
                      Picks lock 10 mins before{" "}
                      {pickWindow.deadlineSession === "sprint_qualifying"
                        ? "Sprint Quali"
                        : "Quali"}
                      : {formatDateTime(pickWindow.closesAt)}
                    </p>
                    <Countdown targetDate={pickWindow.closesAt.toISOString()} />
                  </>
                )}
              </div>
            )}

            <div className="flex gap-2 mb-5">
              {currentRace.has_sprint && (
                <div className="inline-flex items-center gap-1.5 bg-purple-500/20 text-purple-300 text-xs px-3 py-1.5 rounded-lg border border-purple-500/30">
                  <Zap className="h-3 w-3" />
                  Sprint Weekend
                </div>
              )}
              {currentRace.is_wild_card && (
                <div className="inline-flex items-center gap-1.5 bg-yellow-500/20 text-yellow-300 text-xs px-3 py-1.5 rounded-lg border border-yellow-500/30">
                  Wild Card
                </div>
              )}
            </div>

            <div className="border-t border-asphalt pt-5">
              {currentPick ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-1 h-10 rounded-full"
                      style={{
                        backgroundColor: currentPick.driver?.team_color,
                      }}
                    />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">
                        Your pick
                      </p>
                      <p className="font-bold text-base md:text-lg text-white">
                        {currentPick.driver?.name}
                        <span className="text-gray-400 font-normal ml-2 text-sm">
                          {currentPick.driver?.code}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {canMakePick && currentRace.status === "upcoming" && (
                      <Link
                        to={`/pick/${currentRace.id}`}
                        className="text-f1-red hover:text-f1-red-glow text-sm font-medium transition-colors"
                      >
                        Change
                      </Link>
                    )}
                    {currentPick.points !== undefined && (
                      <div className="text-right bg-carbon-light px-4 py-2 rounded-xl">
                        <p className="text-xs text-gray-500">Points</p>
                        <p className="font-bold text-xl md:text-2xl text-f1-red">
                          {currentPick.points}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : currentRace.status === "upcoming" ? (
                <Link
                  to={`/pick/${currentRace.id}`}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-f1-red hover:bg-f1-red-dark rounded-xl font-bold transition-all duration-200 btn-press glow-red"
                >
                  Make Your Pick
                  <ChevronRight className="h-5 w-5" />
                </Link>
              ) : (
                <p className="text-gray-500 text-center py-3">
                  No pick made for this race
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 animate-slide-up stagger-2">
        <Link
          to="/leaderboard"
          className="bg-carbon border border-asphalt rounded-xl p-5 card-hover group"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-pole/20 rounded-lg flex items-center justify-center">
              <Trophy className="h-4 w-4 text-pole" />
            </div>
            <span className="text-sm text-gray-400 font-medium">Your Rank</span>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-white">
            {userRank > 0 ? (
              <>
                <span className="text-gray-500">#</span>
                {userRank}
              </>
            ) : (
              "-"
            )}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {userStats ? `${userStats.total_points} points` : "No picks yet"}
          </p>
        </Link>

        <Link
          to="/calendar"
          className="bg-carbon border border-asphalt rounded-xl p-5 card-hover group"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-blue-400" />
            </div>
            <span className="text-sm text-gray-400 font-medium">Races</span>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-white">
            {picks.length}
          </p>
          <p className="text-sm text-gray-500 mt-1">picks made</p>
        </Link>
      </div>

      <div className="bg-carbon border border-asphalt rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-asphalt">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-pole" />
            <h2 className="text-base font-semibold text-white">Standings</h2>
          </div>
          <Link
            to="/leaderboard"
            className="text-f1-red hover:text-f1-red-glow text-sm font-medium transition-colors"
          >
            View all
          </Link>
        </div>

        <div className="divide-y divide-asphalt">
          {standings.slice(0, 5).map((entry, index) => {
            const isCurrentUser = entry.user_id === user?.id;
            return (
              <div
                key={entry.user_id}
                className={`flex items-center justify-between px-5 py-3.5 transition-colors ${
                  isCurrentUser ? "bg-f1-red/10" : "hover:bg-carbon-light"
                }`}
              >
                <div className="flex items-center gap-4">
                  {index === 0 ? (
                    <div className="position-badge position-1">1</div>
                  ) : index === 1 ? (
                    <div className="position-badge position-2">2</div>
                  ) : index === 2 ? (
                    <div className="position-badge position-3">3</div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-carbon-light flex items-center justify-center text-sm font-bold text-gray-500">
                      {index + 1}
                    </div>
                  )}
                  <span
                    className={`font-medium ${isCurrentUser ? "text-white" : "text-gray-300"}`}
                  >
                    {entry.user_name}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs text-f1-red">(You)</span>
                    )}
                  </span>
                </div>
                <span className="font-bold text-white">
                  {entry.total_points} pts
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
