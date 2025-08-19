/**
 * Vite Configuration for Cloudflare Pages
 * This is an optimized version for Cloudflare Pages deployment
 */

import { cloudflareDevProxyVitePlugin as remixCloudflareDevProxy, vitePlugin as remixVitePlugin } from '@remix-run/dev';
import UnoCSS from 'unocss/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { optimizeCssModules } from 'vite-plugin-optimize-css-modules';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Optimize for Cloudflare Pages
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        // Optimize chunk splitting for Cloudflare
        manualChunks: {
          vendor: ['react', 'react-dom'],
          remix: ['@remix-run/react', '@remix-run/node'],
          ui: ['@headlessui/react', '@heroicons/react'],
        },
      },
    },
    // Optimize for Cloudflare's edge runtime
    ssr: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },

  // Optimize for production
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.CLOUDFLARE': JSON.stringify(true),
  },

  plugins: [
    // Node polyfills for Cloudflare compatibility
    nodePolyfills({
      include: ['buffer', 'process', 'util', 'stream'],
      globals: {
        Buffer: true,
        process: true,
        global: true,
      },
      protocolImports: true,
      exclude: ['child_process', 'fs', 'path'],
    }),

    // Remix plugin with Cloudflare optimizations
    remixVitePlugin({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_lazyRouteDiscovery: true,
      },
      serverModuleFormat: 'esm',
    }),

    // Cloudflare dev proxy
    remixCloudflareDevProxy(),

    // UnoCSS for utility-first CSS
    UnoCSS(),

    // TypeScript paths
    tsconfigPaths(),

    // CSS optimization for production
    optimizeCssModules({ apply: 'build' }),
  ],

  // Environment variables
  envPrefix: [
    'VITE_',
    'OPENAI_',
    'ANTHROPIC_',
    'GOOGLE_',
    'COHERE_',
    'DEEPSEEK_',
    'MISTRAL_',
    'AMAZON_',
    'OPENROUTER_',
    'OLLAMA_',
    'GITHUB_',
    'HUGGINGFACE_',
  ],

  // CSS optimization
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
    postcss: {
      plugins: [
        // Add autoprefixer for better browser compatibility
        require('autoprefixer'),
        // Add cssnano for production optimization
        process.env.NODE_ENV === 'production' && require('cssnano'),
      ].filter(Boolean),
    },
  },

  // Server configuration for development
  server: {
    port: 5173,
    host: true,
    fs: {
      allow: ['..'],
    },
  },

  // Preview configuration
  preview: {
    port: 4173,
    host: true,
  },

  // Optimize for Cloudflare Pages
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@remix-run/react',
      '@remix-run/node',
      '@headlessui/react',
      '@heroicons/react',
    ],
  },
});