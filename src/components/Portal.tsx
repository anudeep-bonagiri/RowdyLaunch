import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, configured } from "../supabase";
import { event } from "../data";
import { useEventPhase } from "./Countdown";

type Reg = {
  email: string;
  name: string;
  phone: string;
  dietary: string | null;
  extra_credit_class: string | null;
  created_at: string;
};
type Mode = "signin" | "signup" | "forgot" | "reset";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const when = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function friendly(msg: string) {
  if (/invalid login credentials/i.test(msg)) return "Wrong email or password.";
  if (/already registered|already been registered|already exists/i.test(msg)) return "That email already has an account. Sign in instead.";
  if (/password should be at least|weak password/i.test(msg)) return "Use a password with at least 8 characters.";
  if (/rate limit|too many|over_email_send_rate_limit/i.test(msg)) return "Too many attempts. Wait a minute and try again.";
  if (/failed to fetch|network/i.test(msg)) return "No connection. Check your network and try again.";
  return msg;
}

export default function Portal() {
  const [session, setSession] = useState<Session | null | undefined>(configured ? undefined : null);
  const [mode, setMode] = useState<Mode>(() => (new URLSearchParams(location.search).has("reset") ? "reset" : "signin"));

  useEffect(() => {
    if (!configured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((ev, s) => {
      setSession(s);
      if (ev === "PASSWORD_RECOVERY") setMode("reset");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => { document.title = "Register | RowdyLaunch Hacktoberfest Hack Day"; }, []);

  const [organizer, setOrganizer] = useState(false);
  useEffect(() => {
    if (!session) { setOrganizer(false); return; }
    supabase.rpc("is_organizer").then(({ data }) => setOrganizer(Boolean(data)));
  }, [session?.user.id]);

  return (
    <div className="portal">
      <div className="backdrop" aria-hidden="true"><div className="space" style={{ opacity: 1 }} /><div className="stars" style={{ opacity: 1 }} /></div>
      <header className="portal-top">
        <a className="brand" href="/"><img src="/logo.png" alt="" width={640} height={640} />RowdyLaunch</a>
        {session && <button className="btn ghost sm" type="button" onClick={() => supabase.auth.signOut()}>Sign out</button>}
      </header>
      <main className={`portal-main${organizer ? " wide" : ""}`}>
        {!configured ? (
          <Head title="Registration opens soon" blurb="The organizers have not switched registration on yet. Check back shortly." />
        ) : session === undefined ? (
          <p className="muted">Loading</p>
        ) : mode === "reset" ? (
          session ? <ResetPassword onDone={() => { setMode("signin"); history.replaceState(null, "", "/register"); }} />
                  : <Auth mode="signin" setMode={setMode} notice="That reset link has expired. Request a new one below." />
        ) : !session ? (
          <Auth mode={mode} setMode={setMode} />
        ) : (
          <Dashboard session={session} organizer={organizer} />
        )}
      </main>
      <footer>
        <p className="fine muted">
          Questions? Find any organizer on the day. Report an incident to {event.incidentsEmail}. <a href="/">Back to the event page</a>.
        </p>
      </footer>
    </div>
  );
}

function Head({ title, blurb }: { title: string; blurb?: string }) {
  return (
    <div className="head">
      <span className="eyebrow">Boarding</span>
      <h1>{title}</h1>
      {blurb && <p>{blurb}</p>}
    </div>
  );
}

function Auth({ mode, setMode, notice }: { mode: Mode; setMode: (m: Mode) => void; notice?: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(notice ? { text: notice, bad: true } : null);
  const phase = useEventPhase();

  const go = (m: Mode) => { setMode(m); setMsg(null); };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = str(f, "email").toLowerCase();
    const password = String(f.get("password") ?? "");
    setBusy(true); setMsg(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) setMsg({ text: "Check your email for a confirmation link, then sign in." });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/register?reset=1` });
        if (error) throw error;
        setMsg({ text: "If that email has an account, a reset link is on its way." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (x) {
      setMsg({ text: friendly(x instanceof Error ? x.message : "Something went wrong."), bad: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Head
        title={phase === "over" ? "The hack day has wrapped" : "Register for the hack day"}
        blurb={phase === "over" ? "Registration is closed. Sign in to see your details." : `${event.dateLabel}, ${event.timeLabel}, ${event.venue}. Free. Create an account, then fill in a short form.`}
      />
      <div className="panel">
        <div className="authtabs" role="tablist" aria-label="Sign in or create account">
          <button role="tab" type="button" aria-selected={mode === "signin"} onClick={() => go("signin")}>Sign in</button>
          <button role="tab" type="button" aria-selected={mode === "signup"} onClick={() => go("signup")} disabled={phase === "over"}>Create account</button>
        </div>
        <form className="form" onSubmit={onSubmit}>
          <div className="grid">
            <label className="field full">
              <span>Email</span>
              <input type="email" name="email" required maxLength={254} autoComplete="email" />
            </label>
            {mode !== "forgot" && (
              <label className="field full">
                <span>Password{mode === "signup" ? " (8+ characters)" : ""}</span>
                <input type="password" name="password" required minLength={8} maxLength={72} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
              </label>
            )}
          </div>
          <div className="foot">
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? "One moment" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
            </button>
            {mode === "forgot" ? (
              <button type="button" className="link" onClick={() => go("signin")}>Back to sign in</button>
            ) : (
              <button type="button" className="link" onClick={() => go("forgot")}>Forgot password?</button>
            )}
          </div>
          {msg && <p className={`note${msg.bad ? " bad" : ""}`} role={msg.bad ? "alert" : "status"}>{msg.text}</p>}
        </form>
      </div>
    </>
  );
}

function ResetPassword({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    setBusy(true); setMsg(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setMsg({ text: friendly(error.message), bad: true });
    else onDone();
  };
  return (
    <>
      <Head title="Set a new password" />
      <form className="panel form" onSubmit={onSubmit}>
        <label className="field">
          <span>New password (8+ characters)</span>
          <input type="password" name="password" required minLength={8} maxLength={72} autoComplete="new-password" />
        </label>
        <div className="foot"><button className="btn primary" type="submit" disabled={busy}>{busy ? "Saving" : "Save password"}</button></div>
        {msg && <p className="note bad" role="alert">{msg.text}</p>}
      </form>
    </>
  );
}

function Dashboard({ session, organizer }: { session: Session; organizer: boolean }) {
  const phase = useEventPhase();
  const [reg, setReg] = useState<Reg | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    supabase.from("registrations").select("email,name,phone,dietary,extra_credit_class,created_at").eq("user_id", session.user.id).maybeSingle()
      .then(({ data }) => setReg((data as Reg | null) ?? null));
  }, [session.user.id]);

  const email = session.user.email ?? "";
  return (
    <>
      {reg === undefined ? (
        <p className="muted">Loading your details</p>
      ) : reg && !editing ? (
        <>
          <Head title="You are on the manifest" blurb={`See you ${event.dateLabel}. Doors open at 10.`} />
          <BoardingPass reg={reg} onEdit={() => setEditing(true)} closed={phase === "over"} />
        </>
      ) : phase === "over" && !reg ? (
        <Head title="Registration is closed" blurb="The hack day has wrapped. Thanks for your interest." />
      ) : (
        <>
          <Head title={reg ? "Update your details" : "One short form"} blurb={reg ? undefined : "This tells us how much food to order, what you can eat, and who to reach if plans change."} />
          <RegForm email={email} userId={session.user.id} initial={reg} onSaved={(r) => { setReg(r); setEditing(false); }} onCancel={reg ? () => setEditing(false) : undefined} />
        </>
      )}
      <p className="signed"><span>Signed in as {email}</span></p>
      {organizer && <Roster />}
    </>
  );
}

function BoardingPass({ reg, onEdit, closed }: { reg: Reg; onEdit: () => void; closed: boolean }) {
  return (
    <div className="panel pass">
      <div className="who">
        <div className="name">{reg.name}</div>
        <span className="chip">Registered</span>
      </div>
      <dl className="rows">
        <div className="row"><dt>Date</dt><dd>{event.dateLabel}, {event.timeLabel}</dd></div>
        <div className="row"><dt>Where</dt><dd>{event.venue}, {event.address}</dd></div>
        <div className="row"><dt>Email</dt><dd>{reg.email}</dd></div>
        <div className="row"><dt>Phone</dt><dd>{reg.phone}</dd></div>
        <div className="row"><dt>Dietary</dt><dd>{reg.dietary || "None given"}</dd></div>
        <div className="row"><dt>Extra credit</dt><dd>{reg.extra_credit_class || "No"}</dd></div>
        <div className="row"><dt>Bring</dt><dd>Laptop, charger, a GitHub account</dd></div>
        <div className="row"><dt>Registered</dt><dd>{when(reg.created_at)}</dd></div>
      </dl>
      <div className="actions">
        {!closed && <button className="btn ghost sm" type="button" onClick={onEdit}>Edit details</button>}
        <a className="btn ghost sm" href={event.mapsUrl} target="_blank" rel="noopener">Open in Google Maps</a>
      </div>
    </div>
  );
}

function RegForm({ email, userId, initial, onSaved, onCancel }: { email: string; userId: string; initial: Reg | null; onSaved: (r: Reg) => void; onCancel?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const row = {
      user_id: userId,
      email,
      name: str(f, "name"),
      phone: str(f, "phone"),
      dietary: str(f, "dietary") || null,
      extra_credit_class: str(f, "cls") || null,
      agreed: f.get("agreed") === "on",
    };
    setBusy(true); setErr("");
    const { data, error } = await supabase.from("registrations").upsert(row, { onConflict: "user_id" })
      .select("email,name,phone,dietary,extra_credit_class,created_at").single();
    setBusy(false);
    if (error) setErr(friendly(error.message));
    else onSaved(data as Reg);
  };
  return (
    <form className="panel form" onSubmit={onSubmit}>
      <div className="grid">
        <label className="field">
          <span>Name *</span>
          <input type="text" name="name" required maxLength={120} autoComplete="name" defaultValue={initial?.name ?? ""} />
        </label>
        <label className="field">
          <span>Phone *</span>
          <input type="tel" name="phone" required minLength={7} maxLength={30} autoComplete="tel" defaultValue={initial?.phone ?? ""} />
        </label>
        <label className="field full">
          <span>Dietary restrictions (optional)</span>
          <input type="text" name="dietary" maxLength={300} placeholder="Vegetarian, halal, nut allergy, none" defaultValue={initial?.dietary ?? ""} />
        </label>
        <label className="field full">
          <span>Extra credit class (optional)</span>
          <input type="text" name="cls" maxLength={120} placeholder="Course and professor" defaultValue={initial?.extra_credit_class ?? ""} />
        </label>
        <label className="agree full">
          <input type="checkbox" name="agreed" required defaultChecked={Boolean(initial)} />
          <span>
            I release RowdyLaunch, the organizers, UTSA as the venue and the event sponsors from liability for personal injury
            or property damage during the event, and I will follow the{" "}
            <a href={event.codeOfConductUrl} target="_blank" rel="noopener">MLH Code of Conduct</a>. *
          </span>
        </label>
      </div>
      <div className="foot">
        <button className="btn primary" type="submit" disabled={busy}>{busy ? "Saving" : initial ? "Save changes" : "Register"}</button>
        {onCancel && <button type="button" className="link" onClick={onCancel}>Cancel</button>}
        <small>Only the organizers see this.</small>
      </div>
      {err && <p className="note bad" role="alert">Could not save that: {err}</p>}
    </form>
  );
}

type RosterRow = Reg & { user_id: string };

function Roster() {
  const [rows, setRows] = useState<RosterRow[] | null>(null);
  useEffect(() => {
    supabase.from("registrations").select("user_id,email,name,phone,dietary,extra_credit_class,created_at").order("created_at")
      .then(({ data }) => setRows((data as RosterRow[]) ?? []));
  }, []);
  const csv = () => {
    const esc = (v: string | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [["name", "email", "phone", "dietary", "extra_credit_class", "registered_at"].join(",")]
      .concat((rows ?? []).map((r) => [r.name, r.email, r.phone, r.dietary, r.extra_credit_class, r.created_at].map(esc).join(",")));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    a.download = "rowdylaunch-registrations.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <section className="panel roster" aria-label="Registrations">
      <div className="bar">
        <div><span className="eyebrow">Organizer view</span></div>
        <div className="actions"><span className="muted">{rows ? `${rows.length} registered` : "Loading"}</span>{" "}<button className="btn ghost sm" type="button" onClick={csv} disabled={!rows?.length}>Download CSV</button></div>
      </div>
      <div className="scroll">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Dietary</th><th>Extra credit</th><th>Registered</th></tr></thead>
          <tbody>
            {(rows ?? []).map((r) => (
              <tr key={r.user_id}><td>{r.name}</td><td>{r.email}</td><td>{r.phone}</td><td>{r.dietary ?? ""}</td><td>{r.extra_credit_class ?? ""}</td><td>{when(r.created_at)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
