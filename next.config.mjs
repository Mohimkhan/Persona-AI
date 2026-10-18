/** @type {import('next').NextConfig} */

const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  serverExternalPackages: ["youtube-search-without-api-key"],
  images: {
    qualities: [50, 75, 100],
    remotePatterns: [
      {
        hostname: "img.youtube.com",
      },
    ],
  },
};

export default nextConfig;
