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
type Mode = "apply" | "login" | "forgot" | "reset";

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
  const [mode, setMode] = useState<Mode>(() => (new URLSearchParams(location.search).has("reset") ? "reset" : "apply"));
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<Reg | null>(null);

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
          session ? <ResetPassword onDone={() => { setMode("login"); history.replaceState(null, "", "/register"); }} />
                  : <Auth mode="login" setMode={setMode} notice="That reset link has expired. Request a new one below." onApplying={setApplying} onApplied={setApplied} />
        ) : !session || applying ? (
          <Auth mode={mode} setMode={setMode} onApplying={setApplying} onApplied={setApplied} />
        ) : (
          <Dashboard session={session} organizer={organizer} seed={applied} />
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

type AuthProps = { mode: Mode; setMode: (m: Mode) => void; notice?: string; onApplying: (b: boolean) => void; onApplied: (r: Reg) => void };

function Auth({ mode, setMode, notice, onApplying, onApplied }: AuthProps) {
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(notice ? { text: notice, bad: true } : null);
  const phase = useEventPhase();
  const closed = phase === "over";

  const go = (m: Mode) => { setMode(m); setMsg(null); };

  // One screen: the registration details and a password. The account is
  // created first, then the registration row; if the row fails the person is
  // signed in and the dashboard shows the form again with an error.
  const onApply = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const addr = str(f, "email").toLowerCase();
    const password = String(f.get("password") ?? "");
    const details = {
      name: str(f, "name"),
      phone: str(f, "phone"),
      dietary: str(f, "dietary") || null,
      extra_credit_class: str(f, "cls") || null,
      agreed: f.get("agreed") === "on",
    };
    setEmail(addr);
    setBusy(true); setMsg(null); onApplying(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email: addr, password });
      if (error) throw error;
      if (!data.session) { setMsg({ text: "Check your email for a confirmation link, then log in." }); return; }
      const { data: row, error: regErr } = await supabase.from("registrations")
        .upsert({ user_id: data.session.user.id, email: addr, ...details }, { onConflict: "user_id" })
        .select("email,name,phone,dietary,extra_credit_class,created_at").single();
      if (regErr) throw regErr;
      onApplied(row as Reg);
    } catch (x) {
      const text = friendly(x instanceof Error ? x.message : "Something went wrong.");
      setMsg({ text, bad: true });
      if (/already has an account/.test(text)) setMode("login");
    } finally {
      setBusy(false); onApplying(false);
    }
  };

  const onLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const addr = str(f, "email").toLowerCase();
    const password = String(f.get("password") ?? "");
    setEmail(addr);
    setBusy(true); setMsg(null);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(addr, { redirectTo: `${location.origin}/register?reset=1` });
        if (error) throw error;
        setMsg({ text: "If that email has an account, a reset link is on its way." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: addr, password });
        if (error) throw error;
      }
    } catch (x) {
      setMsg({ text: friendly(x instanceof Error ? x.message : "Something went wrong."), bad: true });
    } finally {
      setBusy(false);
    }
  };

  const note = msg && <p className={`note${msg.bad ? " bad" : ""}`} role={msg.bad ? "alert" : "status"}>{msg.text}</p>;

  if (mode === "apply" && !closed) {
    return (
      <>
        <Head title="Register for the hack day" blurb={`${event.dateLabel}, ${event.timeLabel}, ${event.venue}. Free. One form, about a minute.`} />
        <form key="apply" className="panel form" onSubmit={onApply}>
          <div className="grid">
            <label className="field">
              <span>Name *</span>
              <input type="text" name="name" required maxLength={120} autoComplete="name" />
            </label>
            <label className="field">
              <span>Email *</span>
              <input type="email" name="email" required maxLength={254} autoComplete="email" defaultValue={email} />
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
                I release RowdyLaunch, the organizers, UTSA as the venue and the event sponsors from liability for personal
                injury or property damage during the event, and I will follow the{" "}
                <a href={event.codeOfConductUrl} target="_blank" rel="noopener">MLH Code of Conduct</a>. *
              </span>
            </label>
            <label className="field full">
              <span>Last thing: choose a password (8+ characters) *</span>
              <input type="password" name="password" required minLength={8} maxLength={72} autoComplete="new-password" />
            </label>
          </div>
          <div className="foot">
            <button className="btn primary" type="submit" disabled={busy}>{busy ? "Registering" : "Register"}</button>
            <button className="btn ghost sm" type="button" onClick={() => go("login")}>Already registered? Log in</button>
          </div>
          {note}
          <small className="muted">Only the organizers see this. You can log in later to change it.</small>
        </form>
      </>
    );
  }

  return (
    <>
      <Head
        title={closed ? "The hack day has wrapped" : mode === "forgot" ? "Reset your password" : "Log in"}
        blurb={closed ? "Registration is closed. Log in to see your details." : mode === "forgot" ? "We email you a link to set a new password." : "See or update your registration."}
      />
      <form key={mode} className="panel form" onSubmit={onLogin}>
        <div className="grid">
          <label className="field full">
            <span>Email</span>
            <input type="email" name="email" required maxLength={254} autoComplete="email" defaultValue={email} />
          </label>
          {mode !== "forgot" && (
            <label className="field full">
              <span>Password</span>
              <input type="password" name="password" required maxLength={72} autoComplete="current-password" />
            </label>
          )}
        </div>
        <div className="foot">
          <button className="btn primary" type="submit" disabled={busy}>{busy ? "One moment" : mode === "forgot" ? "Send reset link" : "Log in"}</button>
          {mode === "forgot" ? (
            <button type="button" className="link" onClick={() => go("login")}>Back to log in</button>
          ) : (
            <button type="button" className="link" onClick={() => go("forgot")}>Forgot password?</button>
          )}
          {!closed && <button type="button" className="link" onClick={() => go("apply")}>New here? Register</button>}
        </div>
        {note}
      </form>
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

function Dashboard({ session, organizer, seed }: { session: Session; organizer: boolean; seed: Reg | null }) {
  const phase = useEventPhase();
  const [reg, setReg] = useState<Reg | null | undefined>(seed ?? undefined);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (seed) return;
    supabase.from("registrations").select("email,name,phone,dietary,extra_credit_class,created_at").eq("user_id", session.user.id).maybeSingle()
      .then(({ data }) => setReg((data as Reg | null) ?? null));
  }, [session.user.id, seed]);

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
          <Head title={reg ? "Update your details" : "Finish your registration"} blurb={reg ? undefined : "Your account exists but the details did not save. Fill them in once more."} />
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
