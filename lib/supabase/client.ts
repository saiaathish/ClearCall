import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

export function createClient() {
  // Keep static/demo builds deployable before Supabase environment variables
  // are configured. Live auth and data calls remain inactive with this
  // non-routable placeholder; Vercel can enable them by setting both vars.
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "https://clearcall-not-configured.supabase.co";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    "clearcall-public-anon-key-not-configured";

  return createBrowserClient<Database>(
    url,
    anonKey,
  );
}
