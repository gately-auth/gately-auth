import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';
// The helpcenter is always deployed at root on Cloudflare Pages.
// Sub-path support (e.g. usegately.com/docs) is handled entirely by the
// Cloudflare Worker proxy which strips the prefix before forwarding here.
// No base path needed in the build.

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    mode: 'directory',
    functionPerRoute: false,
    imageService: 'compile',
    sessions: false
  }),
  build: {
    assets: '_helio',
  },
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  devToolbar: {
    enabled: false
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'tap'
  },
  vite: {
    ssr: {
      noExternal: ['@iconify/react'],
      external: ['react-syntax-highlighter']
    },
    resolve: {
      alias: {
        '@': '/src',
      }
    },
    logLevel: 'error',
    server: {
      hmr: {
        overlay: false
      }
    }
  }
});
