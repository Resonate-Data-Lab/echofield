import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the build works when served from a domain root
  // (custom domain) or a subpath (e.g. a GitHub Pages project site).
  base: './',
  plugins: [react()],
})
