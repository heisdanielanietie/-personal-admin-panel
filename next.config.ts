import type { NextConfig } from "next";

// Freeze public deployment addresses at build time: Netlify build variables
// are not guaranteed to be available in the Next.js function at runtime.
const deploymentOrigins = [
  process.env.URL,
  process.env.DEPLOY_PRIME_URL,
  process.env.DEPLOY_URL,
  "https://heisdanielwebdesk.netlify.app",
].filter((value): value is string => Boolean(value)).map(value => new URL(value).origin);

const nextConfig: NextConfig = {
  env: { STUDIO_ALLOWED_ORIGINS: JSON.stringify([...new Set(deploymentOrigins)]) },
};

export default nextConfig;
