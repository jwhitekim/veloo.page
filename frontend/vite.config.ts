import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:9000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/paper': apiUrl,
        '/translate': apiUrl,
        '/arch-trainer': apiUrl,
        '/todo': apiUrl,
      },
    },
  }
})
