// Thin PostgREST client. Two env vars, one insert; the SDK is not worth
// 40 KB for this. Both values are public by design (publishable key).
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const dbReady = Boolean(url && key);

export class DbError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function insert(table: string, row: Record<string, unknown>) {
  if (!url || !key) throw new DbError("not_configured", "The form is not connected yet.");
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify([row]),
  });
  if (res.ok) return;
  let code = String(res.status);
  let message = res.statusText || "Request failed";
  try {
    const j = (await res.json()) as { code?: string; message?: string };
    code = j.code ?? code;
    message = j.message ?? message;
  } catch { /* body was not JSON */ }
  throw new DbError(code, message);
}
