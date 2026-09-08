/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    globalNotFound: true,
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;