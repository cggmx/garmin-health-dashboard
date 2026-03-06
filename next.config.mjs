/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['garmin-connect'],
  },
};

export default nextConfig;
