/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["youtube-search-without-api-key"],
  },
  images: {
    remotePatterns: [
      {
        hostname: "img.youtube.com",
      },
    ],
  },
};

export default nextConfig;
