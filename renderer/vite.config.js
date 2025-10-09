// renderer/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',                 // <—— IMPORTANTE per build file://
  build: {
    outDir: 'dist'            // default, va bene così
  }
})
