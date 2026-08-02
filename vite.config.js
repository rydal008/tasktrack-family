import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: false,
    // Building while the dev server runs made its watcher crash on EBUSY.
    watch: {
      ignored: ['**/dist/**'],
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
