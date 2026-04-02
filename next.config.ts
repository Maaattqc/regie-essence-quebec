import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js"],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.essence-quebec.ca" }],
        destination: "https://essence-quebec.ca/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
