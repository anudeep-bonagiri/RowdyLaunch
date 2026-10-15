import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import QRCode from "qrcode";
import { supabase, configured } from "../supabase";
import { event, terms, flightPlan } from "../data";
import Countdown, { useEventPhase } from "./Countdown";

export type Reg = {
  user_id: string;
  ticket: string;
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

const REG_COLS = "user_id,ticket,email,name,phone,dietary,extra_credit_class,created_at,checked_in_at";
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const when = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const clock = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
export const formatTicket = (t: string) => (t.length === 8 ? `${t.slice(0, 4)}-${t.slice(4)}` : t);
const normTicket = (s: string) => s.replace(/[^a-z0-9]/gi, "").toUpperCase();
const isApple = () => /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);

function friendly(msg: string) {
  if (/invalid login credentials/i.test(msg)) return "Wrong email or password.";
  if (/already registered|already been registered|already exists|duplicate key/i.test(msg)) return "That email already has an account. Sign in instead.";
  if (/password should be at least|weak password/i.test(msg)) return "Use a password with at least 8 characters.";
  if (/rate limit|too many|over_email_send_rate_limit/i.test(msg)) return "Too many attempts. Wait a minute and try again.";
  if (/failed to fetch|network/i.test(msg)) return "No connection. Check your network and try again.";
  if (/row-level security|permission denied/i.test(msg)) return "You do not have access to do that.";
  return msg;
}

