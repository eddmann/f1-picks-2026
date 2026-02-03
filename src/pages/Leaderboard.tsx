import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../lib/hooks";
import { fetchLeaderboard } from "../store/slices/leaderboardSlice";
import { Trophy } from "lucide-react";

export default function Leaderboard() {
  const dispatch = useAppDispatch();
  const { standings, season, isLoading } = useAppSelector(
    (state) => state.leaderboard,
  );
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchLeaderboard());
  }, [dispatch]);

  if (isLoading) {
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-semibold">Leaderboard</h1>
        {season && (
          <span className="text-sm text-gray-400 bg-carbon px-3 py-1.5 rounded-lg">
            {season.name}
          </span>
        )}
      </div>

      {standings.length === 0 ? (
        <div className="bg-carbon border border-asphalt rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-carbon-light rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium">No standings yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Standings will appear after the first race is completed
          </p>
        </div>
      ) : (
        <div className="bg-carbon border border-asphalt rounded-xl overflow-hidden">
          <div className="grid grid-cols-[60px_1fr_80px_100px] gap-4 px-5 py-3 border-b border-asphalt bg-carbon-light text-sm font-medium text-gray-400">
            <div>Pos</div>
            <div>Player</div>
            <div className="text-right">Races</div>
            <div className="text-right">Points</div>
          </div>

          <div className="divide-y divide-asphalt">
            {standings.map((entry, index) => {
              const isCurrentUser = entry.user_id === user?.id;
              const rank = entry.rank || index + 1;

              return (
                <div
                  key={entry.user_id}
                  className={`
                    grid grid-cols-[60px_1fr_80px_100px] gap-4 px-5 py-4 items-center
                    transition-colors
                    ${isCurrentUser ? "bg-f1-red/10" : "hover:bg-carbon-light"}
                    ${index < 5 ? `animate-slide-up stagger-${index + 1}` : ""}
                  `}
                >
                  <div>
                    {rank === 1 ? (
                      <div className="position-badge position-1">{rank}</div>
                    ) : rank === 2 ? (
                      <div className="position-badge position-2">{rank}</div>
                    ) : rank === 3 ? (
                      <div className="position-badge position-3">{rank}</div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-carbon-light flex items-center justify-center text-sm font-bold text-gray-500">
                        {rank}
                      </div>
                    )}
                  </div>

                  <div>
                    <span
                      className={`font-medium ${isCurrentUser ? "text-white" : "text-gray-300"}`}
                    >
                      {entry.user_name}
                    </span>
                    {isCurrentUser && (
                      <span className="ml-2 text-xs text-f1-red font-medium">
                        (You)
                      </span>
                    )}
                  </div>

                  <div className="text-right text-gray-400">
                    {entry.races_completed}
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-bold ${isCurrentUser ? "text-f1-red" : "text-white"}`}
                    >
                      {entry.total_points}
                    </span>
                    <span className="text-gray-500 text-sm ml-1">pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
