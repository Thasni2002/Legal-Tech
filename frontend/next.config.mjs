/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactCompiler: true,
  experimental: {
    globalNotFound: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;