/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  webpack: (config, { isServer }) => {
    // Configure for react-pdf
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
