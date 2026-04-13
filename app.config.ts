import { defineConfig } from '@tanstack/start/config'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  server: {
    preset: 'vercel',
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
  },
})
