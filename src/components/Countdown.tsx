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

export default function Countdown() {
  const start = new Date(event.startISO).getTime();
  const end = new Date(event.endISO).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const live = now >= start && now < end;
  const over = now >= end;
  const t = parts(start - now);

  return (
    <div className="readout" role="timer" aria-live="off">
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
