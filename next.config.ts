import type {NextConfig} from 'next';
import path from 'path';

// GitHub Pages serves a project site from https://<user>.github.io/<repo>/, so the
// static export and every link it emits have to be rooted at that subpath. Empty by
// default, which leaves local dev, Vercel and the AI Studio / Cloud Run build on "/".
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

// `standalone` is what the AI Studio / Cloud Run deploy consumes. The static export
// is only requested by the GitHub Pages workflow.
const isStaticExport = process.env.NEXT_OUTPUT === 'export';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    // A static export has no image optimisation server to call.
    ...(isStaticExport ? {unoptimized: true} : {}),
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  output: isStaticExport ? 'export' : 'standalone',
  // Next rewrites its own /_next/* asset URLs for the basePath; the authored landing
  // page paths are rooted by SYLVA_HERO_BASE_URL in src/shaders/landing-pages.
  ...(basePath ? {basePath} : {}),
  // Inlined as a literal into both the server and the client bundle, so a deployment
  // under a subpath never depends on a runtime env lookup. Empty means the app is
  // served from "/", which is the case for local dev, Vercel and Cloud Run.
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      '@designcodeio/threeui/style.css': path.resolve(process.cwd(), 'src/shaders/threeui.css'),
      '@designcodeio/threeui': path.resolve(process.cwd(), 'src/shaders/index.ts'),
    };

    config.module.rules.push({
      resourceQuery: /raw/,
      type: 'asset/source',
    });

    return config;
  },
};

export default nextConfig;
