import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export function createClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  ) as unknown as SupabaseClient<Database>;
}
