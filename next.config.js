/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  outputFileTracingRoot: __dirname,
  // experimental: {
  //   esmExternals: false,
  // },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: false,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Optimize for Netlify
  trailingSlash: false,
  generateEtags: false,
  poweredByHeader: false,
  // Disable image optimization for Netlify compatibility
  images: {
    unoptimized: true,
  },
  // Disable CSS optimization to fix build issues
  compiler: {
    removeConsole: false,
  },
};

module.exports = nextConfig;
