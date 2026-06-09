/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  output: "export",
  reactCompiler: true,
  experimental: {
    globalNotFound: true,
  },
};

export default nextConfig;
