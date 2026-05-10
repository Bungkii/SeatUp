/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ยอมให้ Build ผ่านแม้จะมี Error ของ TypeScript
    ignoreBuildErrors: true,
  },
};

export default nextConfig;