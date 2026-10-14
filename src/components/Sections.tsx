import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { m } from "framer-motion";
import { event, crew, flightPlan, faq, sponsors } from "../data";
import Countdown from "./Countdown";

const rise = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

function Head({ eyebrow, title, blurb, tag }: { eyebrow: string; title: string; blurb?: string; tag?: ReactNode }) {
  return (
    <m.div className="head" {...rise}>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {blurb && <p>{blurb}</p>}
      {tag}
    </m.div>
  );
}

export function Mission() {
  return (
    <section className="section" id="mission">
      <div className="inner">
        <Head eyebrow="Mission brief" title="A one-day Hacktoberfest hack day in San Antonio" />
        <m.div className="brief" {...rise}>
          <div className="text">
            <p>
              <strong>Hacktoberfest</strong> runs the whole month of October. You open pull requests on
              open-source projects and the maintainers accept them. This is the in-person day for it in San
              Antonio. You get a room full of people doing the same thing and organizers who have done it before.
            </p>
            <p>
              <strong>{event.host}</strong> is hosting. {event.hostBlurb.replace(/^RowdyLaunch is /, "We are ")} Shipping code is how most founders start, so we are running this day.
            </p>
            <ol className="steps">
              <li>Register on MLH and bring a laptop with Git and a GitHub account.</li>
              <li>At the morning briefing, pick a beginner-friendly issue from a project you use.</li>
              <li>Fix it, open the pull request and get it reviewed before you leave.</li>
            </ol>
          </div>
          <div className="facts">
            <Countdown />
            <dl className="panel rows">
              <div className="row"><dt>Date</dt><dd>{event.dateLabel}</dd></div>
              <div className="row"><dt>Window</dt><dd>{event.timeLabel}</dd></div>
              <div className="row"><dt>Location</dt><dd>{event.venue}<br />{event.address}</dd></div>
              <div className="row"><dt>Host</dt><dd>{event.host}, listed on MLH</dd></div>
              <div className="row"><dt>Who</dt><dd>University students and working professionals</dd></div>
              <div className="row"><dt>Bring</dt><dd>Laptop, charger, GitHub account</dd></div>
            </dl>
          </div>
        </m.div>
      </div>
    </section>
  );
}

export function FlightPlan() {
  return (
    <section className="section" id="flight-plan">
      <div className="inner">
        <Head
          eyebrow="Flight plan"
          title="Seven hours, one pull request opened"
          blurb="Doors open at 10 and close at 5. This is how the day runs."
          tag={flightPlan.draft ? <span className="draft">Draft schedule · subject to change</span> : undefined}
        />
        <m.div className="plan" {...rise}>
          {flightPlan.stops.map((s) => (
            <div className="stop" key={s.t}>
              <div className="t">{s.t}</div>
              <div>
                <h3>{s.label}</h3>
                {s.detail && <p>{s.detail}</p>}
              </div>
            </div>
          ))}
        </m.div>
      </div>
    </section>
  );
}

const initials = (n: string) => n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("");

export function Crew() {
  return (
    <section className="section" id="crew">
      <div className="inner">
        <Head eyebrow="Crew" title="Who is running the day" blurb="Five UTSA students. Find any of us if you get stuck or want an introduction." />
        <m.div className="crew" {...rise}>
          {crew.map((p) => (
            <div className="panel member" key={p.name}>
              <div className="helmet" aria-hidden="true">{initials(p.name)}</div>
              <div>
                <div className="name">{p.url ? <a href={p.url} target="_blank" rel="noopener">{p.name}</a> : p.name}</div>
                <div className="role">{p.role}</div>
                {p.line && <div className="line">{p.line}</div>}
              </div>
            </div>
          ))}
        </m.div>
      </div>
    </section>
  );
}

export function GroundControl() {
  return (
    <section className="section" id="ground-control">
      <div className="inner">
        <Head eyebrow="Ground control" title="Landing site" />
        <m.div className="ground" {...rise}>
          <div className="panel coords">
            <div className="big">{event.venue}</div>
            <div className="addr">{event.address}</div>
            <p>There will be RowdyLaunch signs from the entrance to the room. Bring a charger. Outlets are shared.</p>
            <div>
              <a className="btn ghost" href={event.mapsUrl} target="_blank" rel="noopener">Open in Google Maps</a>
            </div>
          </div>
          <a className="map" href={event.mapsUrl} target="_blank" rel="noopener" aria-label="Open the venue in Google Maps">
            <span className="tag">UTSA Main Campus · 29.58° N, 98.62° W</span>
            <span className="pin"><i aria-hidden="true" /><span>Business Building</span></span>
            <span className="open">Open in Maps ↗</span>
          </a>
        </m.div>
      </div>
    </section>
  );
}

