import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../lib/hooks";
import { fetchPicks } from "../store/slices/picksSlice";
import { fetchLeaderboard } from "../store/slices/leaderboardSlice";
import { getCountryFlag, formatDate } from "../lib/utils";
import {
  User,
  Trophy,
  Flag,
  Calendar,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export default function Profile() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { picks, isLoading: picksLoading } = useAppSelector(
    (state) => state.picks,
  );
  const { standings, isLoading: leaderboardLoading } = useAppSelector(
    (state) => state.leaderboard,
  );

  useEffect(() => {
    dispatch(fetchPicks());
    dispatch(fetchLeaderboard());
  }, [dispatch]);

  const userRank = standings.findIndex((s) => s.user_id === user?.id) + 1;
  const userStats = standings.find((s) => s.user_id === user?.id);

  const totalPoints = picks.reduce((sum, p) => sum + (p.points || 0), 0);
  const completedPicks = picks.filter((p) => p.points !== undefined);
  const avgPoints =
    completedPicks.length > 0
      ? (totalPoints / completedPicks.length).toFixed(1)
      : "0";

  const bestPick =
    completedPicks.length > 0
      ? completedPicks.reduce((a, b) =>
          (a.points || 0) > (b.points || 0) ? a : b,
        )
      : null;
  const worstPick =
    completedPicks.length > 0
      ? completedPicks.reduce((a, b) =>
          (a.points || 0) < (b.points || 0) ? a : b,
        )
      : null;

  if (picksLoading || leaderboardLoading) {
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
      <h1 className="text-xl md:text-2xl font-semibold">Profile</h1>

      <div className="bg-carbon border border-asphalt rounded-xl p-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-gradient-to-br from-f1-red to-f1-red-dark rounded-2xl flex items-center justify-center ring-4 ring-f1-red/20">
            <User className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white">
              {user?.name}
            </h2>
            <p className="text-gray-400">{user?.email}</p>
            <p className="text-sm text-gray-500 mt-1">
              Joined {user?.created_at ? formatDate(user.created_at) : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-carbon border border-asphalt rounded-xl p-4 text-center">
          <div className="w-10 h-10 bg-pole/20 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Trophy className="h-5 w-5 text-pole" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-white">
            {userRank > 0 ? `#${userRank}` : "-"}
          </p>
          <p className="text-sm text-gray-500 mt-1">Rank</p>
        </div>

        <div className="bg-carbon border border-asphalt rounded-xl p-4 text-center">
          <div className="w-10 h-10 bg-f1-red/20 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Flag className="h-5 w-5 text-f1-red" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-white">
            {userStats?.total_points || totalPoints}
          </p>
          <p className="text-sm text-gray-500 mt-1">Points</p>
        </div>

        <div className="bg-carbon border border-asphalt rounded-xl p-4 text-center">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Calendar className="h-5 w-5 text-blue-400" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-white">
            {picks.length}
          </p>
          <p className="text-sm text-gray-500 mt-1">Picks</p>
        </div>
      </div>

      {completedPicks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-carbon border border-asphalt rounded-xl p-4">
            <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">
              Avg. Points
            </h4>
            <p className="text-2xl md:text-3xl font-bold text-white">
              {avgPoints}
            </p>
            <p className="text-sm text-gray-500">per race</p>
          </div>

          {bestPick && (
            <div className="bg-carbon border border-asphalt rounded-xl p-4">
              <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-flag" />
                Best Pick
              </h4>
              <div className="flex items-center gap-2">
                <div
                  className="w-1 h-8 rounded-full"
                  style={{ backgroundColor: bestPick.driver?.team_color }}
                />
                <div>
                  <p className="font-bold text-white">
                    {bestPick.driver?.name}
                  </p>
                  <p className="text-xs text-gray-500">{bestPick.race?.name}</p>
                </div>
              </div>
              <p className="text-green-flag font-bold mt-2">
                {bestPick.points} pts
              </p>
            </div>
          )}

          {worstPick && (
            <div className="bg-carbon border border-asphalt rounded-xl p-4">
              <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-gray-400" />
                Needs Work
              </h4>
              <div className="flex items-center gap-2">
                <div
                  className="w-1 h-8 rounded-full"
                  style={{ backgroundColor: worstPick.driver?.team_color }}
                />
                <div>
                  <p className="font-bold text-white">
                    {worstPick.driver?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {worstPick.race?.name}
                  </p>
                </div>
              </div>
              <p className="text-gray-400 font-bold mt-2">
                {worstPick.points} pts
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-carbon border border-asphalt rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-asphalt">
          <h3 className="font-semibold text-white">Pick History</h3>
        </div>

        {picks.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No picks yet</div>
        ) : (
          <div className="divide-y divide-asphalt">
            {picks.map((pick, index) => (
              <div
                key={pick.id}
                className={`
                  flex items-center justify-between px-5 py-4 hover:bg-carbon-light transition-colors
                  ${index < 5 ? `animate-slide-up stagger-${index + 1}` : ""}
                `}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">
                    {getCountryFlag(pick.race?.country_code || "GB")}
                  </span>
                  <div>
                    <p className="font-medium text-white">{pick.race?.name}</p>
                    <p className="text-sm text-gray-500">
                      {pick.race ? formatDate(pick.race.race_time) : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-1 h-8 rounded-full"
                      style={{ backgroundColor: pick.driver?.team_color }}
                    />
                    <div className="text-right">
                      <p className="font-mono font-bold text-white">
                        {pick.driver?.code}
                      </p>
                      <p className="text-xs text-gray-500">
                        {pick.driver?.team}
                      </p>
                    </div>
                  </div>

                  {pick.points !== undefined && (
                    <div className="min-w-[60px] text-right bg-carbon-light px-3 py-1.5 rounded-lg">
                      <span
                        className={`font-bold ${pick.points > 0 ? "text-f1-red" : "text-gray-500"}`}
                      >
                        {pick.points}
                      </span>
                      <span className="text-gray-500 text-xs ml-1">pts</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
