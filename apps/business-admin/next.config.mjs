/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@webin10/shared-types', '@webin10/validation'],
};

export default nextConfig;
