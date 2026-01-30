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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "6bvoq38awf3gczh3.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
