import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["lh3.googleusercontent.com", "images.unsplash.com"],
  },
  async redirects() {
    return [
      {
        source: "/loop",
        destination: "/",
        permanent: false,
      },
      {
        source: "/feed",
        destination: "/",
        permanent: false,
      },
      {
        source: "/dashboard",
        destination: "/",
        permanent: false,
      },
      {
        source: "/create",
        destination: "/",
        permanent: false,
      },
      {
        source: "/profile",
        destination: "/",
        permanent: false,
      },
      {
        source: "/social",
        destination: "/",
        permanent: false,
      },
      {
        source: "/leaderboard",
        destination: "/",
        permanent: false,
      },
      {
        source: "/matrix",
        destination: "/",
        permanent: false,
      },
      {
        source: "/landing",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
