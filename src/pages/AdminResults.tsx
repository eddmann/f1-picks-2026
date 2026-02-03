import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { useAppDispatch, useAppSelector } from "../lib/hooks";
import { fetchRaces } from "../store/slices/racesSlice";
import { fetchDrivers } from "../store/slices/driversSlice";
import * as api from "../lib/api";
import { getCountryFlag, formatDate } from "../lib/utils";
import { ArrowLeft, Save, Check, X, Zap, RefreshCcw } from "lucide-react";

interface DriverResult {
  driver_id: number;
  race_position: number | null;
  sprint_position: number | null;
}

export default function AdminResults() {
  const { raceId } = useParams();
  const dispatch = useAppDispatch();
  const { races, isLoading: racesLoading } = useAppSelector(
    (state) => state.races,
  );
  const { drivers, isLoading: driversLoading } = useAppSelector(
    (state) => state.drivers,
  );

  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(
    raceId ? parseInt(raceId, 10) : null,
  );
  const [results, setResults] = useState<DriverResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    dispatch(fetchRaces());
    dispatch(fetchDrivers());
  }, [dispatch]);

  useEffect(() => {
    if (selectedRaceId && drivers.length > 0) {
      setResults(
        drivers.map((d) => ({
          driver_id: d.id,
          race_position: null,
          sprint_position: null,
        })),
      );
    }
  }, [selectedRaceId, drivers]);

  const selectedRace = races.find((r) => r.id === selectedRaceId);
  const pendingRaces = races.filter((r) => r.status !== "completed");

  const updatePosition = (
    driverId: number,
    type: "race" | "sprint",
    value: string,
  ) => {
    const position = value === "" ? null : parseInt(value, 10);
    if (
      position !== null &&
      (isNaN(position) || position < 1 || position > 20)
    ) {
      return;
    }

    setResults((prev) =>
      prev.map((r) =>
        r.driver_id === driverId
          ? {
              ...r,
              [type === "race" ? "race_position" : "sprint_position"]: position,
            }
          : r,
      ),
    );
  };

  const handleSubmit = async () => {
    if (!selectedRaceId) return;

    const validResults = results.filter(
      (r) => r.race_position !== null || r.sprint_position !== null,
    );

    if (validResults.length === 0) {
      setMessage({ type: "error", text: "Please enter at least one result" });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const response = await api.submitRaceResults(selectedRaceId, validResults);

    if (response.error) {
      setMessage({ type: "error", text: response.error });
    } else {
      setMessage({ type: "success", text: "Results saved successfully" });
      dispatch(fetchRaces());
    }

    setIsSubmitting(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setMessage(null);

    const response = await api.triggerSync();

    if (response.error) {
      setMessage({ type: "error", text: response.error });
    } else if (response.data) {
      const { races_started, races_synced, races_failed } = response.data;
      const summary = `Sync complete. Started ${races_started}, synced ${races_synced.length}, failed ${races_failed.length}.`;
      const failures =
        races_failed.length > 0 ? ` Failed: ${races_failed.join(", ")}.` : "";
      setMessage({ type: "success", text: summary + failures });
      dispatch(fetchRaces());
    }

    setIsSyncing(false);
  };

  if (racesLoading || driversLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-carbon-light border-t-f1-red"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2.5 hover:bg-carbon rounded-xl transition-all duration-200 btn-press"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </Link>
          <h1 className="text-xl md:text-2xl font-semibold">
            Admin: Enter Results
          </h1>
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="px-4 py-2.5 bg-carbon border border-asphalt rounded-xl text-sm font-medium text-gray-200 hover:bg-carbon-light transition-all duration-200 btn-press flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSyncing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <RefreshCcw className="h-4 w-4" />
              <span>Manual Sync</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-carbon border border-asphalt rounded-xl p-5">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Select Race
        </label>
        <select
          value={selectedRaceId || ""}
          onChange={(e) =>
            setSelectedRaceId(
              e.target.value ? parseInt(e.target.value, 10) : null,
            )
          }
          className="w-full px-4 py-3 bg-pit-black border border-asphalt rounded-xl text-white focus:outline-none focus:border-f1-red transition-colors"
        >
          <option value="">Select a race...</option>
          {pendingRaces.map((race) => (
            <option key={race.id} value={race.id}>
              Round {race.round}: {race.name} ({race.status})
            </option>
          ))}
        </select>
      </div>

      {selectedRace && (
        <>
          <div className="bg-carbon border border-asphalt rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="text-4xl">
                {getCountryFlag(selectedRace.country_code)}
              </div>
              <div>
                <h2 className="text-base md:text-lg font-semibold text-white">
                  {selectedRace.name}
                </h2>
                <p className="text-gray-400">
                  {formatDate(selectedRace.race_time)}
                </p>
                {selectedRace.has_sprint && (
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-purple-500/20 text-purple-300 text-xs px-3 py-1.5 rounded-lg border border-purple-500/30">
                    <Zap className="h-3 w-3" />
                    Sprint Weekend
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-carbon border border-asphalt rounded-xl overflow-hidden">
            <div
              className={`
              grid gap-4 px-5 py-3 border-b border-asphalt bg-carbon-light text-sm font-medium text-gray-400
              ${selectedRace.has_sprint ? "grid-cols-[1fr_100px_100px]" : "grid-cols-[1fr_100px]"}
            `}
            >
              <div>Driver</div>
              <div className="text-center">Race Pos</div>
              {selectedRace.has_sprint && (
                <div className="text-center">Sprint Pos</div>
              )}
            </div>

            <div className="divide-y divide-asphalt">
              {drivers.map((driver, index) => {
                const result = results.find((r) => r.driver_id === driver.id);
                return (
                  <div
                    key={driver.id}
                    className={`
                      grid gap-4 px-5 py-3 items-center
                      ${selectedRace.has_sprint ? "grid-cols-[1fr_100px_100px]" : "grid-cols-[1fr_100px]"}
                      ${index < 5 ? `animate-slide-up stagger-${index + 1}` : ""}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-1 h-8 rounded-full"
                        style={{ backgroundColor: driver.team_color }}
                      />
                      <span className="font-mono w-12 text-gray-400">
                        {driver.code}
                      </span>
                      <span className="text-white">{driver.name}</span>
                    </div>

                    <div>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={result?.race_position ?? ""}
                        onChange={(e) =>
                          updatePosition(driver.id, "race", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-pit-black border border-asphalt rounded-xl text-center text-white focus:outline-none focus:border-f1-red transition-colors"
                        placeholder="-"
                      />
                    </div>

                    {selectedRace.has_sprint && (
                      <div>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={result?.sprint_position ?? ""}
                          onChange={(e) =>
                            updatePosition(driver.id, "sprint", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-pit-black border border-asphalt rounded-xl text-center text-white focus:outline-none focus:border-f1-red transition-colors"
                          placeholder="-"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {message && (
            <div
              className={`
                px-4 py-3 rounded-xl flex items-center gap-2
                ${
                  message.type === "success"
                    ? "bg-green-flag/10 border border-green-flag/30 text-green-flag"
                    : "bg-f1-red/10 border border-f1-red/30 text-f1-red"
                }
              `}
            >
              {message.type === "success" ? (
                <Check className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 bg-f1-red hover:bg-f1-red-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-base md:text-lg transition-all duration-200 btn-press glow-red flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Save Results</span>
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
