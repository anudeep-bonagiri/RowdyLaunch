import { useEffect, useState } from "react";
import { event } from "../data";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

const start = new Date(event.startISO).getTime();
const end = new Date(event.endISO).getTime();

function useClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export type Phase = "upcoming" | "live" | "over";

// Cheap: checks once a minute, so callers do not re-render every second.
export function useEventPhase(): Phase {
  const calc = () => (Date.now() >= end ? "over" : Date.now() >= start ? "live" : "upcoming");
  const [phase, setPhase] = useState<Phase>(calc);
  useEffect(() => {
    const id = setInterval(() => setPhase(calc()), 60_000);
    return () => clearInterval(id);
  }, []);
  return phase;
}

// compact: one mono line for the hero. Otherwise the full readout panel.
export default function Countdown({ compact = false }: { compact?: boolean }) {
  const now = useClock();
  const live = now >= start && now < end;
  const over = now >= end;
  const t = parts(start - now);

  if (compact) {
    return (
      <p className="tminus" role="timer" aria-live="off">
        <i aria-hidden="true" />
        {live ? "Mission in progress. Doors close at 5 PM." : over ? "Mission complete." : `T-minus ${t.d}d ${pad(t.h)}h ${pad(t.m)}m ${pad(t.s)}s`}
      </p>
    );
  }

  return (
    <div className="panel readout" role="timer" aria-live="off">
      <div className="lbl">
        <span>{live ? "Mission in progress" : over ? "Mission complete" : "T-minus"}</span>
        <i aria-hidden="true" />
      </div>
      {live ? (
        <div className="live">Hacking now. Doors close at 5:00 PM.</div>
      ) : over ? (
        <div className="live">Thanks for flying with RowdyLaunch.</div>
      ) : (
        <div className="digits">
          <div><b>{pad(t.d)}</b><small>DAYS</small></div>
          <div><b>{pad(t.h)}</b><small>HRS</small></div>
          <div><b>{pad(t.m)}</b><small>MIN</small></div>
          <div><b>{pad(t.s)}</b><small>SEC</small></div>
        </div>
      )}
      <div className="where">
        <span>{event.dateLabel} · {event.timeLabel}</span>
        <span>{event.venue}</span>
      </div>
    </div>
  );
}
