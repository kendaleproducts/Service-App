import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives in a sub-folder of a repository that has its own lockfile;
  // pin the workspace root so Turbopack does not infer the parent project.
  turbopack: { root: __dirname },
  // better-sqlite3 is a native module; keep it out of the server bundle.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
