import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import QRCode from "qrcode";
import { supabase, configured } from "../supabase";
import { event, terms, flightPlan } from "../data";
import Countdown, { useEventPhase } from "./Countdown";

export type Reg = {
  user_id: string;
  email: string;
  name: string;
  phone: string;
  dietary: string | null;
  extra_credit_class: string | null;
  created_at: string;
  checked_in_at: string | null;
};
type Mode = "apply" | "login" | "forgot" | "reset";
type View = "attendee" | "organizer";
type Msg = { text: string; bad?: boolean } | null;

const REG_COLS = "user_id,email,name,phone,dietary,extra_credit_class,created_at,checked_in_at";
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const when = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const clock = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
// Six characters of the user id: the ticket code on the boarding pass and
// the thing organizers type (or scan) at the door.
export const ticketOf = (id: string) => id.replace(/-/g, "").slice(0, 6).toUpperCase();

function friendly(msg: string) {
  if (/invalid login credentials/i.test(msg)) return "Wrong email or password.";
  if (/already registered|already been registered|already exists|duplicate key/i.test(msg)) return "That email already has an account. Sign in instead.";
  if (/password should be at least|weak password/i.test(msg)) return "Use a password with at least 8 characters.";
  if (/rate limit|too many|over_email_send_rate_limit/i.test(msg)) return "Too many attempts. Wait a minute and try again.";
  if (/failed to fetch|network/i.test(msg)) return "No connection. Check your network and try again.";
  if (/row-level security|permission denied/i.test(msg)) return "You do not have access to do that.";
  return msg;
}

