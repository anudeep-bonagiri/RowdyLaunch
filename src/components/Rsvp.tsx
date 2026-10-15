import { useState, type FormEvent } from "react";
import { m } from "framer-motion";
import { event } from "../data";
import { dbReady, insert, DbError } from "../db";
import { useEventPhase } from "./Countdown";
import { Head, rise } from "./Sections";

type Status = "idle" | "sending" | "done" | "dup" | "error";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export default function Rsvp() {
  const phase = useEventPhase();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  if (!dbReady || phase === "over") return null;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const row = {
      name: str(f, "name"),
      email: str(f, "email").toLowerCase(),
      phone: str(f, "phone"),
      dietary: str(f, "dietary") || null,
      extra_credit_class: str(f, "cls") || null,
      agreed: f.get("agreed") === "on",
    };
    setStatus("sending");
    try {
      await insert("rsvps", row);
      setStatus("done");
    } catch (x) {
      if (x instanceof DbError && x.code === "23505") setStatus("dup");
      else {
        setError(x instanceof Error ? x.message : "Something went wrong.");
        setStatus("error");
      }
    }
  };

  return (
    <section className="section" id="manifest">
      <div className="inner">
        <Head
          eyebrow="Manifest"
          title="Add yourself to the manifest"
          blurb="Registering on MLH gets you in the door. This tells us how much food to order, what you can eat, and who to reach if plans change."
        />
        <m.div className="panel rsvp" {...rise}>
          {status === "done" ? (
            <p className="note" role="status">You are on the manifest. See you {event.dateLabel}.</p>
          ) : status === "dup" ? (
            <p className="note" role="status">That email is already on the manifest. Nothing else to do.</p>
          ) : (
            <form onSubmit={onSubmit} noValidate={false}>
              <div className="grid">
                <label className="field">
                  <span>Name *</span>
                  <input type="text" name="name" required maxLength={120} autoComplete="name" />
                </label>
                <label className="field">
                  <span>Email *</span>
                  <input type="email" name="email" required maxLength={254} autoComplete="email" />
                </label>
                <label className="field">
                  <span>Phone *</span>
                  <input type="tel" name="phone" required minLength={7} maxLength={30} autoComplete="tel" />
                </label>
                <label className="field">
                  <span>Extra credit class (optional)</span>
                  <input type="text" name="cls" maxLength={120} placeholder="Course and professor" />
                </label>
                <label className="field full">
                  <span>Dietary restrictions (optional)</span>
                  <input type="text" name="dietary" maxLength={300} placeholder="Vegetarian, halal, nut allergy, none" />
                </label>
                <label className="agree full">
                  <input type="checkbox" name="agreed" required />
                  <span>
                    I release RowdyLaunch, the organizers, UTSA as the venue and the event sponsors from liability for
                    personal injury or property damage during the event, and I will follow the{" "}
                    <a href={event.codeOfConductUrl} target="_blank" rel="noopener">MLH Code of Conduct</a>. *
                  </span>
                </label>
              </div>
              <div className="foot">
                <button className="btn primary" type="submit" disabled={status === "sending"}>
                  {status === "sending" ? "Adding you" : "Add me to the manifest"}
                </button>
                <small>Only the organizers see this list.</small>
              </div>
              {status === "error" && <p className="note bad" role="alert">Could not save that: {error} Try again in a moment.</p>}
            </form>
          )}
        </m.div>
      </div>
    </section>
  );
}
