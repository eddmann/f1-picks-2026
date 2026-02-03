import type { Driver, DriverWithAvailability } from "../types";
import { Check, X } from "lucide-react";

interface DriverCardProps {
  driver: Driver | DriverWithAvailability;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  showStatus?: boolean;
}

export default function DriverCard({
  driver,
  selected,
  disabled,
  onClick,
  showStatus,
}: DriverCardProps) {
  const isAvailable = "is_available" in driver ? driver.is_available : true;
  const isDisabled = disabled;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        relative w-full p-4 rounded-xl border transition-all duration-200 text-left
        btn-press overflow-hidden group
        ${
          selected
            ? "border-f1-red bg-f1-red/10 glow-red"
            : isDisabled
              ? "border-asphalt bg-carbon/50 opacity-60 cursor-not-allowed"
              : "border-asphalt bg-carbon hover:border-tire hover:bg-carbon-light card-hover"
        }
      `}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-200"
        style={{
          backgroundColor: driver.team_color,
          boxShadow: selected ? `0 0 12px ${driver.team_color}` : "none",
        }}
      />

      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at left center, ${driver.team_color}10 0%, transparent 50%)`,
        }}
      />

      <div className="pl-4 relative">
        <div className="flex items-center justify-between mb-2">
          <div
            className="driver-number text-lg"
            style={{
              background: `linear-gradient(135deg, ${driver.team_color}30, ${driver.team_color}10)`,
            }}
          >
            {driver.number}
          </div>

          <span className="text-sm md:text-base font-mono font-bold text-gray-400 tracking-wider">
            {driver.code}
          </span>
        </div>

        <div className="text-sm md:text-base font-semibold text-white">
          {driver.name}
        </div>
        <div className="text-sm text-gray-500 mt-0.5">{driver.team}</div>
      </div>

      {showStatus && !isAvailable && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 text-xs bg-asphalt/80 text-gray-400 px-2.5 py-1 rounded-lg">
          <X className="h-3 w-3" />
          <span>Used</span>
        </div>
      )}

      {selected && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 text-xs bg-f1-red text-white px-2.5 py-1 rounded-lg font-semibold animate-fade-in">
          <Check className="h-3 w-3 animate-check-bounce" />
          <span>Selected</span>
        </div>
      )}

      {isDisabled && !selected && (
        <div
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(255,255,255,0.1) 10px,
              rgba(255,255,255,0.1) 20px
            )`,
          }}
        />
      )}
    </button>
  );
}
