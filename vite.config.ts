import { defineConfig } from 'vite';
import { vitePlugin as remix } from '@remix-run/dev';
import tsconfigPaths from 'vite-tsconfig-paths';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import UnoCSS from 'unocss/vite';

export default defineConfig({
  plugins: [
    remix({
      ignoredRouteFiles: ['**/*.css'],
    }),
    tsconfigPaths(),
    UnoCSS(),
    nodePolyfills({
      // Include crypto polyfill
      include: ['crypto', 'stream', 'buffer', 'util', 'path', 'fs'],
    }),
  ],
  ssr: {
    noExternal: ['@remix-run/*'],
  },
  build: {
    target: 'esnext', // Support top-level await
    rollupOptions: {
      external: ['@remix-run/cloudflare'],
    },
  },
  define: {
    // Fix for crypto in browser
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Polyfill crypto for browser
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      buffer: 'buffer',
      util: 'util',
    },
  },
  optimizeDeps: {
    include: ['crypto-browserify', 'stream-browserify', 'buffer', 'util', 'react-markdown'],
  },
});