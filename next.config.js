/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['mapbox-gl'],
  },
  transpilePackages: ['mapbox-gl'],
};

export default nextConfig;