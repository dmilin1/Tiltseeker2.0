import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  root: 'client',
  build: {
    outDir: '../dist/client',
  },
  plugins: [react({ include: /\.(mdx|js|jsx|ts|tsx)$/ })],
})
