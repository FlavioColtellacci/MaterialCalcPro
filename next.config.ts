import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /* Avoid broken webpack vendor chunks for Supabase (runtime "Cannot find module './vendor-chunks/@supabase.js'"). */
  serverExternalPackages: ["@supabase/ssr", "@supabase/supabase-js"],
};

export default nextConfig;
