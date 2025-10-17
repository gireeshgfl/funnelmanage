const path = require('path');
const fs = require('fs');

/**
 * Function to get directories excluding 'node_modules' and '.next'
 * @param {string} srcpath - The source path to scan for directories.
 * @returns {string[]} - Array of directory names.
 */
function getDirectories(srcpath) {
  try {
    return fs.readdirSync(srcpath)
      .filter(file => {
        try {
          return fs.statSync(path.join(srcpath, file)).isDirectory();
        } catch {
          return false; // Ignore unreadable directories
        }
      })
      .filter(dir => !['node_modules', '.next'].includes(dir));
  } catch (err) {
    console.error('Error reading directories:', err);
    return [];
  }
}

const rootDirs = getDirectories(__dirname);

// Create alias configuration dynamically based on directories
const aliasConfig = rootDirs.reduce((acc, dir) => {
  acc[`@${dir}`] = path.join(__dirname, dir);
  return acc;
}, {});

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/funnel-management',        // ✅ Add base path
  assetPrefix: '/funnel-management',     // ✅ Keep asset prefix consistent
  trailingSlash: true,
  reactStrictMode: true,
  swcMinify: true,
  
  webpack: (config, { isServer }) => {
    // Ensure `config.externals` exists before modifying
    if (!isServer) {
      config.externals = config.externals ? [...config.externals, 'bufferutil', 'utf-8-validate'] : ['bufferutil', 'utf-8-validate'];
    }

    // Adding alias for root directories dynamically
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname), // alias @ -> project root
      ...aliasConfig, // dynamically created aliases for project directories
    };

    return config;
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },

  env: {
    // NEXT_PUBLIC_SECRET_KEY: process.env.NEXT_PUBLIC_SECRET_KEY,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'eduvocate.s3.ap-south-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
