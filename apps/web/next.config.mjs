/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async rewrites() {
    const api = process.env.API_PUBLIC_URL || "http://localhost:8080";
    return [{ source: "/api-backend/:path*", destination: `${api}/:path*` }];
  }
};
export default nextConfig;
