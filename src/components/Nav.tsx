import { event } from "../data";

const items = [
  ["#mission", "Mission"],
  ["#flight-plan", "Flight plan"],
  ["#crew", "Crew"],
  ["#ground-control", "Ground control"],
  ["#faq", "FAQ"],
];

export default function Nav() {
  return (
    <>
      <nav className="nav" aria-label="Site">
        <a className="brand" href="#top"><i aria-hidden="true" />RowdyLaunch</a>
        {items.map(([href, label]) => (
          <a key={href} className="item" href={href}>{label}</a>
        ))}
        <a className="btn primary sm cta" href={event.registerUrl} target="_blank" rel="noopener">Register</a>
      </nav>
      <div className="toast" role="status">
        <i aria-hidden="true" />
        <span>Registration is open on MLH for {event.dateLabel}</span>
        <a href={event.registerUrl} target="_blank" rel="noopener">Register →</a>
      </div>
    </>
  );
}
