/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Avatars from each platform's CDN
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.twimg.com" },
      { protocol: "https", hostname: "**.kick.com" },
      { protocol: "https", hostname: "**.jtvnw.net" },
      { protocol: "https", hostname: "files.kick.com" },
    ],
  },
};

export default nextConfig;