export default function Portal({ view }: { view: View }) {
  const [session, setSession] = useState<Session | null | undefined>(configured ? undefined : null);
  const [mode, setMode] = useState<Mode>(() =>
    new URLSearchParams(location.search).has("reset") ? "reset" : view === "organizer" ? "login" : "apply",
  );
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<Reg | null>(null);
  const [organizer, setOrganizer] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (!configured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((ev, s) => {
      setSession(s);
      if (ev === "PASSWORD_RECOVERY") setMode("reset");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.title = `${view === "organizer" ? "Organizers" : "Register"} | RowdyLaunch Hacktoberfest Hack Day`;
  }, [view]);

  useEffect(() => {
    if (!session) { setOrganizer(undefined); return; }
    supabase.rpc("is_organizer").then(({ data }) => setOrganizer(Boolean(data)));
  }, [session?.user.id]);

  const signedIn = Boolean(session) && !applying;

  return (
    <div className="portal">
      <div className="backdrop" aria-hidden="true"><div className="space" style={{ opacity: 1 }} /><div className="stars" style={{ opacity: 1 }} /></div>
      <header className="portal-top">
        <a className="brand" href="/"><img src="/logo.png" alt="" width={640} height={640} />RowdyLaunch</a>
        <div className="portal-links">
          {signedIn && view === "attendee" && organizer && <a className="btn ghost sm" href="/organizer">Organizer dashboard</a>}
          {signedIn && view === "organizer" && <a className="btn ghost sm" href="/register">My boarding pass</a>}
          {signedIn && <button className="btn ghost sm" type="button" onClick={() => supabase.auth.signOut()}>Sign out</button>}
        </div>
      </header>
      <main className={`portal-main${signedIn ? " wide" : ""}`}>
        {!configured ? (
          <Head title="Registration opens soon" blurb="The organizers have not switched registration on yet. Check back shortly." />
        ) : session === undefined ? (
          <p className="muted">Loading</p>
        ) : mode === "reset" ? (
          session ? <ResetPassword onDone={() => { setMode("login"); history.replaceState(null, "", location.pathname); }} />
                  : <Auth mode="login" setMode={setMode} notice="That reset link has expired. Request a new one below." onApplying={setApplying} onApplied={setApplied} />
        ) : !session || applying ? (
          <Auth mode={mode} setMode={setMode} onApplying={setApplying} onApplied={setApplied} />
        ) : view === "organizer" ? (
          organizer === undefined ? <p className="muted">Loading</p>
          : organizer ? <OrganizerDashboard session={session} />
          : <Head title="Organizers only" blurb="This account is not on the organizer list. Ask an organizer to add your email, then reload. Your own boarding pass is at /register." />
        ) : (
          <Dashboard session={session} seed={applied} />
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

function Head({ title, blurb, eyebrow = "Boarding" }: { title: string; blurb?: string; eyebrow?: string }) {
  return (
    <div className="head">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {blurb && <p>{blurb}</p>}
    </div>
  );
}

function Note({ msg }: { msg: Msg }) {
  return msg ? <p className={`note${msg.bad ? " bad" : ""}`} role={msg.bad ? "alert" : "status"}>{msg.text}</p> : null;
}

function Terms({ open }: { open: boolean }) {
  return (
    <details className="terms full" open={open}>
      <summary><span>Terms and conditions <span className="muted">· {terms.length} items</span></span></summary>
      <dl>
        {terms.map((x) => (
          <div className="trow" key={x.t}><dt>{x.t}</dt><dd>{x.d}</dd></div>
        ))}
        <div className="trow"><dt>Full policies</dt><dd><a href={event.codeOfConductUrl} target="_blank" rel="noopener">MLH Code of Conduct</a> · <a href={event.hacktoberfestUrl} target="_blank" rel="noopener">Hacktoberfest rules</a></dd></div>
      </dl>
    </details>
  );
}

type AuthProps = { mode: Mode; setMode: (m: Mode) => void; notice?: string; onApplying: (b: boolean) => void; onApplied: (r: Reg) => void };

function Auth({ mode, setMode, notice, onApplying, onApplied }: AuthProps) {
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<Msg>(notice ? { text: notice, bad: true } : null);
  const phase = useEventPhase();
  const closed = phase === "over";

  const go = (m: Mode) => { setMode(m); setMsg(null); };

  // One screen: the registration details and a password. No agreement, no
  // account: the browser blocks the submit, this guard blocks it again, and
  // the database refuses a registration row with agreed = false.
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
    if (!details.agreed) { setMsg({ text: "You need to agree to the terms and conditions to register.", bad: true }); return; }
    setBusy(true); setMsg(null); onApplying(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email: addr, password });
      if (error) throw error;
      if (!data.session) { setMsg({ text: "Check your email for a confirmation link, then log in." }); return; }
      const { data: row, error: regErr } = await supabase.from("registrations")
        .upsert({ user_id: data.session.user.id, email: addr, ...details }, { onConflict: "user_id" })
        .select(REG_COLS).single();
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
        const { error } = await supabase.auth.resetPasswordForEmail(addr, { redirectTo: `${location.origin}${location.pathname}?reset=1` });
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
            <Terms open />
            <label className="agree full">
              <input type="checkbox" name="agreed" required />
              <span>I have read the terms and conditions above and agree to them. *</span>
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
          <Note msg={msg} />
          <small className="muted">Only the organizers see this. You can log in later to change it.</small>
        </form>
      </>
    );
  }

  return (
    <>
      <Head
        title={closed ? "The hack day has wrapped" : mode === "forgot" ? "Reset your password" : "Log in"}
        blurb={closed ? "Registration is closed. Log in to see your details." : mode === "forgot" ? "We email you a link to set a new password." : "See your boarding pass or update your details."}
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
        <Note msg={msg} />
      </form>
    </>
  );
}

function ResetPassword({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
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
        <Note msg={msg} />
      </form>
    </>
  );
}

/* ---------- attendee dashboard ---------- */

function Dashboard({ session, seed }: { session: Session; seed: Reg | null }) {
  const phase = useEventPhase();
  const [reg, setReg] = useState<Reg | null | undefined>(seed ?? undefined);
  const [editing, setEditing] = useState(false);

  const load = () =>
    supabase.from("registrations").select(REG_COLS).eq("user_id", session.user.id).maybeSingle()
      .then(({ data }) => setReg((data as Reg | null) ?? null));

  useEffect(() => {
    if (!seed) load();
    // check-in happens on an organizer's phone; pick it up without a reload
    const id = setInterval(load, 30_000);
    const onVis = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [session.user.id]);

  const email = session.user.email ?? "";
  if (reg === undefined) return <p className="muted">Loading your details</p>;

  if (!reg) {
    return phase === "over" ? (
      <Head title="Registration is closed" blurb="The hack day has wrapped. Thanks for your interest." />
    ) : (
      <>
        <Head title="Finish your registration" blurb="Your account exists but the details did not save. Fill them in once more." />
        <RegForm email={email} userId={session.user.id} initial={null} onSaved={(r) => setReg(r)} />
      </>
    );
  }

  const first = reg.name.trim().split(/\s+/)[0];
  const title = phase === "over" ? `Thanks for coming, ${first}` : phase === "live" ? `Hatch is open, ${first}` : `You are on the manifest, ${first}`;
  const blurb = phase === "over"
    ? "Hope you shipped something. Watch the event page for the recap."
    : phase === "live"
      ? (reg.checked_in_at ? "You are checked in. Find an organizer if you get stuck." : "Show your boarding pass at the door to check in.")
      : `Doors open at 10 on ${event.dateLabel}. Everything you need is below.`;

  return (
    <>
      <Head title={title} blurb={blurb} />
      <div className="dash">
        <Ticket reg={reg} />
        <section className="panel card" aria-label="Before launch">
          <span className="eyebrow">Before launch</span>
          <ol className="check">
            <li data-done="true"><b>Registered</b><span>Done {when(reg.created_at)}.</span></li>
            <li><b>Git installed, GitHub ready</b><span><a href="https://git-scm.com/downloads" target="_blank" rel="noopener">Install Git</a> and sign in to <a href="https://github.com" target="_blank" rel="noopener">GitHub</a> on the laptop you are bringing.</span></li>
            <li><b>Pick a project</b><span>Browse <a href="https://hacktoberfest.com/participation/" target="_blank" rel="noopener">participating projects</a> or a repo you already use. The morning briefing walks through choosing an issue.</span></li>
            <li><b>Laptop and charger packed</b><span>Outlets are shared. Lunch and snacks are on us.</span></li>
            <li data-done={reg.checked_in_at ? "true" : undefined}><b>Checked in at the door</b><span>{reg.checked_in_at ? `Checked in at ${clock(reg.checked_in_at)}.` : "An organizer scans your pass when you arrive."}</span></li>
          </ol>
        </section>
        <section className="panel card" aria-label="Schedule">
          <div className="bar"><span className="eyebrow">Flight plan</span>{flightPlan.draft && <span className="draft">Draft</span>}</div>
          <ol className="sched">
            {flightPlan.stops.map((s) => (
              <li key={s.t}><span className="t">{s.t}</span><span>{s.label}</span></li>
            ))}
          </ol>
        </section>
        <section className="panel card" aria-label="Your details">
          <div className="bar"><span className="eyebrow">Your details</span>{!editing && phase !== "over" && <button className="btn ghost sm" type="button" onClick={() => setEditing(true)}>Edit</button>}</div>
          {editing ? (
            <RegForm email={email} userId={session.user.id} initial={reg} onSaved={(r) => { setReg(r); setEditing(false); }} onCancel={() => setEditing(false)} bare />
          ) : (
            <dl className="rows">
              <div className="row"><dt>Email</dt><dd>{reg.email}</dd></div>
              <div className="row"><dt>Phone</dt><dd>{reg.phone}</dd></div>
              <div className="row"><dt>Dietary</dt><dd>{reg.dietary || "None given"}</dd></div>
              <div className="row"><dt>Extra credit</dt><dd>{reg.extra_credit_class || "No"}</dd></div>
            </dl>
          )}
        </section>
      </div>
      <p className="signed"><span>Signed in as {email}</span></p>
    </>
  );
}

function Ticket({ reg }: { reg: Reg }) {
  const code = ticketOf(reg.user_id);
  const [qr, setQr] = useState("");
  useEffect(() => {
    // The QR is a link to the organizer dashboard with the code filled in,
    // so any phone camera turns into a scanner.
    QRCode.toDataURL(`${location.origin}/organizer?code=${code}`, { margin: 1, width: 360, color: { dark: "#1a1722", light: "#f2eef9" } })
      .then(setQr).catch(() => setQr(""));
  }, [code]);
  return (
    <section className="panel pass ticket" aria-label="Boarding pass">
      <div className="who">
        <div><span className="eyebrow">Boarding pass</span><div className="name">{reg.name}</div></div>
        <span className={`chip${reg.checked_in_at ? " ok" : ""}`}>{reg.checked_in_at ? "Checked in" : "Registered"}</span>
      </div>
      <div className="qrwrap">
        {qr ? <img src={qr} alt={`Check-in code ${code}`} width={150} height={150} /> : <div className="qrph" aria-hidden="true" />}
        <div>
          <div className="code" aria-label="Ticket code">{code}</div>
          <p className="muted">Show this at the door. An organizer scans it or types the code.</p>
        </div>
      </div>
      <dl className="rows">
        <div className="row"><dt>Date</dt><dd>{event.dateLabel}, {event.timeLabel}</dd></div>
        <div className="row"><dt>Where</dt><dd>{event.venue}, {event.address}. <a href={event.mapsUrl} target="_blank" rel="noopener">Map</a></dd></div>
        <div className="row"><dt>Countdown</dt><dd><Countdown compact /></dd></div>
      </dl>
    </section>
  );
}

function RegForm({ email, userId, initial, onSaved, onCancel, bare }: { email: string; userId: string; initial: Reg | null; onSaved: (r: Reg) => void; onCancel?: () => void; bare?: boolean }) {
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
    const { data, error } = await supabase.from("registrations").upsert(row, { onConflict: "user_id" }).select(REG_COLS).single();
    setBusy(false);
    if (error) setErr(friendly(error.message));
    else onSaved(data as Reg);
  };
  return (
    <form className={bare ? "form" : "panel form"} onSubmit={onSubmit}>
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
        <Terms open={!initial} />
        <label className="agree full">
          <input type="checkbox" name="agreed" required defaultChecked={Boolean(initial)} />
          <span>I have read the terms and conditions and agree to them. *</span>
        </label>
      </div>
      <div className="foot">
        <button className="btn primary" type="submit" disabled={busy}>{busy ? "Saving" : initial ? "Save changes" : "Register"}</button>
        {onCancel && <button type="button" className="link" onClick={onCancel}>Cancel</button>}
      </div>
      {err && <p className="note bad" role="alert">Could not save that: {err}</p>}
    </form>
  );
}

/* ---------- organizer dashboard ---------- */

const noDiet = /^(none|no|n\/a|na|nope|nothing|-)?$/i;

function OrganizerDashboard({ session }: { session: Session }) {
  const me = (session.user.email ?? "").toLowerCase();
  const [rows, setRows] = useState<Reg[] | null>(null);
  const [orgs, setOrgs] = useState<string[] | null>(null);
  const [q, setQ] = useState(() => new URLSearchParams(location.search).get("code") ?? "");
  const [msg, setMsg] = useState<Msg>(null);
  const [orgMsg, setOrgMsg] = useState<Msg>(null);

  const load = async () => {
    const [r, o] = await Promise.all([
      supabase.from("registrations").select(REG_COLS).order("created_at"),
      supabase.from("organizers").select("email").order("email"),
    ]);
    if (r.error) setMsg({ text: friendly(r.error.message), bad: true });
    setRows((r.data as Reg[] | null) ?? []);
    setOrgs(((o.data as { email: string }[] | null) ?? []).map((x) => x.email));
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    const onVis = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const all = rows ?? [];
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return all;
    const digits = s.replace(/\D/g, "");
    return all.filter((r) =>
      r.name.toLowerCase().includes(s) ||
      r.email.toLowerCase().includes(s) ||
      ticketOf(r.user_id).toLowerCase() === s ||
      (digits.length >= 4 && r.phone.replace(/\D/g, "").includes(digits)),
    );
  }, [all, q]);

  const checkedIn = all.filter((r) => r.checked_in_at).length;
  const dietary = all.filter((r) => r.dietary && !noDiet.test(r.dietary.trim())).length;
  const classes = useMemo(() => {
    const m = new Map<string, { label: string; n: number; in: number }>();
    for (const r of all) {
      if (!r.extra_credit_class) continue;
      const key = r.extra_credit_class.trim().replace(/\s+/g, " ").toLowerCase();
      const cur = m.get(key) ?? { label: r.extra_credit_class.trim(), n: 0, in: 0 };
      cur.n += 1; if (r.checked_in_at) cur.in += 1;
      m.set(key, cur);
    }
    return [...m.values()].sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
  }, [all]);

  const toggle = async (r: Reg) => {
    const v = r.checked_in_at ? null : new Date().toISOString();
    const { error, data } = await supabase.from("registrations").update({ checked_in_at: v }).eq("user_id", r.user_id).select("user_id");
    if (error || !data?.length) { setMsg({ text: error ? friendly(error.message) : "That row could not be updated.", bad: true }); return; }
    setMsg(null);
    setRows((cur) => (cur ?? []).map((x) => (x.user_id === r.user_id ? { ...x, checked_in_at: v } : x)));
  };

  const addOrg = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = str(new FormData(form), "email").toLowerCase();
    if ((orgs ?? []).includes(email)) { setOrgMsg({ text: "Already an organizer.", bad: true }); return; }
    const { error } = await supabase.from("organizers").insert([{ email }]);
    if (error) { setOrgMsg({ text: friendly(error.message), bad: true }); return; }
    setOrgs([...(orgs ?? []), email].sort());
    setOrgMsg({ text: `${email} added. They get the dashboard the next time they log in.` });
    form.reset();
  };

  const removeOrg = async (email: string) => {
    if (email === me) return;
    const { error } = await supabase.from("organizers").delete().eq("email", email);
    if (error) { setOrgMsg({ text: friendly(error.message), bad: true }); return; }
    setOrgs((orgs ?? []).filter((x) => x !== email));
    setOrgMsg({ text: `${email} removed.` });
  };

  return (
    <>
      <Head eyebrow="Mission control" title="Organizer dashboard" blurb={rows ? `${all.length} registered · ${checkedIn} checked in` : "Loading"} />
      <div className="stats" aria-label="Totals">
        <div className="panel stat"><b>{all.length}</b><span>Registered</span></div>
        <div className="panel stat"><b>{checkedIn}</b><span>Checked in</span></div>
        <div className="panel stat"><b>{dietary}</b><span>Dietary needs</span></div>
        <div className="panel stat"><b>{all.filter((r) => r.extra_credit_class).length}</b><span>Extra credit</span></div>
      </div>

      <section className="panel roster" aria-label="Check-in and roster">
        <div className="bar">
          <label className="field search">
            <span>Find someone</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, phone or ticket code" autoFocus={Boolean(q)} />
          </label>
          <div className="actions"><span className="muted">{q ? `${filtered.length} of ${all.length}` : `${all.length} total`}</span>{" "}<button className="btn ghost sm" type="button" onClick={load}>Refresh</button></div>
        </div>
        <div className="scroll">
          <table>
            <thead><tr><th>Name</th><th>Ticket</th><th>Email</th><th>Phone</th><th>Dietary</th><th>Extra credit</th><th>Status</th><th /></tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.user_id} data-in={r.checked_in_at ? "true" : undefined}>
                  <td>{r.name}</td>
                  <td className="mono">{ticketOf(r.user_id)}</td>
                  <td>{r.email}</td>
                  <td>{r.phone}</td>
                  <td>{r.dietary ?? ""}</td>
                  <td>{r.extra_credit_class ?? ""}</td>
                  <td>{r.checked_in_at ? `In ${clock(r.checked_in_at)}` : "Registered"}</td>
                  <td><button className={`btn sm ${r.checked_in_at ? "ghost" : "primary"}`} type="button" onClick={() => toggle(r)}>{r.checked_in_at ? "Undo" : "Check in"}</button></td>
                </tr>
              ))}
              {rows && filtered.length === 0 && <tr><td colSpan={8} className="muted">{all.length ? "No match." : "Nobody has registered yet."}</td></tr>}
            </tbody>
          </table>
        </div>
        <Note msg={msg} />
      </section>

      <div className="dash">
        <section className="panel card" aria-label="Extra credit by class">
          <span className="eyebrow">Extra credit by class</span>
          {classes.length ? (
            <ul className="classes">
              {classes.map((c) => <li key={c.label}><span>{c.label}</span><span className="muted">{c.n} registered · {c.in} checked in</span></li>)}
            </ul>
          ) : <p className="muted">Nobody has listed a class yet.</p>}
          <p className="muted">After the event, send each professor the names of their checked-in students from the roster.</p>
        </section>
        <section className="panel card" aria-label="Organizers">
          <span className="eyebrow">Organizers</span>
          <ul className="orgs">
            {(orgs ?? []).map((o) => (
              <li key={o}><span>{o}{o === me ? " (you)" : ""}</span>{o !== me && <button type="button" className="link" onClick={() => removeOrg(o)}>Remove</button>}</li>
            ))}
          </ul>
          <form className="form" onSubmit={addOrg}>
            <label className="field">
              <span>Add an organizer by email</span>
              <input type="email" name="email" required maxLength={254} placeholder="name@example.com" />
            </label>
            <div className="foot"><button className="btn ghost sm" type="submit">Add organizer</button><small>They register or log in with that email and see this dashboard.</small></div>
            <Note msg={orgMsg} />
          </form>
        </section>
      </div>
    </>
  );
}
