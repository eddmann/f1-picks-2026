import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useAppDispatch, useAppSelector } from "../lib/hooks";
import { fetchCurrentRace, fetchRace } from "../store/slices/racesSlice";
import { fetchAvailableDrivers } from "../store/slices/driversSlice";
import { fetchPicks, submitPick, clearError } from "../store/slices/picksSlice";
import DriverCard from "../components/DriverCard";
import Countdown from "../components/Countdown";
import {
  getCountryFlag,
  formatDate,
  formatDateTime,
  getPickWindowStatus,
} from "../lib/utils";
import { ArrowLeft, Check, Zap, X, Star, Clock } from "lucide-react";

export default function MakePick() {
  const { raceId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    currentRace,
    selectedRace,
    isLoading: racesLoading,
  } = useAppSelector((state) => state.races);
  const { availableDrivers, isLoading: driversLoading } = useAppSelector(
    (state) => state.drivers,
  );
  const { picks, isSubmitting, error } = useAppSelector((state) => state.picks);

  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);

  const race = raceId ? selectedRace : currentRace;

  useEffect(() => {
    if (raceId) {
      dispatch(fetchRace(parseInt(raceId, 10)));
    } else {
      dispatch(fetchCurrentRace());
    }
    dispatch(fetchAvailableDrivers());
    dispatch(fetchPicks());
  }, [dispatch, raceId]);

  useEffect(() => {
    if (race) {
      const existingPick = picks.find((p) => p.race_id === race.id);
      if (existingPick) {
        setSelectedDriverId(existingPick.driver_id);
      }
    }
  }, [race, picks]);

  const pickWindow = race ? getPickWindowStatus(race) : null;
  const windowStatus = pickWindow?.status ?? "locked";
  const canMakePick = windowStatus === "open";
  const existingPick = race ? picks.find((p) => p.race_id === race.id) : null;

  const handleSubmit = async () => {
    if (!race || !selectedDriverId || !canMakePick) return;

    const result = await dispatch(
      submitPick({ raceId: race.id, driverId: selectedDriverId }),
    );

    if (submitPick.fulfilled.match(result)) {
      navigate("/");
    }
  };

  const driversByTeam = availableDrivers.reduce(
    (acc, driver) => {
      if (!acc[driver.team]) {
        acc[driver.team] = [];
      }
      acc[driver.team].push(driver);
      return acc;
    },
    {} as Record<string, typeof availableDrivers>,
  );

  if (racesLoading || driversLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          data-testid="loading-spinner"
          className="animate-spin rounded-full h-10 w-10 border-2 border-carbon-light border-t-f1-red"
        ></div>
      </div>
    );
  }

  if (!race) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No race found</p>
        <Link
          to="/"
          className="text-f1-red hover:text-f1-red-glow mt-4 inline-block font-medium"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 hover:bg-carbon rounded-xl transition-all duration-200 btn-press"
        >
          <ArrowLeft className="h-5 w-5 text-gray-400" />
        </button>
        <h1 className="text-xl md:text-2xl font-semibold">Make Your Pick</h1>
      </div>

      <div className="bg-carbon border border-asphalt rounded-2xl overflow-hidden">
        <div className="p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="text-5xl drop-shadow-lg">
              {getCountryFlag(race.country_code)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base md:text-lg font-semibold text-white">
                  {race.name}
                </h2>
                <span className="text-xs text-gray-500 bg-carbon-light px-2.5 py-1 rounded-lg">
                  Round {race.round}
                </span>
              </div>
              <p className="text-gray-400 text-sm">{race.circuit}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            {race.is_wild_card && (
              <div className="inline-flex items-center gap-1.5 bg-yellow-500/20 text-yellow-300 text-xs px-3 py-1.5 rounded-lg border border-yellow-500/30">
                <Star className="h-3 w-3" />
                <span className="font-medium">Wild Card</span>
              </div>
            )}
            {race.has_sprint && (
              <div className="inline-flex items-center gap-1.5 bg-purple-500/20 text-purple-300 text-xs px-3 py-1.5 rounded-lg border border-purple-500/30">
                <Zap className="h-3 w-3" />
                <span className="font-medium">Sprint Weekend</span>
              </div>
            )}
          </div>

          {windowStatus === "locked" && (
            <div className="flex items-center gap-2 bg-f1-red/10 border border-f1-red/20 text-f1-red text-sm px-4 py-3 rounded-xl">
              <X className="h-4 w-4" />
              <span className="font-medium">
                Picks are locked for this race
              </span>
            </div>
          )}
          {windowStatus === "too_early" && pickWindow && (
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm px-4 py-3 rounded-xl">
              <Clock className="h-4 w-4" />
              <span className="font-medium">
                Pick window opens {formatDate(pickWindow.opensAt)}
              </span>
            </div>
          )}
          {windowStatus === "open" && pickWindow && (
            <div>
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
                Picks lock 10 mins before{" "}
                {pickWindow.deadlineSession === "sprint_qualifying"
                  ? "Sprint Quali"
                  : "Quali"}
                : {formatDateTime(pickWindow.closesAt)}
              </p>
              <Countdown targetDate={pickWindow.closesAt.toISOString()} />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-f1-red/10 border border-f1-red/30 text-f1-red px-4 py-3 rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => dispatch(clearError())}
            className="p-1 hover:bg-f1-red/20 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {canMakePick && (
        <div className="space-y-6">
          {Object.entries(driversByTeam).map(([team, drivers]) => (
            <div key={team}>
              <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                {team}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {drivers.map((driver) => (
                  <DriverCard
                    key={driver.id}
                    driver={driver}
                    selected={selectedDriverId === driver.id}
                    disabled={!race.is_wild_card && !driver.is_available}
                    showStatus={!race.is_wild_card}
                    onClick={() => setSelectedDriverId(driver.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {canMakePick &&
        selectedDriverId !== null &&
        selectedDriverId !== existingPick?.driver_id && (
          <div className="fixed bottom-18 md:bottom-6 left-0 right-0 px-4 z-40">
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-t from-pit-black via-pit-black/95 to-transparent pt-6 pb-2">
                <button
                  onClick={handleSubmit}
                  disabled={!selectedDriverId || isSubmitting}
                  className={`
                  w-full py-4 rounded-xl font-bold text-base md:text-lg transition-all duration-200 btn-press
                  flex items-center justify-center gap-2
                  ${
                    selectedDriverId
                      ? "bg-f1-red hover:bg-f1-red-dark text-white glow-red"
                      : "bg-carbon border border-asphalt text-gray-500 cursor-not-allowed"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : existingPick ? (
                    <>
                      <Check className="h-5 w-5" />
                      <span>Update Pick</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      <span>Confirm Pick</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      {!canMakePick && existingPick && (
        <div className="bg-carbon border border-asphalt rounded-xl p-5">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
            Your pick for this race
          </h3>
          <div className="flex items-center gap-4">
            <div
              className="w-1.5 h-14 rounded-full"
              style={{ backgroundColor: existingPick.driver?.team_color }}
            />
            <div>
              <p className="text-lg md:text-xl font-bold text-white">
                {existingPick.driver?.name}
              </p>
              <p className="text-gray-400 text-sm">
                {existingPick.driver?.team}
              </p>
            </div>
          </div>
        </div>
      )}

      {canMakePick &&
        selectedDriverId !== null &&
        selectedDriverId !== existingPick?.driver_id && (
          <div className="h-18" />
        )}
    </div>
  );
}
