const missing = (name: string) =>
  new Error(
    `Missing ${name}. Copy .env.example to .env.local and set Supabase variables.`,
  );

export function getSupabasePublicEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw missing("NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) throw missing("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return { url, anonKey };
}

export function getSupabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw missing("SUPABASE_SERVICE_ROLE_KEY");
  return key;
}
