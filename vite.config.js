import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Las variables VITE_* se exponen al cliente intencionalmente.
  // NUNCA pongas secrets aqui — solo la URL del API esta bien.
  // Los secrets (JWT_SECRET) van SOLO en el backend (Vercel env vars).
})
