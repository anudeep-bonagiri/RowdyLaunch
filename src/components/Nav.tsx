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
      {/* MLH trust badge. MLH asks for it fixed to the top right, 100px wide on desktop, at least 60px on phones. */}
      <a
        className="mlh-badge"
        id="mlh-trust-badge"
        href="https://mlh.io/na?utm_source=na-hackathon&utm_medium=TrustBadge&utm_campaign=2027-season&utm_content=white"
        target="_blank"
        rel="noopener"
      >
        <img src="https://logged-assets.s3.amazonaws.com/trust-badge/2027/mlh-trust-badge-2027-white.svg" alt="Major League Hacking 2027 Hackathon Season" width="100" height="175" />
      </a>
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
