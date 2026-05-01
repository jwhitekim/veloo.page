import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/paper': 'http://localhost:9000',
      '/translate': 'http://localhost:9000',
      '/arch-trainer': 'http://localhost:9000',
      '/todo': 'http://localhost:9000',
    },
  },
})
