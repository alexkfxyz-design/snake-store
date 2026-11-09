import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Netlify publica en la raíz del dominio ("/"); GitHub Pages en "/snake-store/".
// Netlify define la variable NETLIFY=true durante su build.
export default defineConfig({
  plugins: [react()],
  base: process.env.NETLIFY ? '/' : '/snake-store/',
})
