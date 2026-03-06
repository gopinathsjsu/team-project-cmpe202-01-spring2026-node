import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// const __current_directory = path.resolve()


// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
