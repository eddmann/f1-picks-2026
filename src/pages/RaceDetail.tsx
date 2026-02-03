import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { getCountryFlag, formatDateTime } from "../lib/utils";
import * as api from "../lib/api";
import type { Race, Driver, RaceResult, PickWithDetails } from "../types";
import { ArrowLeft, Trophy, Zap } from "lucide-react";

interface RaceResultWithDriver extends RaceResult {
  driver: Driver | null;
}

interface PickWithUser extends PickWithDetails {
  user_name: string;
  points: number;
}

export default function RaceDetail() {
  const { id } = useParams();
  const [race, setRace] = useState<Race | null>(null);
  const [results, setResults] = useState<RaceResultWithDriver[]>([]);
  const [picks, setPicks] = useState<PickWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"results" | "picks">("results");

  useEffect(() => {
    async function loadData() {
      if (!id) return;

      setIsLoading(true);
      const response = await api.getRaceResults(parseInt(id, 10));

      if (response.data) {
        setRace(response.data.race);
        setResults(response.data.results);
        setPicks(response.data.picks);
      }
      setIsLoading(false);
    }

    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-carbon-light border-t-f1-red"></div>
      </div>
    );
  }

  if (!race) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Race not found</p>
        <Link
          to="/calendar"
          className="text-f1-red hover:text-f1-red-glow mt-4 inline-block font-medium"
        >
          Back to calendar
        </Link>
      </div>
    );
  }

  const sortedPicks = [...picks].sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        to="/calendar"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to calendar
      </Link>

      <div className="bg-carbon border border-asphalt rounded-2xl overflow-hidden">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="text-5xl drop-shadow-lg">
              {getCountryFlag(race.country_code)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h1 className="text-xl md:text-2xl font-semibold text-white">
                  {race.name}
                </h1>
                <span className="text-xs text-gray-500 bg-carbon-light px-2.5 py-1 rounded-lg">
                  Round {race.round}
                </span>
              </div>
              <p className="text-gray-400">{race.circuit}</p>
              <p className="text-sm text-gray-500 mt-1">
                {formatDateTime(race.race_time)}
              </p>
            </div>
          </div>
          {race.has_sprint && (
            <div className="mt-4 inline-flex items-center gap-1.5 bg-purple-500/20 text-purple-300 text-xs px-3 py-1.5 rounded-lg border border-purple-500/30">
              <Zap className="h-3 w-3" />
              Sprint Weekend
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("results")}
          className={`
            px-5 py-2.5 rounded-xl font-medium transition-all duration-200 btn-press
            ${
              activeTab === "results"
                ? "bg-f1-red text-white glow-red"
                : "bg-carbon border border-asphalt text-gray-400 hover:text-white hover:bg-carbon-light"
            }
          `}
        >
          Race Results
        </button>
        <button
          onClick={() => setActiveTab("picks")}
          className={`
            px-5 py-2.5 rounded-xl font-medium transition-all duration-200 btn-press
            ${
              activeTab === "picks"
                ? "bg-f1-red text-white glow-red"
                : "bg-carbon border border-asphalt text-gray-400 hover:text-white hover:bg-carbon-light"
            }
          `}
        >
          Player Picks
        </button>
      </div>

      {activeTab === "results" && (
        <div className="bg-carbon border border-asphalt rounded-xl overflow-hidden">
          {results.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              Results not yet available
            </div>
          ) : (
            <>
              <div
                className={`
                grid gap-4 px-5 py-3 border-b border-asphalt bg-carbon-light text-sm font-medium text-gray-400
                ${race.has_sprint ? "grid-cols-[50px_1fr_80px_80px_80px]" : "grid-cols-[50px_1fr_80px_80px]"}
              `}
              >
                <div>Pos</div>
                <div>Driver</div>
                <div className="text-right">Race</div>
                {race.has_sprint && <div className="text-right">Sprint</div>}
                <div className="text-right">Total</div>
              </div>

              <div className="divide-y divide-asphalt">
                {results.map((result, index) => (
                  <div
                    key={result.id}
                    className={`
                      grid gap-4 px-5 py-3.5 items-center hover:bg-carbon-light transition-colors
                      ${race.has_sprint ? "grid-cols-[50px_1fr_80px_80px_80px]" : "grid-cols-[50px_1fr_80px_80px]"}
                      ${index < 5 ? `animate-slide-up stagger-${index + 1}` : ""}
                    `}
                  >
                    <div>
                      {result.race_position === 1 ? (
                        <div className="position-badge position-1">1</div>
                      ) : result.race_position === 2 ? (
                        <div className="position-badge position-2">2</div>
                      ) : result.race_position === 3 ? (
                        <div className="position-badge position-3">3</div>
                      ) : (
                        <span className="text-gray-500 font-bold pl-2">
                          {result.race_position || "-"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className="w-1 h-8 rounded-full"
                        style={{ backgroundColor: result.driver?.team_color }}
                      />
                      <div>
                        <p className="font-medium text-white">
                          {result.driver?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {result.driver?.team}
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-gray-300">
                      {result.race_points || "-"}
                    </div>

                    {race.has_sprint && (
                      <div className="text-right text-gray-400">
                        {result.sprint_points || "-"}
                      </div>
                    )}

                    <div className="text-right font-bold text-white">
                      {result.race_points + result.sprint_points}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "picks" && (
        <div className="bg-carbon border border-asphalt rounded-xl overflow-hidden">
          {sortedPicks.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              No picks for this race
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_1fr_80px] gap-4 px-5 py-3 border-b border-asphalt bg-carbon-light text-sm font-medium text-gray-400">
                <div>Player</div>
                <div>Pick</div>
                <div className="text-right">Points</div>
              </div>

              <div className="divide-y divide-asphalt">
                {sortedPicks.map((pick, index) => (
                  <div
                    key={pick.id}
                    className={`
                      grid grid-cols-[1fr_1fr_80px] gap-4 px-5 py-3.5 items-center hover:bg-carbon-light transition-colors
                      ${index < 5 ? `animate-slide-up stagger-${index + 1}` : ""}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      {index === 0 && pick.points > 0 && (
                        <Trophy className="h-4 w-4 text-pole" />
                      )}
                      <span className="font-medium text-gray-300">
                        {pick.user_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className="w-1 h-8 rounded-full"
                        style={{ backgroundColor: pick.driver?.team_color }}
                      />
                      <span className="font-mono font-bold text-white">
                        {pick.driver?.code}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {pick.driver?.name}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-bold ${pick.points > 0 ? "text-f1-red" : "text-gray-500"}`}
                      >
                        {pick.points}
                      </span>
                      <span className="text-gray-500 text-sm ml-1">pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
