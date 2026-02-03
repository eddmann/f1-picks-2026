import { useEffect } from "react";
import { Link } from "react-router";
import { useAppDispatch, useAppSelector } from "../lib/hooks";
import { fetchRaces } from "../store/slices/racesSlice";
import { fetchPicks } from "../store/slices/picksSlice";
import { getCountryFlag, formatDate, getPickWindowStatus } from "../lib/utils";
import { Check, Lock, ChevronRight, Zap, Star, Clock } from "lucide-react";

export default function SeasonCalendar() {
  const dispatch = useAppDispatch();
  const { races, isLoading } = useAppSelector((state) => state.races);
  const { picks } = useAppSelector((state) => state.picks);

  useEffect(() => {
    dispatch(fetchRaces());
    dispatch(fetchPicks());
  }, [dispatch]);

  const picksMap = new Map(picks.map((p) => [p.race_id, p]));

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
      <h1 className="text-xl md:text-2xl font-semibold">
        2026 Season Calendar
      </h1>

      <div className="relative">
        <div className="absolute left-[11px] sm:left-[15px] top-0 bottom-0 w-0.5 bg-asphalt" />

        <div className="space-y-2 sm:space-y-3">
          {races.map((race, index) => {
            const pick = picksMap.get(race.id);
            const windowStatus = getPickWindowStatus(race);
            const canPick =
              windowStatus.status === "open" && race.status === "upcoming";
            const isTooEarly = windowStatus.status === "too_early";
            const isLocked = windowStatus.status === "locked";
            const isCompleted = race.status === "completed";
            const isInProgress = race.status === "in_progress";

            return (
              <Link
                key={race.id}
                to={isCompleted ? `/race/${race.id}` : `/pick/${race.id}`}
                className={`
                  block relative pl-8 sm:pl-10 animate-slide-up
                  ${index < 5 ? `stagger-${index + 1}` : ""}
                `}
              >
                <div
                  className={`
                    absolute left-1 sm:left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 z-10
                    flex items-center justify-center
                    ${
                      isCompleted
                        ? "bg-green-flag border-green-flag"
                        : isInProgress
                          ? "bg-yellow-500 border-yellow-500 animate-pulse"
                          : canPick
                            ? "bg-f1-red border-f1-red"
                            : isTooEarly
                              ? "bg-blue-500/20 border-blue-500/50"
                              : "bg-carbon border-asphalt"
                    }
                  `}
                >
                  {isCompleted && (
                    <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-pit-black" />
                  )}
                  {isInProgress && (
                    <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-pit-black" />
                  )}
                </div>

                <div
                  className={`
                    bg-carbon border border-asphalt rounded-xl p-3 sm:p-4 card-hover
                    ${isCompleted ? "opacity-75" : ""}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-carbon-light rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm text-gray-400">
                        {race.round}
                      </div>
                      <span className="text-2xl sm:text-3xl">
                        {getCountryFlag(race.country_code)}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-white leading-tight">
                        {race.name}
                      </h3>
                      <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm text-gray-500">
                          {formatDate(race.race_time)}
                        </span>
                        {race.has_sprint && (
                          <span className="inline-flex items-center gap-0.5 text-xs bg-purple-500/20 text-purple-300 p-1 sm:px-1.5 sm:py-0.5 rounded border border-purple-500/30">
                            <Zap className="h-2.5 w-2.5" />
                            <span className="hidden sm:inline">Sprint</span>
                          </span>
                        )}
                        {race.is_wild_card && (
                          <span className="inline-flex items-center gap-0.5 text-xs bg-yellow-500/20 text-yellow-300 p-1 sm:px-1.5 sm:py-0.5 rounded border border-yellow-500/30">
                            <Star className="h-2.5 w-2.5" />
                            <span className="hidden sm:inline">Wild</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {pick ? (
                        <div className="flex items-center gap-1.5">
                          {pick.driver?.code && (
                            <div className="flex items-center gap-1">
                              <div
                                className="w-0.5 h-6 rounded-full"
                                style={{
                                  backgroundColor: pick.driver?.team_color,
                                }}
                              />
                              <span className="text-xs sm:text-sm font-mono font-bold text-white">
                                {pick.driver.code}
                              </span>
                            </div>
                          )}
                          <div className="w-6 h-6 bg-green-flag/20 rounded-full flex items-center justify-center">
                            <Check className="h-3.5 w-3.5 text-green-flag" />
                          </div>
                        </div>
                      ) : isLocked ? (
                        <div className="w-6 h-6 bg-asphalt rounded-full flex items-center justify-center">
                          <Lock className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                      ) : isTooEarly ? (
                        <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <Clock className="h-3.5 w-3.5 text-blue-400" />
                        </div>
                      ) : canPick ? (
                        <ChevronRight className="h-5 w-5 text-f1-red" />
                      ) : null}
                    </div>
                  </div>

                  {pick?.points !== undefined && pick.points > 0 && (
                    <div className="mt-2 pt-2 border-t border-asphalt flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Points earned
                      </span>
                      <span className="text-sm font-bold text-f1-red">
                        {pick.points} pts
                      </span>
                    </div>
                  )}

                  {(isCompleted || isInProgress) && !pick?.points && (
                    <div className="mt-2 pt-2 border-t border-asphalt">
                      {isCompleted && (
                        <span className="text-xs text-gray-500">
                          Completed - View results
                        </span>
                      )}
                      {isInProgress && (
                        <span className="text-xs text-yellow-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                          Race weekend in progress
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
