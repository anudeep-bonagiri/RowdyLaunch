import { useEffect, useState } from "react";
import { event } from "../data";
import { useEventPhase } from "./Countdown";

const items = [
  ["#mission", "Mission"],
  ["#flight-plan", "Flight plan"],
  ["#crew", "Crew"],
  ["#ground-control", "Where"],
  ["#supplies", "Sponsors"],
  ["#faq", "FAQ"],
];

// The hero already shows one orange button. The nav pill stays hidden
// until that button has scrolled away, so orange appears once per screen.
function usePastHeroCta() {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const on = () => setPast(window.scrollY > window.innerHeight * 0.45);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return past;
}

export default function Nav() {
  const phase = useEventPhase();
  const showCta = usePastHeroCta();
  return (
    <nav className="nav" aria-label="Site">
      <a className="brand" href="#top"><img src="/logo.png" alt="" width={640} height={640} />RowdyLaunch</a>
      {items.map(([href, label]) => (
        <a key={href} className="item" href={href}>{label}</a>
      ))}
      {phase === "over" ? (
        <a className="btn primary sm cta" data-hidden={!showCta} href={event.postEventUrl} target="_blank" rel="noopener">Recap</a>
      ) : (
        <a className="btn primary sm cta" data-hidden={!showCta} aria-hidden={!showCta} tabIndex={showCta ? 0 : -1} href={event.registerUrl} target="_blank" rel="noopener" aria-label="Register on MLH, opens in a new tab">Register</a>
      )}
    </nav>
  );
}
