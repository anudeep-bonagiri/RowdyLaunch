import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { buildPass, passEnv } from "../lib/pass";

// GET  -> { configured }  (the portal shows the Wallet button only when true)
// POST -> the signed .pkpass for the signed-in attendee. The access token
//         arrives in the form body so Safari navigates straight into the
//         Add-to-Wallet sheet; errors bounce back to /register?wallet=<code>.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const env = passEnv(process.env);
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") return res.status(200).json({ configured: Boolean(env) });
  if (req.method !== "POST") { res.setHeader("Allow", "GET, POST"); return res.status(405).end(); }

  const back = (code: string) => res.redirect(303, `/register?wallet=${code}`);
  if (!env) return back("notsetup");

  const body = req.body as unknown;
  const token = typeof body === "string" ? new URLSearchParams(body).get("token") : (body as { token?: unknown } | null)?.token;
  if (!token || typeof token !== "string") return back("nosession");

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return back("notsetup");

  const supabase = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: u, error: uerr } = await supabase.auth.getUser(token);
  if (uerr || !u.user) return back("nosession");

  const { data: reg, error } = await supabase
    .from("registrations").select("ticket,name,email,checked_in_at").eq("user_id", u.user.id).maybeSingle();
  if (error || !reg) return back("noreg");

  const host = (req.headers["x-forwarded-host"] as string | undefined) ?? req.headers.host ?? "rowdylaunch.vercel.app";
  let pkpass: Buffer;
  try {
    pkpass = buildPass(reg, `https://${host}`, env);
  } catch {
    return back("failed");
  }
  res.setHeader("Content-Type", "application/vnd.apple.pkpass");
  res.setHeader("Content-Disposition", 'attachment; filename="rowdylaunch-boarding-pass.pkpass"');
  return res.status(200).send(pkpass);
}
