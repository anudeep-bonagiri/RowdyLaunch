import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

// Both values are public by design (publishable key). Without them the
// portal renders a "not open yet" notice instead of crashing.
export const configured = Boolean(url && key);
export const supabase = createClient(url ?? "https://unconfigured.invalid", key ?? "unconfigured");
