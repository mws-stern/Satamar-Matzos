import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Temporary runtime diagnostics for Supabase configuration
// Do not log the full anon key, only whether it exists
if (typeof window !== "undefined") {
  // Client-side log
   
  console.log("[Supabase client] Runtime config", {
    hasUrl: Boolean(supabaseUrl),
    hasAnonKey: Boolean(supabaseAnonKey),
    url: supabaseUrl,
  });
} else {
  // Server-side log
   
  console.log("[Supabase client][server] Runtime config", {
    hasUrl: Boolean(supabaseUrl),
    hasAnonKey: Boolean(supabaseAnonKey),
    url: supabaseUrl,
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase client initialization failed: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing."
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);