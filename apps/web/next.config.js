/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@repo/db",
    "@prisma/client",
    "nuqs",
    "react-markdown",
    "remark-gfm",
  ],
  images: {
    unoptimized: false,
    remotePatterns: [],
  },
};

export default nextConfig;
