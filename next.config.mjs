/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export for copying build output into Mattercraft project (out/ folder).
  output: "export",
  // If you later deploy as a PWA behind HTTPS only, keep images/audio under /public
  // and consider a service worker solution (see README).
  // Note: headers() is not available in static export mode
};

export default nextConfig;
