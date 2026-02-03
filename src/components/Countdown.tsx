import { useState, useEffect } from "react";
import { getTimeUntil } from "../lib/utils";
import { Lock } from "lucide-react";

interface CountdownProps {
  targetDate: string;
  onExpire?: () => void;
}

interface TimeBlockProps {
  value: number;
  label: string;
  isUrgent?: boolean;
}

function TimeBlock({ value, label, isUrgent }: TimeBlockProps) {
  return (
    <div
      className={`
        relative bg-carbon border border-asphalt rounded-xl px-3 py-2 min-w-[52px]
        ${isUrgent ? "border-f1-red/50" : ""}
      `}
    >
      <div
        className={`
          text-lg md:text-xl font-bold font-mono tabular-nums text-center
          ${isUrgent ? "text-f1-red" : "text-white"}
        `}
      >
        {value.toString().padStart(2, "0")}
      </div>
      <div className="text-xs text-gray-500 uppercase tracking-wider text-center mt-0.5">
        {label}
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-xl pointer-events-none" />
    </div>
  );
}

function ColonSeparator({ isUrgent }: { isUrgent?: boolean }) {
  return (
    <div
      className={`flex flex-col gap-1.5 px-0.5 ${isUrgent ? "animate-pulse-subtle" : ""}`}
    >
      <div
        className={`w-1.5 h-1.5 rounded-full ${isUrgent ? "bg-f1-red" : "bg-gray-600"}`}
      />
      <div
        className={`w-1.5 h-1.5 rounded-full ${isUrgent ? "bg-f1-red" : "bg-gray-600"}`}
      />
    </div>
  );
}

export default function Countdown({ targetDate, onExpire }: CountdownProps) {
  const [time, setTime] = useState(getTimeUntil(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      const newTime = getTimeUntil(targetDate);
      setTime(newTime);
      if (newTime.total <= 0 && onExpire) {
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onExpire]);

  if (time.total <= 0) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-f1-red/20 border border-f1-red/30 rounded-xl animate-pulse-glow">
        <Lock className="h-4 w-4 text-f1-red" />
        <span className="text-f1-red font-bold tracking-wide">LOCKED</span>
      </div>
    );
  }

  const isUrgent = time.total < 60 * 60 * 1000;
  const isVeryUrgent = time.total < 5 * 60 * 1000;

  return (
    <div
      className={`inline-flex items-center gap-1 ${isVeryUrgent ? "animate-pulse-glow" : ""}`}
    >
      {time.days > 0 && (
        <>
          <TimeBlock value={time.days} label="days" isUrgent={isUrgent} />
          <ColonSeparator isUrgent={isUrgent} />
        </>
      )}
      <TimeBlock value={time.hours} label="hrs" isUrgent={isUrgent} />
      <ColonSeparator isUrgent={isUrgent} />
      <TimeBlock value={time.minutes} label="min" isUrgent={isUrgent} />
      <ColonSeparator isUrgent={isUrgent} />
      <TimeBlock value={time.seconds} label="sec" isUrgent={isUrgent} />
    </div>
  );
}
