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
      path: 'path-browserify',
    },
    preserveSymlinks: true,
  },
  optimizeDeps: {
    include: [
      'crypto-browserify',
      'stream-browserify',
      'buffer',
      'util',
      'path-browserify',
      'react-router-dom',
      'react-markdown',
      // Radix UI packages pre-bundle
      '@radix-ui/react-dialog',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-separator',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-collapsible',
      // AI SDK subpath
      'ai',
      'ai/react',
    ],
  },
});