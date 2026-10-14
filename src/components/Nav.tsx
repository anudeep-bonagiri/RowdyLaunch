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
// until that button has faded out, so orange appears once per screen.
// Hero copy finishes fading at 42% of the hero's scroll span (see Hero.tsx),
// so the threshold is tied to that span rather than a fixed viewport fraction.
function usePastHeroCta() {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const on = () => {
      const hero = document.getElementById("top");
      const span = hero ? Math.max(hero.offsetHeight - window.innerHeight, 1) : window.innerHeight;
      setPast(window.scrollY > span * 0.42);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
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
