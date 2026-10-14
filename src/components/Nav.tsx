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

export default function Nav() {
  const phase = useEventPhase();
  return (
    <nav className="nav" aria-label="Site">
      <a className="brand" href="#top"><i aria-hidden="true" />RowdyLaunch</a>
      {items.map(([href, label]) => (
        <a key={href} className="item" href={href}>{label}</a>
      ))}
      {phase === "over" ? (
        <a className="btn primary sm cta" href={event.postEventUrl} target="_blank" rel="noopener">Recap</a>
      ) : (
        <a className="btn primary sm cta" href={event.registerUrl} target="_blank" rel="noopener" aria-label="Register on MLH, opens in a new tab">Register</a>
      )}
    </nav>
  );
}
