import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// const __current_directory = path.resolve()


// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    // Route API calls to the right microservice (see node_backend_app/docker-compose.yaml ports).
    proxy: {
      '/api/v1/auth': { target: 'http://localhost:8081', changeOrigin: true },
      '/api/v1/me': { target: 'http://localhost:8081', changeOrigin: true },
      '/api/v1/admin': { target: 'http://localhost:8081', changeOrigin: true },
      '/api/v1/organizers': { target: 'http://localhost:8081', changeOrigin: true },
      '/api/v1/bookings': { target: 'http://localhost:8082', changeOrigin: true },
      '/api/v1/ticket-types': { target: 'http://localhost:8082', changeOrigin: true },
      '/api/v1/events': { target: 'http://localhost:8080' },
      '/api/v1/discover': { target: 'http://localhost:8084' },

    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
