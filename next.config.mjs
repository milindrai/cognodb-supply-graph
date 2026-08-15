/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // neo4j-driver is a server-only dependency; keep it out of the client bundle.
    serverComponentsExternalPackages: ["neo4j-driver"],
  },
};

export default nextConfig;