/* ---------- shell ---------- */

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
    document.title = `${view === "organizer" ? "Mission control" : "Boarding"} | RowdyLaunch Hacktoberfest Hack Day`;
  }, [view]);

  useEffect(() => {
    if (!session) { setOrganizer(undefined); return; }
    supabase.rpc("is_organizer").then(({ data }) => setOrganizer(Boolean(data)));
  }, [session?.user.id]);

  const signedIn = Boolean(session) && !applying;
  const narrow = !signedIn && mode !== "apply";

  return (
    <div className="portal">
      <div className="backdrop" aria-hidden="true"><div className="space" style={{ opacity: 1 }} /><div className="stars" style={{ opacity: 1 }} /><div className="stars-2" style={{ opacity: 1 }} /></div>
      <header className="portal-top">
        <nav className="pbar" aria-label="Portal">
          <a className="brand" href="/"><img src="/logo.png" alt="" width={640} height={640} />RowdyLaunch</a>
          <span className="event">Hacktoberfest Hack Day · Oct 31 · UTSA</span>
          <div className="links">
            {!signedIn && <a href="/">Event page</a>}
            {signedIn && view === "attendee" && organizer && <a href="/organizer">Mission control</a>}
            {signedIn && view === "organizer" && <a href="/register">My pass</a>}
            {signedIn && <button type="button" onClick={() => supabase.auth.signOut()}>Sign out</button>}
          </div>
        </nav>
      </header>
      <main className={`portal-main${narrow ? " narrow" : ""}`}>
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
          : <Head eyebrow="Mission control" title="Organizers only" blurb="This account is not on the organizer list. Ask an organizer to add your email, then reload. Your own boarding pass is at /register." />
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

function Head({ title, blurb, eyebrow = "Boarding", aside }: { title: string; blurb?: string; eyebrow?: string; aside?: React.ReactNode }) {
  return (
    <div className="head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {blurb && <p>{blurb}</p>}
      </div>
      {aside}
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

/* ---------- sign up / sign in ---------- */

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
      <div className="apply">
        <aside className="apply-side">
          <img className="side-mascot" src="/mascot.png" alt="" width={960} height={614} />
          <span className="eyebrow">Boarding</span>
          <h1>Register for the hack day</h1>
          <p>One form, about a minute. Free for students and working professionals.</p>
          <ul className="perks">
            <li><b>{event.dateLabel}</b><span>{event.timeLabel}</span></li>
            <li><b>{event.venue}</b><span>{event.address}</span></li>
            <li><b>Lunch and snacks</b><span>On us. Tell us what you can eat.</span></li>
            <li><b>Mentors all day</b><span>Open your first pull request with people who have done it before.</span></li>
            <li><b>Hacktoberfest swag and prizes</b><span>While they last.</span></li>
          </ul>
        </aside>
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
      </div>
    );
  }

  return (
    <>
      <Head
        title={closed ? "The hack day has wrapped" : mode === "forgot" ? "Reset your password" : "Log in"}
        blurb={closed ? "Registration is closed. Log in to see your details." : mode === "forgot" ? "We email you a link to set a new password." : "Your boarding pass, checklist and details."}
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

const walletMessages: Record<string, string> = {
  notsetup: "Wallet passes are not switched on yet. Your pass on this page works the same at the door.",
  nosession: "Your session had expired. You are signed in again now, so try Add to Apple Wallet once more.",
  noreg: "No registration was found for this account.",
  failed: "The pass could not be built. Tell an organizer; the pass on this page still works.",
};

function Dashboard({ session, seed }: { session: Session; seed: Reg | null }) {
  const phase = useEventPhase();
  const [reg, setReg] = useState<Reg | null | undefined>(seed ?? undefined);
  const [editing, setEditing] = useState(false);
  const [wallet, setWallet] = useState(false);
  const [walletMsg] = useState<Msg>(() => {
    const code = new URLSearchParams(location.search).get("wallet");
    if (!code) return null;
    history.replaceState(null, "", location.pathname);
    return { text: walletMessages[code] ?? "Something went wrong with the Wallet pass.", bad: code !== "notsetup" };
  });

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

  useEffect(() => {
    if (!isApple()) return;
    fetch("/api/pass", { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : { configured: false }))
      .then((j: { configured?: boolean }) => setWallet(Boolean(j.configured)))
      .catch(() => setWallet(false));
  }, []);

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
      <Note msg={walletMsg} />
      <div className="deck">
        <BoardingPass reg={reg} wallet={wallet} />
        <Countdown />
      </div>
      <div className="dash">
        <section className="panel card" aria-label="Before launch">
          <div className="bar"><span className="eyebrow">Before launch</span><span className="muted">{(reg.checked_in_at ? 2 : 1)} of 5 done</span></div>
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

function WalletGlyph() {
  return (
    <svg viewBox="0 0 24 20" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="22" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M1 7h22" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="10" width="7" height="4" rx="1" fill="currentColor" />
    </svg>
  );
}

function BoardingPass({ reg, wallet }: { reg: Reg; wallet: boolean }) {
  const [qr, setQr] = useState("");
  const tokenRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // The QR is a link to the organizer dashboard with the code filled in,
    // so any phone camera turns into a scanner.
    QRCode.toDataURL(`${location.origin}/organizer?code=${reg.ticket}`, { margin: 1, width: 360, color: { dark: "#1a1722", light: "#f2eef9" } })
      .then(setQr).catch(() => setQr(""));
  }, [reg.ticket]);

  // Fresh access token at click time; the function verifies it server-side.
  const onWallet = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const { data } = await supabase.auth.getSession();
    if (!data.session || !tokenRef.current) return;
    tokenRef.current.value = data.session.access_token;
    form.submit();
  };

  return (
    <section className="bpass" aria-label="Boarding pass">
      <div className="band"><span>RowdyLaunch · Hacktoberfest Hack Day</span><span>Boarding pass</span></div>
      <div className="main">
        <dl className="fields">
          <div className="f big"><dt>Passenger</dt><dd>{reg.name}</dd></div>
          <div className="f"><dt>Flight</dt><dd>RL-1031</dd></div>
          <div className="f"><dt>Date</dt><dd>Sat, Oct 31</dd></div>
          <div className="f"><dt>Doors</dt><dd>10:00 AM</dd></div>
          <div className="f"><dt>Gate</dt><dd>Business Building</dd></div>
          <div className="f"><dt>Seat</dt><dd>Open source</dd></div>
          <div className="f"><dt>Status</dt><dd><span className={`chip${reg.checked_in_at ? " ok" : ""}`}>{reg.checked_in_at ? "Checked in" : "Registered"}</span></dd></div>
        </dl>
        <div className="actions">
          {wallet && (
            <form method="post" action="/api/pass" onSubmit={onWallet}>
              <input type="hidden" name="token" ref={tokenRef} />
              <button className="btn wallet" type="submit"><WalletGlyph />Add to Apple Wallet</button>
            </form>
          )}
          <a className="btn ghost sm" href="/hack-day.ics" download="rowdylaunch-hack-day.ics">Add to calendar</a>
          <a className="btn ghost sm" href={event.mapsUrl} target="_blank" rel="noopener">Map</a>
        </div>
      </div>
      <div className="tear" aria-hidden="true" />
      <div className="stub">
        {qr ? <img src={qr} alt={`Check-in QR code, ticket ${formatTicket(reg.ticket)}`} width={132} height={132} /> : <div className="qrph" aria-hidden="true" />}
        <div>
          <span className="lbl">Ticket</span>
          <div className="code">{formatTicket(reg.ticket)}</div>
          <p>Scan at the door, or read the code to an organizer.</p>
        </div>
      </div>
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
type Filter = "all" | "in" | "out" | "credit" | "diet";
const filters: [Filter, string][] = [["all", "Everyone"], ["out", "Not yet in"], ["in", "Checked in"], ["credit", "Extra credit"], ["diet", "Dietary"]];
const hasDiet = (r: Reg) => Boolean(r.dietary && !noDiet.test(r.dietary.trim()));

function OrganizerDashboard({ session }: { session: Session }) {
  const me = (session.user.email ?? "").toLowerCase();
  const [rows, setRows] = useState<Reg[] | null>(null);
  const [orgs, setOrgs] = useState<string[] | null>(null);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [scanCode, setScanCode] = useState(() => normTicket(new URLSearchParams(location.search).get("code") ?? ""));
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
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
    setLoadedAt(new Date());
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    const onVis = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const all = rows ?? [];
  const scanned = useMemo(() => (scanCode ? all.find((r) => r.ticket === scanCode) ?? null : null), [all, scanCode]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const code = normTicket(q);
    const digits = s.replace(/\D/g, "");
    return all.filter((r) => {
      if (filter === "in" && !r.checked_in_at) return false;
      if (filter === "out" && r.checked_in_at) return false;
      if (filter === "credit" && !r.extra_credit_class) return false;
      if (filter === "diet" && !hasDiet(r)) return false;
      if (!s) return true;
      return r.name.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s) ||
        (code.length >= 3 && r.ticket.startsWith(code)) ||
        (digits.length >= 4 && r.phone.replace(/\D/g, "").includes(digits));
    });
  }, [all, q, filter]);

  const checkedIn = all.filter((r) => r.checked_in_at).length;
  const withDiet = all.filter(hasDiet);
  const withCredit = all.filter((r) => r.extra_credit_class);

  const group = (pick: (r: Reg) => string | null, list: Reg[]) => {
    const m = new Map<string, { label: string; n: number; in: number }>();
    for (const r of list) {
      const raw = pick(r); if (!raw) continue;
      const key = raw.trim().replace(/\s+/g, " ").toLowerCase();
      const cur = m.get(key) ?? { label: raw.trim(), n: 0, in: 0 };
      cur.n += 1; if (r.checked_in_at) cur.in += 1;
      m.set(key, cur);
    }
    return [...m.values()].sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
  };
  const classes = useMemo(() => group((r) => r.extra_credit_class, withCredit), [all]);
  const diets = useMemo(() => group((r) => r.dietary, withDiet), [all]);

  const toggle = async (r: Reg) => {
    const v = r.checked_in_at ? null : new Date().toISOString();
    const { error, data } = await supabase.from("registrations").update({ checked_in_at: v }).eq("user_id", r.user_id).select("user_id");
    if (error || !data?.length) { setMsg({ text: error ? friendly(error.message) : "That row could not be updated.", bad: true }); return; }
    setMsg(null);
    setRows((cur) => (cur ?? []).map((x) => (x.user_id === r.user_id ? { ...x, checked_in_at: v } : x)));
  };

  const clearScan = () => { setScanCode(""); history.replaceState(null, "", location.pathname); };

  const addOrg = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = str(new FormData(form), "email").toLowerCase();
    if ((orgs ?? []).includes(email)) { setOrgMsg({ text: "Already an organizer.", bad: true }); return; }
    const { error } = await supabase.from("organizers").insert([{ email }]);
    if (error) { setOrgMsg({ text: friendly(error.message), bad: true }); return; }
    setOrgs([...(orgs ?? []), email].sort());
    setOrgMsg({ text: `${email} added. They get mission control the next time they log in.` });
    form.reset();
  };

  const removeOrg = async (email: string) => {
    if (email === me) return;
    const { error } = await supabase.from("organizers").delete().eq("email", email);
    if (error) { setOrgMsg({ text: friendly(error.message), bad: true }); return; }
    setOrgs((orgs ?? []).filter((x) => x !== email));
    setOrgMsg({ text: `${email} removed.` });
  };

  const pct = all.length ? Math.round((checkedIn / all.length) * 100) : 0;

  return (
    <>
      <Head
        eyebrow="Mission control"
        title="Organizer dashboard"
        blurb={rows ? `${all.length} registered · ${checkedIn} checked in` : "Loading"}
        aside={<span className="pulse"><i aria-hidden="true" />{loadedAt ? `Updated ${loadedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })}` : "Loading"}</span>}
      />

      {scanCode && rows && (
        <section className={`panel scan${scanned ? "" : " miss"}`} aria-live="polite">
          {scanned ? (
            <>
              <div>
                <span className="eyebrow">Scanned</span>
                <div className="name">{scanned.name}</div>
                <div className="meta">{formatTicket(scanned.ticket)} · {scanned.email}{hasDiet(scanned) ? ` · ${scanned.dietary}` : ""}{scanned.extra_credit_class ? ` · ${scanned.extra_credit_class}` : ""}</div>
                <div className="meta">{scanned.checked_in_at ? `Already checked in at ${clock(scanned.checked_in_at)}.` : "Not checked in yet."}</div>
              </div>
              <div className="actions">
                <button className={`btn lg ${scanned.checked_in_at ? "ghost" : "primary"}`} type="button" onClick={() => toggle(scanned)}>{scanned.checked_in_at ? "Undo check-in" : `Check in ${scanned.name.trim().split(/\s+/)[0]}`}</button>
                <button className="link" type="button" onClick={clearScan}>Done</button>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="eyebrow">Scanned</span>
                <div className="name">No match for {formatTicket(scanCode)}</div>
                <div className="meta">Ask for their name and search below.</div>
              </div>
              <div className="actions"><button className="link" type="button" onClick={clearScan}>Dismiss</button></div>
            </>
          )}
        </section>
      )}

      <div className="stats" aria-label="Totals">
        <div className="panel stat"><b>{all.length}</b><span>Registered</span></div>
        <div className="panel stat"><b>{checkedIn}</b><span>Checked in · {pct}%</span><div className="meter"><i style={{ width: `${pct}%` }} /></div></div>
        <div className="panel stat"><b>{withDiet.length}</b><span>Dietary needs</span></div>
        <div className="panel stat"><b>{withCredit.length}</b><span>Extra credit</span></div>
      </div>

      <section className="panel roster" aria-label="Check-in and roster">
        <div className="bar">
          <label className="search">
            <span>Find someone</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, phone or ticket code" />
          </label>
          <div className="actions"><span className="muted">{q || filter !== "all" ? `${filtered.length} of ${all.length}` : `${all.length} total`}</span>{" "}<button className="btn ghost sm" type="button" onClick={load}>Refresh</button></div>
        </div>
        <div className="chips" role="group" aria-label="Filter">
          {filters.map(([k, label]) => <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>{label}</button>)}
        </div>
        <div className="scroll">
          <table>
            <thead><tr><th>Name</th><th>Ticket</th><th>Email</th><th>Phone</th><th>Dietary</th><th>Extra credit</th><th>Status</th><th /></tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.user_id} data-in={r.checked_in_at ? "true" : undefined} className={scanned?.user_id === r.user_id ? "hit" : undefined}>
                  <td>{r.name}</td>
                  <td className="mono">{formatTicket(r.ticket)}</td>
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
            <ul className="tally">
              {classes.map((c) => <li key={c.label}><span>{c.label}</span><span className="muted">{c.n} · {c.in} in</span></li>)}
            </ul>
          ) : <p className="muted">Nobody has listed a class yet.</p>}
          <p className="muted">After the event, send each professor the names of their checked-in students from the roster.</p>
        </section>
        <section className="panel card" aria-label="Dietary needs">
          <span className="eyebrow">Dietary needs</span>
          {diets.length ? (
            <ul className="tally">
              {diets.map((d) => <li key={d.label}><span>{d.label}</span><span className="muted">{d.n}</span></li>)}
            </ul>
          ) : <p className="muted">No dietary needs listed yet.</p>}
          <p className="muted">Use this for the food order. Entries are grouped as typed.</p>
        </section>
        <section className="panel card" aria-label="Organizers">
          <span className="eyebrow">Organizers</span>
          <ul className="tally orgs">
            {(orgs ?? []).map((o) => (
              <li key={o}><span>{o}{o === me ? " (you)" : ""}</span>{o !== me && <button type="button" className="link" onClick={() => removeOrg(o)}>Remove</button>}</li>
            ))}
          </ul>
          <form className="form" onSubmit={addOrg}>
            <label className="field">
              <span>Add an organizer by email</span>
              <input type="email" name="email" required maxLength={254} placeholder="name@example.com" />
            </label>
            <div className="foot"><button className="btn ghost sm" type="submit">Add organizer</button></div>
            <Note msg={orgMsg} />
          </form>
          <p className="muted">They register or log in with that email and get this page.</p>
        </section>
      </div>
    </>
  );
}
