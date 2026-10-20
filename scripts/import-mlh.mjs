// Loads MLH's registrations CSV export into public.mlh_registrations on the
// linked Supabase project. Safe to re-run with a newer export: rows upsert on
// the MLH id and check-ins are never overwritten. Anyone no longer registered
// on MLH (cancelled, withdrawn) is removed.
// Run: node scripts/import-mlh.mjs ~/Downloads/<export>.csv
import { readFileSync, writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const file = process.argv[2];
if (!file) { console.error("Usage: node scripts/import-mlh.mjs <mlh-export.csv>"); process.exit(1); }

// RFC 4180: quoted fields may hold commas, newlines and doubled quotes.
function parse(text) {
  const rows = [[]];
  let field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { rows.at(-1).push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      rows.at(-1).push(field); field = ""; rows.push([]);
    } else field += c;
  }
  rows.at(-1).push(field);
  return rows.filter((r) => r.some((f) => f.trim()));
}

const [head, ...body] = parse(readFileSync(file, "utf8").replace(/^﻿/, ""));
const col = (name) => {
  const i = head.indexOf(name);
  if (i < 0) throw new Error(`Column "${name}" is missing; is this an MLH registrations export?`);
  return i;
};
const c = Object.fromEntries(["id", "status", "registered_at", "first_name", "last_name", "email", "phone_number", "dietary_restrictions"].map((k) => [k, col(k)]));
const blank = (s) => (s.trim() ? s.trim() : null);

const active = [], gone = [];
for (const r of body) {
  const id = Number(r[c.id]);
  if (!Number.isInteger(id)) continue;
  if (!["registered", "checked_in"].includes(r[c.status])) { gone.push(id); continue; }
  active.push({
    mlh_id: id,
    email: r[c.email].trim(),
    name: `${r[c.first_name]} ${r[c.last_name]}`.replace(/\s+/g, " ").trim(),
    phone: blank(r[c.phone_number]),
    dietary: blank(r[c.dietary_restrictions]),
    registered_at: r[c.registered_at],
  });
}

const json = JSON.stringify(active);
if (json.includes("$mlh$")) throw new Error("Export contains the SQL quote tag $mlh$; refusing to build the query.");
const sql = `
insert into public.mlh_registrations (mlh_id, email, name, phone, dietary, registered_at)
select mlh_id, email, name, phone, dietary, registered_at
from json_to_recordset($mlh$${json}$mlh$::json)
  as x(mlh_id bigint, email text, name text, phone text, dietary text, registered_at timestamptz)
on conflict (mlh_id) do update set
  email = excluded.email, name = excluded.name, phone = excluded.phone,
  dietary = excluded.dietary, registered_at = excluded.registered_at;
delete from public.mlh_registrations where mlh_id = any (array[${gone.join(",")}]::bigint[]);
select count(*) as mlh_registrations from public.mlh_registrations;
`;

// The query holds attendee data, so it lives in a private temp dir only while it runs.
const dir = mkdtempSync(join(tmpdir(), "mlh-import-"));
try {
  writeFileSync(join(dir, "import.sql"), sql, { mode: 0o600 });
  execFileSync("npx", ["supabase@latest", "db", "query", "--linked", "-f", join(dir, "import.sql")], { stdio: "inherit" });
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log(`${active.length} registered on MLH, ${gone.length} removed.`);
