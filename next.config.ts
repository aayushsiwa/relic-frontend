import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // metascraper pulls in the native `re2` addon via url-regex-safe; keep it
  // external so Turbopack doesn't try to bundle the .node binary.
  serverExternalPackages: ['re2'],
};

export default nextConfig;