export function Supplies() {
  const hasSponsors = sponsors.length > 0;
  return (
    <section className="section" id="supplies">
      <div className="inner">
        <Head
          eyebrow="Supplies"
          title="Sponsor the mission"
          blurb="Sponsors cover the food, swag and prizes. In return your logo goes on this page and in the room with everyone who shows up."
        />
        <m.div className="supplies" {...rise}>
          <div className={`panel pitch${hasSponsors ? "" : " solo"}`}>
            <p>
              Title, Gold, Silver and Partner slots are open for this event.
              {event.contactEmail ? " Email us and we will send the one-page deck." : " Reach the organizers through the MLH event page."}
            </p>
            <div className="actions">
              {event.contactEmail && (
                <a className="btn primary" href={`mailto:${event.contactEmail}?subject=Sponsoring%20Hacktoberfest%20Hack%20Day%20San%20Antonio`}>{event.contactEmail}</a>
              )}
              <a className="btn ghost" href={event.mlhEventUrl} target="_blank" rel="noopener">Event page on MLH</a>
            </div>
          </div>
          {hasSponsors && (
            <div className="panel logos" aria-label="Sponsors">
              {sponsors.map((s) => (
                <a className="logo" key={s.name} href={s.url} target="_blank" rel="noopener" title={`${s.name}, ${s.tier} sponsor`}>
                  <img src={s.logo} alt={s.name} loading="lazy" />
                </a>
              ))}
            </div>
          )}
        </m.div>
      </div>
    </section>
  );
}

function linkify(text: string) {
  // turn bare https URLs and emails in FAQ answers into links
  const parts = text.split(/(https?:\/\/[^\s]+?(?=[.,)]?(?:\s|$))|[\w.+-]+@[\w-]+\.[\w.]+)/g);
  return parts.map((p, i) =>
    /^https?:\/\//.test(p) ? <a key={i} href={p} target="_blank" rel="noopener">{p.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a>
    : /@/.test(p) && /\.[a-z]{2,}$/i.test(p) ? <a key={i} href={`mailto:${p}`}>{p}</a>
    : p,
  );
}

export function FAQ() {
  const [tab, setTab] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);
  const group = faq[tab];

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = faq.length;
    let next = tab;
    if (e.key === "ArrowRight") next = (tab + 1) % n;
    else if (e.key === "ArrowLeft") next = (tab - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    else return;
    e.preventDefault();
    setTab(next);
    (tabsRef.current?.children[next] as HTMLElement | undefined)?.focus();
  };

  return (
    <section className="section" id="faq">
      <div className="inner">
        <Head eyebrow="Pre-flight questions" title="Before you board" />
        <m.div className="panel faqwrap" {...rise}>
          <div className="tabs" role="tablist" aria-label="FAQ categories" ref={tabsRef} onKeyDown={onKey}>
            {faq.map((g, i) => (
              <button
                key={g.tab}
                role="tab"
                id={`faq-tab-${i}`}
                aria-selected={tab === i}
                aria-controls="faq-panel"
                tabIndex={tab === i ? 0 : -1}
                onClick={() => setTab(i)}
              >
                {g.tab}
              </button>
            ))}
          </div>
          <div className="qa" id="faq-panel" role="tabpanel" aria-labelledby={`faq-tab-${tab}`}>
            {group.items.map((it) => (
              <details key={it.q}>
                <summary>{it.q}</summary>
                <p>{linkify(it.a)}</p>
              </details>
            ))}
          </div>
        </m.div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="inner">
        <div className="row">
          <div>© 2026 {event.host} · Hacktoberfest Hack Day San Antonio</div>
          <div className="links">
            <a href={event.codeOfConductUrl} target="_blank" rel="noopener">MLH Code of Conduct</a>
            <a href={event.mlhEventUrl} target="_blank" rel="noopener">Event on MLH</a>
            <a href={event.hacktoberfestUrl} target="_blank" rel="noopener">Hacktoberfest</a>
            <a href={event.repoUrl} target="_blank" rel="noopener">Site source</a>
            <a href="https://octodex.github.com/" target="_blank" rel="noopener">Octocat by GitHub</a>
          </div>
        </div>
        <p className="fine">
          RowdyLaunch is a student organization. UTSA is the venue, not a sponsor. Report an incident to any organizer or to MLH at {event.incidentsEmail}.
        </p>
      </div>
    </footer>
  );
}
