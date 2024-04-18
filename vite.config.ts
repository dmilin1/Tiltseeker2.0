import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  root: 'client',
  build: {
    outDir: '../dist/client',
  },
  plugins: [
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
    TanStackRouterVite({
      routesDirectory: 'client/routes',
      generatedRouteTree: 'client/generatedRouteTree.ts',
    }),
  ],
})
