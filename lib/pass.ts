import { PKPass } from "passkit-generator";
import { passAssets } from "./passAssets";
import { event } from "../src/data";

export type PassReg = { ticket: string; name: string; email: string; checked_in_at: string | null };
export type PassEnv = {
  passTypeId: string;
  teamId: string;
  signerCert: string;
  signerKey: string;
  signerKeyPassphrase?: string;
  wwdr: string;
};

// Certificates may be stored raw (-----BEGIN ...) or base64-encoded.
const pem = (v: string | undefined) => {
  if (!v) return "";
  const s = v.trim();
  return s.startsWith("-----BEGIN") ? s : Buffer.from(s, "base64").toString("utf8");
};

export function passEnv(env: NodeJS.ProcessEnv): PassEnv | null {
  const passTypeId = env.PASS_TYPE_ID;
  const teamId = env.APPLE_TEAM_ID;
  const signerCert = pem(env.PASS_SIGNER_CERT);
  const signerKey = pem(env.PASS_SIGNER_KEY);
  const wwdr = pem(env.PASS_WWDR_CERT);
  if (!passTypeId || !teamId || !signerCert || !signerKey || !wwdr) return null;
  return { passTypeId, teamId, signerCert, signerKey, signerKeyPassphrase: env.PASS_SIGNER_KEY_PASSPHRASE || undefined, wwdr };
}

export const formatTicket = (t: string) => (t.length === 8 ? `${t.slice(0, 4)}-${t.slice(4)}` : t);

export function buildPass(reg: PassReg, origin: string, env: PassEnv): Buffer {
  const files: Record<string, Buffer> = {};
  for (const [name, b64] of Object.entries(passAssets)) files[name] = Buffer.from(b64, "base64");
  files["pass.json"] = Buffer.from(JSON.stringify({
    formatVersion: 1,
    passTypeIdentifier: env.passTypeId,
    teamIdentifier: env.teamId,
    serialNumber: reg.ticket,
    organizationName: event.host,
    description: "Hacktoberfest Hack Day boarding pass",
    eventTicket: {},
  }));

  const pass = new PKPass(files, {
    wwdr: env.wwdr,
    signerCert: env.signerCert,
    signerKey: env.signerKey,
    signerKeyPassphrase: env.signerKeyPassphrase,
  }, {
    logoText: event.host,
    backgroundColor: "rgb(26, 23, 34)",
    foregroundColor: "rgb(242, 238, 249)",
    labelColor: "rgb(255, 177, 92)",
  });
  pass.type = "eventTicket";

  pass.headerFields.push({ key: "date", label: "DATE", value: "Oct 31" });
  pass.primaryFields.push({ key: "passenger", label: "PASSENGER", value: reg.name });
  pass.secondaryFields.push(
    { key: "flight", label: "FLIGHT", value: "RL-1031" },
    { key: "doors", label: "DOORS", value: "10:00 AM" },
    { key: "status", label: "STATUS", value: reg.checked_in_at ? "Checked in" : "Registered" },
  );
  pass.auxiliaryFields.push(
    { key: "gate", label: "GATE", value: "Business Building" },
    { key: "seat", label: "SEAT", value: "Open source" },
  );
  pass.backFields.push(
    { key: "ticket", label: "Ticket", value: formatTicket(reg.ticket) },
    { key: "when", label: "When", value: `${event.dateLabel}, ${event.timeLabel}` },
    { key: "where", label: "Where", value: `${event.venue}, ${event.address}` },
    { key: "map", label: "Map", value: event.mapsUrl },
    { key: "bring", label: "Bring", value: "Laptop, charger, a GitHub account. Lunch and snacks are provided." },
    { key: "coc", label: "Code of conduct", value: event.codeOfConductUrl },
    { key: "help", label: "Help", value: `Find any organizer on the day. Report an incident to ${event.incidentsEmail}.` },
    { key: "online", label: "Boarding pass online", value: `${origin}/register` },
  );

  // Same link the on-screen QR carries, so the door flow is identical.
  pass.setBarcodes({
    message: `${origin}/organizer?code=${reg.ticket}`,
    format: "PKBarcodeFormatQR",
    messageEncoding: "iso-8859-1",
    altText: formatTicket(reg.ticket),
  });
  pass.setRelevantDate(new Date(event.startISO));
  pass.setExpirationDate(new Date(new Date(event.endISO).getTime() + 12 * 3600 * 1000));
  pass.setLocations({ latitude: 29.58512, longitude: -98.61813, relevantText: "Hack day at the Business Building. Show your pass at the door." });

  return pass.getAsBuffer();
}
