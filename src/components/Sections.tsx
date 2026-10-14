import { useState } from "react";
import { motion } from "framer-motion";
import { event, crew, flightPlan, faq } from "../data";
import Countdown from "./Countdown";

const rise = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

function Head({ eyebrow, title, blurb }: { eyebrow: string; title: string; blurb?: string }) {
  return (
    <motion.div className="head" {...rise}>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {blurb && <p>{blurb}</p>}
    </motion.div>
  );
}

export function Mission() {
  return (
    <section className="section" id="mission">
      <div className="inner">
        <Head eyebrow="Mission brief" title="A one-day Hacktoberfest hack day in San Antonio" />
        <motion.div className="brief" {...rise}>
          <div className="text">
            <p>
              <strong>Hacktoberfest</strong> runs the whole month of October. You open pull requests on
              open-source projects and the maintainers accept them. This is the in-person day for it in San
              Antonio. You get a room full of people doing the same thing and organizers who have done it before.
            </p>
            <p>
              <strong>{event.host}</strong> is hosting. {event.hostBlurb} If you are looking for a cofounder,
              this is a good room to look in.
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
            <div className="row"><dt>Host</dt><dd>{event.host}, with Major League Hacking</dd></div>
            <div className="row"><dt>Who</dt><dd>University students and working professionals</dd></div>
            <div className="row"><dt>Bring</dt><dd>Laptop, charger, GitHub account</dd></div>
            </dl>
          </div>
        </motion.div>
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
          title="Seven hours, one pull request minimum"
          blurb="Doors open at 10 and close at 5. This is how the day runs."
        />
        {flightPlan.draft && <span className="draft">Draft schedule · subject to change</span>}
        <motion.div className="plan" {...rise}>
          {flightPlan.stops.map((s) => (
            <div className="stop" key={s.t}>
              <div className="t">{s.t}</div>
              <div>
                <h3>{s.label}</h3>
                {s.detail && <p>{s.detail}</p>}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const initials = (n: string) => n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("");

export function Crew() {
  return (
    <section className="section" id="crew">
      <div className="inner">
        <Head eyebrow="Crew" title="Who is running the day" blurb="Find any of us if you get stuck or want an introduction." />
        <motion.div className="crew" {...rise}>
          {crew.map((m) => (
            <div className="panel member" key={m.name}>
              <div className="helmet" aria-hidden="true">{initials(m.name)}</div>
              <div>
                <div className="name">{m.name}</div>
                <div className="role">{m.role}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export function GroundControl() {
  return (
    <section className="section" id="ground-control">
      <div className="inner">
        <Head eyebrow="Ground control" title="Landing site" />
        <motion.div className="ground" {...rise}>
          <div className="panel coords">
            <div className="big">{event.venue}</div>
            <div className="addr">{event.address}</div>
            <p style={{ color: "var(--fg-2)" }}>
              There will be RowdyLaunch signs from the entrance to the room. Bring a charger. Outlets are shared.
            </p>
            <div>
              <a className="btn ghost" href={event.mapsUrl} target="_blank" rel="noopener">Open in Maps</a>
            </div>
          </div>
          <a className="map" href={event.mapsUrl} target="_blank" rel="noopener" aria-label="Open the venue in Google Maps">
            <span className="tag">UTSA Main Campus · 29.58° N, 98.62° W</span>
            <span className="pin"><i aria-hidden="true" /><span>Business Building</span></span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

export function Supplies() {
  return (
    <section className="section" id="supplies">
      <div className="inner">
        <Head
          eyebrow="Supplies"
          title="Sponsor the mission"
          blurb="Sponsors cover the food, swag and prizes. In return your logo goes on this page and in the room with everyone who shows up."
        />
        <motion.div className="supplies" {...rise}>
          <div className="panel" style={{ display: "grid", gap: 14, alignContent: "start" }}>
            <p style={{ color: "var(--fg-2)" }}>
              Sponsor slots are open. Reach the organizers through the MLH event page
              {event.contactEmail ? " or by email" : ""}.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a className="btn ghost" href={event.mlhEventUrl} target="_blank" rel="noopener">Event page on MLH</a>
              {event.contactEmail && (
                <a className="btn primary" href={`mailto:${event.contactEmail}`}>{event.contactEmail}</a>
              )}
            </div>
          </div>
          <div className="panel slots" aria-label="Sponsor logo slots">
            {["Title", "Gold", "Silver", "Partner", "Partner", "Partner"].map((s, i) => (
              <div className="slot" key={i}>{s}</div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function FAQ() {
  const [tab, setTab] = useState(0);
  const group = faq[tab];
  return (
    <section className="section" id="faq">
      <div className="inner">
        <Head eyebrow="Pre-flight questions" title="Before you board" />
        <motion.div className="faqwrap" {...rise}>
          <div className="tabs" role="tablist" aria-label="FAQ categories">
            {faq.map((g, i) => (
              <button
                key={g.tab}
                role="tab"
                id={`faq-tab-${i}`}
                aria-selected={tab === i}
                aria-controls="faq-panel"
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
                <p>{it.a}</p>
              </details>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="inner">
        <div>© 2026 {event.host} · Hacktoberfest Hack Day San Antonio</div>
        <div className="links">
          <a href={event.codeOfConductUrl} target="_blank" rel="noopener">MLH Code of Conduct</a>
          <a href={event.mlhEventUrl} target="_blank" rel="noopener">Event on MLH</a>
          <a href={event.repoUrl} target="_blank" rel="noopener">Site source</a>
          <a href="https://octodex.github.com/" target="_blank" rel="noopener">Octocat by GitHub</a>
        </div>
      </div>
    </footer>
  );
}
